import { Hono } from 'hono'
import { z } from 'zod'
import {
  answerCampusQuestion,
  classifySupportRequest,
  improveSupportRequest,
  summarizeRequestForStaff,
} from '../services/ai.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { query, isDatabaseConfigured } from '../db/mysql.js'
import type { RowDataPacket } from 'mysql2/promise'

const ai = new Hono()

const historyItemSchema = z.object({
  role: z.enum(['user', 'assistant']),
  text: z.string().trim().min(1).max(2000),
})

// 1. Campus Assistant Q&A (Supports English & Telugu)
ai.post('/chat', async (c) => {
  const schema = z.object({
    message: z.string().trim().min(1).max(4000),
    history: z.array(historyItemSchema).max(10).optional().default([]),
    language: z.enum(['English', 'Telugu', 'Mixed']).optional().default('English'),
  })
  const parsed = schema.safeParse(await c.req.json().catch(() => null))

  if (!parsed.success) {
    return c.json({ error: 'INVALID_INPUT', message: 'Provide a message between 1 and 4000 characters.' }, 400)
  }

  try {
    const result = await answerCampusQuestion(parsed.data.message, parsed.data.history, parsed.data.language)
    return c.json(result)
  } catch (error) {
    console.error('AI chat error:', error)
    return c.json({ error: 'AI_UNAVAILABLE', message: 'The campus assistant is temporarily unavailable.' }, 502)
  }
})

// 2. Smart Request Classification
ai.post('/classify-request', async (c) => {
  const schema = z.object({
    title: z.string().trim().min(3).max(160),
    description: z.string().trim().min(5).max(4000),
  })
  const parsed = schema.safeParse(await c.req.json().catch(() => null))

  if (!parsed.success) {
    return c.json({ error: 'INVALID_INPUT', message: 'Provide a title (min 3 chars) and description (min 5 chars).' }, 400)
  }

  try {
    const result = await classifySupportRequest(parsed.data.title, parsed.data.description)
    return c.json(result)
  } catch (error) {
    console.error('Classification error:', error)
    return c.json({ error: 'AI_UNAVAILABLE', message: 'Classification service temporarily unavailable.' }, 502)
  }
})

// 3. AI Request Writing Assistant
ai.post('/improve-request', async (c) => {
  const schema = z.object({
    title: z.string().trim().max(160).optional().default(''),
    description: z.string().trim().min(3).max(4000),
  })
  const parsed = schema.safeParse(await c.req.json().catch(() => null))

  if (!parsed.success) {
    return c.json({ error: 'INVALID_INPUT', message: 'Provide a description of at least 3 characters.' }, 400)
  }

  try {
    const result = await improveSupportRequest(parsed.data.title, parsed.data.description)
    return c.json(result)
  } catch (error) {
    console.error('Improve request error:', error)
    return c.json({ error: 'AI_UNAVAILABLE', message: 'Writing assistant temporarily unavailable.' }, 502)
  }
})

// 4. Staff Copilot (Requires Staff or Admin Role)
ai.post('/copilot/summarize', requireAuth, requireRole('staff', 'admin'), async (c) => {
  const schema = z.object({
    requestId: z.string().trim().min(1),
    title: z.string().optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    priority: z.string().optional(),
  })
  const parsed = schema.safeParse(await c.req.json().catch(() => null))

  if (!parsed.success) {
    return c.json({ error: 'INVALID_INPUT', message: 'Provide a valid requestId.' }, 400)
  }

  const { requestId, title, description, category, priority } = parsed.data

  if (!isDatabaseConfigured()) {
    // Offline / Demo summary using provided fields or realistic defaults
    const summary = await summarizeRequestForStaff({
      requestCode: requestId,
      title: title || 'Attendance discrepancy in Mathematics II',
      description: description || 'Present on Oct 5th period 2, but marked absent in portal.',
      category: category || 'academic',
      priority: priority || 'High',
      status: 'In progress',
      history: [
        { title: 'Request submitted', body: 'Student submitted ticket.', date: 'Oct 06', actor: 'Student' },
        { title: 'Assigned', body: 'Assigned to Student Services.', date: 'Oct 07', actor: 'System' },
      ],
    })
    return c.json(summary)
  }

  try {
    const rows = await query<RowDataPacket[]>(
      `SELECT r.id, r.request_code, r.title, r.description, r.priority, r.status,
              c.name AS category_name
       FROM service_requests r
       LEFT JOIN request_categories c ON r.category_id = c.id
       WHERE r.id = ? OR r.request_code = ? LIMIT 1`,
      [requestId, requestId]
    )

    if (!rows || rows.length === 0) {
      if (title && description) {
        // Fallback to client-provided details if record isn't in DB yet
        const summary = await summarizeRequestForStaff({
          requestCode: requestId,
          title,
          description,
          category: category || 'General support',
          priority: priority || 'Medium',
          status: 'Open',
          history: [],
        })
        return c.json(summary)
      }
      return c.json({ error: 'NOT_FOUND', message: 'Request record not found.' }, 404)
    }

    const req = rows[0]
    const activityRows = await query<RowDataPacket[]>(
      `SELECT a.title, a.body, a.created_at, u.full_name AS actor_name
       FROM request_activity a
       LEFT JOIN users u ON a.actor_id = u.id
       WHERE a.request_id = ?
       ORDER BY a.created_at ASC`,
      [req.id]
    )

    const history = activityRows.map((act) => ({
      title: act.title,
      body: act.body || '',
      date: new Date(act.created_at).toLocaleDateString(),
      actor: act.actor_name || 'System',
    }))

    const summary = await summarizeRequestForStaff({
      requestCode: req.request_code,
      title: req.title,
      description: req.description,
      category: req.category_name || 'General',
      priority: req.priority,
      status: req.status,
      history,
    })

    return c.json(summary)
  } catch (error) {
    console.error('Copilot summarize error:', error)
    return c.json({ error: 'COPILOT_FAILED', message: 'Could not generate staff summary.' }, 500)
  }
})

export default ai
