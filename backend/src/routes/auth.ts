import crypto from 'node:crypto'
import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { query, isDatabaseConfigured } from '../db/mysql.js'
import { requireAuth, requireRole, signToken } from '../middleware/auth.js'
import type { RowDataPacket } from 'mysql2/promise'

const auth = new Hono()

const registerSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(100),
  fullName: z.string().trim().min(2).max(120),
  studentId: z.string().trim().max(50).optional(),
  department: z.string().trim().max(50).optional().default('CSE'),
  section: z.string().trim().max(10).optional().default('A'),
  role: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
})

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  studentId: z.string().trim().max(50).optional(),
  department: z.string().trim().max(50).optional(),
  section: z.string().trim().max(10).optional(),
})

const updateRoleSchema = z.object({
  role: z.enum(['student', 'staff', 'admin']),
})

auth.post('/register', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'INVALID_INPUT', message: 'Provide valid registration details (name, email, password min 6 chars).' }, 400)
  }

  const { email, password, fullName, studentId, department, section, role: requestedRole } = parsed.data

  // Role-escalation protection: Public registration must never grant staff or admin privileges
  if (requestedRole && requestedRole !== 'student') {
    return c.json({
      error: 'ROLE_ESCALATION_FORBIDDEN',
      message: 'Public registration cannot assign privileged roles (staff or admin). Roles are assigned server-side.'
    }, 403)
  }

  const assignedRole = 'student'

  if (!isDatabaseConfigured()) {
    return c.json({ error: 'SERVICE_UNAVAILABLE', message: 'Database service is unconfigured or unavailable.' }, 503)
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
      [id, email, passwordHash, fullName, studentId || null, department, section, assignedRole]
    )

    const userPayload = { id, email, fullName, studentId: studentId || null, department, section, role: assignedRole }
    const token = signToken({ id, email, role: assignedRole, fullName })

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
    return c.json({ error: 'SERVICE_UNAVAILABLE', message: 'Database service is unconfigured or unavailable.' }, 503)
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
    return c.json({ error: 'SERVICE_UNAVAILABLE', message: 'Database service is unconfigured or unavailable.' }, 503)
  }

  try {
    const rows = await query<RowDataPacket[]>(
      'SELECT id, email, full_name, student_id, department, section, role, created_at FROM users WHERE id = ? LIMIT 1',
      [current.id]
    )
    if (!rows || rows.length === 0) {
      return c.json({ error: 'UNAUTHORIZED', message: 'User account no longer exists.' }, 401)
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
    console.error('Error in /me:', error)
    return c.json({ error: 'DB_ERROR', message: 'Could not fetch user profile.' }, 500)
  }
})

auth.patch('/profile', requireAuth, async (c) => {
  if (!isDatabaseConfigured()) {
    return c.json({ error: 'SERVICE_UNAVAILABLE', message: 'Database service is unconfigured or unavailable.' }, 503)
  }

  const current = c.get('user')
  const parsed = updateProfileSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return c.json({ error: 'INVALID_INPUT', message: 'Invalid profile details.' }, 400)
  }

  const { fullName, studentId, department, section } = parsed.data

  try {
    const existing = await query<RowDataPacket[]>(
      'SELECT id, email, full_name, student_id, department, section, role FROM users WHERE id = ? LIMIT 1',
      [current.id]
    )
    if (!existing || existing.length === 0) {
      return c.json({ error: 'UNAUTHORIZED', message: 'User account not found.' }, 401)
    }

    const user = existing[0]
    const updatedName = fullName !== undefined ? fullName : user.full_name
    const updatedStudentId = studentId !== undefined ? studentId : user.student_id
    const updatedDept = department !== undefined ? department : user.department
    const updatedSec = section !== undefined ? section : user.section

    await query(
      'UPDATE users SET full_name = ?, student_id = ?, department = ?, section = ? WHERE id = ?',
      [updatedName, updatedStudentId, updatedDept, updatedSec, current.id]
    )

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: updatedName,
        studentId: updatedStudentId,
        department: updatedDept,
        section: updatedSec,
        role: user.role,
      },
      message: 'Profile updated successfully.',
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return c.json({ error: 'UPDATE_FAILED', message: 'Could not update profile.' }, 500)
  }
})

// Administrator promotion of user roles
auth.patch('/users/:id/role', requireAuth, requireRole('admin'), async (c) => {
  if (!isDatabaseConfigured()) {
    return c.json({ error: 'SERVICE_UNAVAILABLE', message: 'Database service is unconfigured or unavailable.' }, 503)
  }

  const targetId = c.req.param('id')
  const parsed = updateRoleSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return c.json({ error: 'INVALID_INPUT', message: 'Provide a valid role (student, staff, admin).' }, 400)
  }

  const { role: newRole } = parsed.data

  try {
    const existing = await query<RowDataPacket[]>('SELECT id FROM users WHERE id = ? LIMIT 1', [targetId])
    if (!existing || existing.length === 0) {
      return c.json({ error: 'NOT_FOUND', message: 'Target user does not exist.' }, 404)
    }

    await query('UPDATE users SET role = ? WHERE id = ?', [newRole, targetId])
    return c.json({ success: true, userId: targetId, role: newRole })
  } catch (error) {
    console.error('Role update error:', error)
    return c.json({ error: 'UPDATE_FAILED', message: 'Could not update role.' }, 500)
  }
})

export default auth
