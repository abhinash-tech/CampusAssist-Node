import crypto from 'node:crypto'
import { Hono } from 'hono'
import { z } from 'zod'
import { query, isDatabaseConfigured } from '../db/mysql.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise'

const requests = new Hono()

const createRequestSchema = z.object({
  title: z.string().trim().min(5).max(160),
  description: z.string().trim().min(15).max(5000),
  categoryId: z.string().trim().optional(),
  category: z.string().trim().optional(),
  priority: z.enum(['Low', 'Medium', 'High']).optional().default('Medium'),
})

const updateStatusSchema = z.object({
  status: z.enum(['Open', 'In progress', 'Resolved', 'Closed']),
  note: z.string().trim().max(1000).optional(),
})

const addCommentSchema = z.object({
  body: z.string().trim().min(1).max(2000),
})

requests.use('*', requireAuth)

// List requests (filtered by user ownership if student; all if staff/admin)
requests.get('/', async (c) => {
  if (!isDatabaseConfigured()) {
    return c.json({ error: 'SERVICE_UNAVAILABLE', message: 'Database service is unconfigured or unavailable.' }, 503)
  }

  const user = c.get('user')
  const statusFilter = c.req.query('status')
  const search = c.req.query('q')?.trim()

  try {
    let sql = `
      SELECT r.id, r.request_code AS requestCode, r.title, r.description,
             r.category_id AS categoryId, c.slug AS categorySlug, c.name AS categoryName,
             r.priority, r.status, r.created_by AS createdBy,
             u.full_name AS ownerName, u.email AS ownerEmail,
             a.full_name AS assigneeName,
             r.created_at AS createdAt, r.updated_at AS updatedAt
      FROM service_requests r
      LEFT JOIN request_categories c ON r.category_id = c.id
      LEFT JOIN users u ON r.created_by = u.id
      LEFT JOIN users a ON r.assigned_to = a.id
      WHERE 1=1
    `
    const params: unknown[] = []

    if (user.role === 'student') {
      sql += ' AND r.created_by = ?'
      params.push(user.id)
    }

    if (statusFilter && ['Open', 'In progress', 'Resolved', 'Closed'].includes(statusFilter)) {
      sql += ' AND r.status = ?'
      params.push(statusFilter)
    }

    if (search) {
      sql += ' AND (r.title LIKE ? OR r.request_code LIKE ? OR r.description LIKE ?)'
      const term = `%${search}%`
      params.push(term, term, term)
    }

    sql += ' ORDER BY r.created_at DESC LIMIT 100'

    const rows = await query<RowDataPacket[]>(sql, params)
    return c.json({ requests: rows, mode: 'database' })
  } catch (error) {
    console.error('Error listing requests:', error)
    return c.json({ error: 'DB_ERROR', message: 'Could not retrieve service requests.' }, 500)
  }
})

// Get request by ID (enforcing ownership)
requests.get('/:id', async (c) => {
  if (!isDatabaseConfigured()) {
    return c.json({ error: 'SERVICE_UNAVAILABLE', message: 'Database service is unconfigured or unavailable.' }, 503)
  }

  const user = c.get('user')
  const id = c.req.param('id')

  try {
    const rows = await query<RowDataPacket[]>(
      `SELECT r.id, r.request_code AS requestCode, r.title, r.description,
              r.category_id AS categoryId, c.slug AS categorySlug, c.name AS categoryName,
              r.priority, r.status, r.created_by AS createdBy,
              u.full_name AS ownerName, u.email AS ownerEmail,
              a.full_name AS assigneeName,
              r.created_at AS createdAt, r.updated_at AS updatedAt
       FROM service_requests r
       LEFT JOIN request_categories c ON r.category_id = c.id
       LEFT JOIN users u ON r.created_by = u.id
       LEFT JOIN users a ON r.assigned_to = a.id
       WHERE (r.id = ? OR r.request_code = ?) LIMIT 1`,
      [id, id]
    )

    if (!rows || rows.length === 0) {
      return c.json({ error: 'NOT_FOUND', message: 'Service request not found.' }, 404)
    }

    const item = rows[0]

    // Authorization: student can only view their own request
    if (user.role === 'student' && item.createdBy !== user.id) {
      return c.json({ error: 'FORBIDDEN', message: 'You do not have permission to view this request.' }, 403)
    }

    const activityRows = await query<RowDataPacket[]>(
      `SELECT a.id, a.event_type AS eventType, a.title, a.body, a.created_at AS createdAt,
              u.full_name AS actorName, u.role AS actorRole
       FROM request_activity a
       LEFT JOIN users u ON a.actor_id = u.id
       WHERE a.request_id = ?
       ORDER BY a.created_at ASC`,
      [item.id]
    )

    return c.json({
      request: {
        ...item,
        history: activityRows.map((act) => ({
          id: act.id,
          date: new Date(act.createdAt).toLocaleString(),
          title: act.title,
          body: act.body,
          actor: act.actorName || 'System',
          role: act.actorRole || 'system',
        })),
      },
      mode: 'database',
    })
  } catch (error) {
    console.error('Error fetching request:', error)
    return c.json({ error: 'DB_ERROR', message: 'Could not fetch service request.' }, 500)
  }
})

// Create request
requests.post('/', async (c) => {
  if (!isDatabaseConfigured()) {
    return c.json({ error: 'SERVICE_UNAVAILABLE', message: 'Database service is unconfigured or unavailable.' }, 503)
  }

  const user = c.get('user')
  const parsed = createRequestSchema.safeParse(await c.req.json().catch(() => null))

  if (!parsed.success) {
    return c.json({ error: 'INVALID_INPUT', message: 'Provide a title (min 5 chars) and description (min 15 chars).' }, 400)
  }

  const { title, description, categoryId, category, priority } = parsed.data
  const randSuffix = Math.floor(1000 + Math.random() * 9000).toString()
  const requestCode = `CA-${randSuffix}`

  try {
    const id = crypto.randomUUID()
    const rawCat = categoryId || category
    let resolvedCategoryId: string | null = null

    if (rawCat) {
      const catRows = await query<RowDataPacket[]>(
        'SELECT id FROM request_categories WHERE id = ? OR slug = ? LIMIT 1',
        [rawCat, rawCat]
      )
      if (catRows.length > 0) {
        resolvedCategoryId = catRows[0].id
      }
    }

    await query(
      `INSERT INTO service_requests (id, request_code, title, description, category_id, priority, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, 'Open', ?)`,
      [id, requestCode, title, description, resolvedCategoryId, priority, user.id]
    )

    // Log initial activity
    await query(
      `INSERT INTO request_activity (request_id, actor_id, event_type, title, body)
       VALUES (?, ?, 'created', 'Request submitted', 'Student submitted service request.')`,
      [id, user.id]
    )

    return c.json({
      request: { id, requestCode, title, description, categoryId, priority, status: 'Open', createdBy: user.id },
      mode: 'database',
    }, 201)
  } catch (error) {
    console.error('Error creating request:', error)
    return c.json({ error: 'CREATION_FAILED', message: 'Could not save service request.' }, 500)
  }
})

// Update status (staff/admin only)
requests.patch('/:id/status', requireRole('staff', 'admin'), async (c) => {
  if (!isDatabaseConfigured()) {
    return c.json({ error: 'SERVICE_UNAVAILABLE', message: 'Database service is unconfigured or unavailable.' }, 503)
  }

  const user = c.get('user')
  const id = c.req.param('id')
  const parsed = updateStatusSchema.safeParse(await c.req.json().catch(() => null))

  if (!parsed.success) {
    return c.json({ error: 'INVALID_INPUT', message: 'Provide a valid status (Open, In progress, Resolved, Closed).' }, 400)
  }

  const { status, note } = parsed.data

  try {
    const check = await query<RowDataPacket[]>('SELECT id, status FROM service_requests WHERE id = ? OR request_code = ? LIMIT 1', [id, id])
    if (!check.length) return c.json({ error: 'NOT_FOUND', message: 'Request not found.' }, 404)
    const targetId = check[0].id

    await query('UPDATE service_requests SET status = ? WHERE id = ?', [status, targetId])

    await query(
      `INSERT INTO request_activity (request_id, actor_id, event_type, title, body)
       VALUES (?, ?, 'status_changed', ?, ?)`,
      [targetId, user.id, `Status changed to ${status}`, note || `Staff (${user.fullName}) updated request status.`]
    )

    return c.json({ success: true, status, mode: 'database' })
  } catch (error) {
    console.error('Error updating status:', error)
    return c.json({ error: 'UPDATE_FAILED', message: 'Could not update status.' }, 500)
  }
})

// Add comment to request activity
requests.post('/:id/activity', async (c) => {
  if (!isDatabaseConfigured()) {
    return c.json({ error: 'SERVICE_UNAVAILABLE', message: 'Database service is unconfigured or unavailable.' }, 503)
  }

  const user = c.get('user')
  const id = c.req.param('id')
  const parsed = addCommentSchema.safeParse(await c.req.json().catch(() => null))

  if (!parsed.success) {
    return c.json({ error: 'INVALID_INPUT', message: 'Provide a comment body.' }, 400)
  }

  const { body } = parsed.data

  try {
    const check = await query<RowDataPacket[]>('SELECT id, created_by FROM service_requests WHERE id = ? OR request_code = ? LIMIT 1', [id, id])
    if (!check.length) return c.json({ error: 'NOT_FOUND', message: 'Request not found.' }, 404)
    const target = check[0]

    // Students can only comment on their own requests
    if (user.role === 'student' && target.created_by !== user.id) {
      return c.json({ error: 'FORBIDDEN', message: 'Cannot comment on another student’s request.' }, 403)
    }

    const title = user.role === 'student' ? 'Student note' : `Staff comment (${user.fullName})`
    const result = await query<ResultSetHeader>(
      `INSERT INTO request_activity (request_id, actor_id, event_type, title, body)
       VALUES (?, ?, 'comment', ?, ?)`,
      [target.id, user.id, title, body]
    )

    return c.json({
      activity: {
        id: result.insertId,
        title,
        body,
        actor: user.fullName,
        role: user.role,
        createdAt: new Date().toISOString(),
      },
      mode: 'database',
    }, 201)
  } catch (error) {
    console.error('Error adding activity comment:', error)
    return c.json({ error: 'COMMENT_FAILED', message: 'Could not add comment.' }, 500)
  }
})

// Delete request
requests.delete('/:id', async (c) => {
  if (!isDatabaseConfigured()) {
    return c.json({ error: 'SERVICE_UNAVAILABLE', message: 'Database service is unconfigured or unavailable.' }, 503)
  }

  const user = c.get('user')
  const id = c.req.param('id')

  try {
    const check = await query<RowDataPacket[]>('SELECT id, created_by, status FROM service_requests WHERE id = ? OR request_code = ? LIMIT 1', [id, id])
    if (!check.length) return c.json({ error: 'NOT_FOUND', message: 'Request not found.' }, 404)
    const target = check[0]

    // Only admin or the creator when status is Open can delete
    if (user.role !== 'admin' && (target.created_by !== user.id || target.status !== 'Open')) {
      return c.json({ error: 'FORBIDDEN', message: 'Cannot delete this request.' }, 403)
    }

    await query('DELETE FROM service_requests WHERE id = ?', [target.id])
    return c.json({ success: true, mode: 'database' })
  } catch (error) {
    console.error('Error deleting request:', error)
    return c.json({ error: 'DELETE_FAILED', message: 'Could not delete request.' }, 500)
  }
})

export default requests
