import crypto from 'node:crypto'
import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { query, isDatabaseConfigured } from '../db/mysql.js'
import { requireAuth, signToken } from '../middleware/auth.js'
import type { RowDataPacket } from 'mysql2/promise'

const auth = new Hono()

const registerSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(100),
  fullName: z.string().trim().min(2).max(120),
  studentId: z.string().trim().max(50).optional(),
  department: z.string().trim().max(50).optional().default('CSE'),
  section: z.string().trim().max(10).optional().default('A'),
  role: z.enum(['student', 'staff', 'admin']).optional().default('student'),
})

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
})

auth.post('/register', async (c) => {
  const parsed = registerSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return c.json({ error: 'INVALID_INPUT', message: 'Provide valid registration details (name, email, password min 6 chars).' }, 400)
  }

  const { email, password, fullName, studentId, department, section, role } = parsed.data

  if (!isDatabaseConfigured()) {
    // Deterministic offline demo mode
    const demoId = `demo-user-${Date.now()}`
    const token = signToken({ id: demoId, email, role, fullName })
    return c.json({
      token,
      user: { id: demoId, email, fullName, studentId: studentId || 'DEMO123', department, section, role },
      mode: 'demo',
      message: 'Demo registration: Database not configured; session active in local memory.',
    }, 201)
  }

  try {
    const existing = await query<RowDataPacket[]>('SELECT id FROM users WHERE email = ? LIMIT 1', [email])
    if (existing && existing.length > 0) {
      return c.json({ error: 'EMAIL_IN_USE', message: 'An account with this email address already exists.' }, 409)
    }

    const id = crypto.randomUUID()
    const passwordHash = await bcrypt.hash(password, 10)

    await query(
      `INSERT INTO users (id, email, password_hash, full_name, student_id, department, section, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, email, passwordHash, fullName, studentId || null, department, section, role]
    )

    const userPayload = { id, email, fullName, studentId, department, section, role }
    const token = signToken({ id, email, role, fullName })

    return c.json({ token, user: userPayload, mode: 'database' }, 201)
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Database error'
    console.error('Registration error:', msg)
    return c.json({ error: 'REGISTRATION_FAILED', message: 'Could not create account.' }, 500)
  }
})

auth.post('/login', async (c) => {
  const parsed = loginSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return c.json({ error: 'INVALID_INPUT', message: 'Provide a valid email and password.' }, 400)
  }

  const { email, password } = parsed.data

  if (!isDatabaseConfigured()) {
    // Offline demo fallback login
    const demoId = 'demo-user-1'
    const role = email.includes('admin') ? 'admin' : email.includes('staff') ? 'staff' : 'student'
    const name = email.split('@')[0] || 'Demo User'
    const token = signToken({ id: demoId, email, role, fullName: name })
    return c.json({
      token,
      user: { id: demoId, email, fullName: name, role },
      mode: 'demo',
      message: 'Demo login: Database not configured; role inferred from email.',
    })
  }

  try {
    const rows = await query<RowDataPacket[]>(
      'SELECT id, email, password_hash, full_name, student_id, department, section, role FROM users WHERE email = ? LIMIT 1',
      [email]
    )

    if (!rows || rows.length === 0) {
      return c.json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' }, 401)
    }

    const user = rows[0]
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return c.json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' }, 401)
    }

    const authUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
    }
    const token = signToken(authUser)

    return c.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        studentId: user.student_id,
        department: user.department,
        section: user.section,
        role: user.role,
      },
      mode: 'database',
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Database error'
    console.error('Login error:', msg)
    return c.json({ error: 'LOGIN_FAILED', message: 'Login service encountered an error.' }, 500)
  }
})

auth.get('/me', requireAuth, async (c) => {
  const current = c.get('user')
  if (!isDatabaseConfigured()) {
    return c.json({ user: current, mode: 'demo' })
  }

  try {
    const rows = await query<RowDataPacket[]>(
      'SELECT id, email, full_name, student_id, department, section, role, created_at FROM users WHERE id = ? LIMIT 1',
      [current.id]
    )
    if (!rows || rows.length === 0) {
      return c.json({ user: current, mode: 'fallback' })
    }
    const row = rows[0]
    return c.json({
      user: {
        id: row.id,
        email: row.email,
        fullName: row.full_name,
        studentId: row.student_id,
        department: row.department,
        section: row.section,
        role: row.role,
        createdAt: row.created_at,
      },
      mode: 'database',
    })
  } catch (error) {
    return c.json({ user: current, mode: 'fallback' })
  }
})

export default auth
