import crypto from 'node:crypto'
import { Hono } from 'hono'
import { z } from 'zod'
import { query, isDatabaseConfigured } from '../db/mysql.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import type { RowDataPacket } from 'mysql2/promise'

const categories = new Hono()

categories.get('/', async (c) => {
  if (!isDatabaseConfigured()) {
    return c.json({ error: 'SERVICE_UNAVAILABLE', message: 'Database service is unconfigured or unavailable.' }, 503)
  }
  try {
    const rows = await query<RowDataPacket[]>(
      'SELECT id, name, slug, description, is_active FROM request_categories WHERE is_active = TRUE ORDER BY name ASC'
    )
    return c.json(rows)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return c.json({ error: 'DB_ERROR', message: 'Could not fetch service categories.' }, 500)
  }
})

categories.post('/', requireAuth, requireRole('admin', 'staff'), async (c) => {
  if (!isDatabaseConfigured()) {
    return c.json({ error: 'SERVICE_UNAVAILABLE', message: 'Database service is unconfigured or unavailable.' }, 503)
  }

  const schema = z.object({
    name: z.string().trim().min(3).max(100),
    description: z.string().trim().max(1000).optional().default(''),
    slug: z.string().trim().max(60).optional(),
  })
  const parsed = schema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return c.json({ error: 'INVALID_INPUT', message: 'Provide a category name of at least 3 characters.' }, 400)
  }

  const { name, description } = parsed.data
  const slug = parsed.data.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  try {
    const id = crypto.randomUUID()
    await query(
      'INSERT INTO request_categories (id, name, slug, description, is_active) VALUES (?, ?, ?, ?, TRUE)',
      [id, name, slug, description]
    )
    return c.json({ category: { id, name, slug, description, is_active: true }, mode: 'database' }, 201)
  } catch (error) {
    console.error('Error creating category:', error)
    return c.json({ error: 'CATEGORY_CREATION_FAILED', message: 'Could not create category.' }, 500)
  }
})

categories.delete('/:id', requireAuth, requireRole('admin'), async (c) => {
  if (!isDatabaseConfigured()) {
    return c.json({ error: 'SERVICE_UNAVAILABLE', message: 'Database service is unconfigured or unavailable.' }, 503)
  }

  const id = c.req.param('id')
  try {
    await query('UPDATE request_categories SET is_active = FALSE WHERE id = ?', [id])
    return c.json({ success: true, mode: 'database' })
  } catch (error) {
    console.error('Error deleting category:', error)
    return c.json({ error: 'DELETE_FAILED', message: 'Could not delete category.' }, 500)
  }
})

export default categories
