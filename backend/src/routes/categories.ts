import crypto from 'node:crypto'
import { Hono } from 'hono'
import { z } from 'zod'
import { query, isDatabaseConfigured } from '../db/mysql.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import type { RowDataPacket } from 'mysql2/promise'

const categories = new Hono()

const defaultCategories = [
  { id: 'cat-academic', name: 'Academic support', slug: 'academic', description: 'Coursework, grades, attendance and academic records.', is_active: true },
  { id: 'cat-campus', name: 'Campus services', slug: 'campus', description: 'Facilities, transport, hostel and campus life.', is_active: true },
  { id: 'cat-technical', name: 'IT & digital access', slug: 'technical', description: 'Accounts, Wi-Fi, LMS and technical assistance.', is_active: true },
  { id: 'cat-admin', name: 'Administration', slug: 'administration', description: 'Certificates, documents and administrative requests.', is_active: true },
]

categories.get('/', async (c) => {
  if (!isDatabaseConfigured()) {
    return c.json(defaultCategories)
  }
  try {
    const rows = await query<RowDataPacket[]>(
      'SELECT id, name, slug, description, is_active FROM request_categories WHERE is_active = TRUE ORDER BY name ASC'
    )
    return c.json(rows.length ? rows : defaultCategories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return c.json(defaultCategories)
  }
})

categories.post('/', requireAuth, requireRole('admin', 'staff'), async (c) => {
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

  if (!isDatabaseConfigured()) {
    return c.json({
      category: { id: `cat-${Date.now()}`, name, slug, description, is_active: true },
      mode: 'demo',
    }, 201)
  }

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
  const id = c.req.param('id')
  if (!isDatabaseConfigured()) {
    return c.json({ success: true, mode: 'demo' })
  }
  try {
    await query('UPDATE request_categories SET is_active = FALSE WHERE id = ?', [id])
    return c.json({ success: true, mode: 'database' })
  } catch (error) {
    console.error('Error deleting category:', error)
    return c.json({ error: 'DELETE_FAILED', message: 'Could not delete category.' }, 500)
  }
})

export default categories
