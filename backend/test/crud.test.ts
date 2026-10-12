import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import app from '../index.js'
import { query } from '../src/db/mysql.js'

describe('Backend CRUD & Ownership Authorization', () => {
  let studentAToken = ''
  let studentAId = ''
  let studentBToken = ''
  let studentBId = ''
  let staffToken = ''
  let staffId = ''
  let createdRequestId: string

  const timestamp = Date.now()
  const emailA = `test-student-a-${timestamp}@campus.edu`
  const emailB = `test-student-b-${timestamp}@campus.edu`
  const emailStaff = `test-staff-${timestamp}@campus.edu`

  beforeAll(async () => {
    // 1. Register Student A
    const resA = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: emailA,
        password: 'Password123!',
        fullName: 'Student Alice',
        department: 'CSE',
        section: 'A',
      }),
    })
    const dataA = await resA.json()
    studentAToken = dataA.token
    studentAId = dataA.user.id

    // 2. Register Student B
    const resB = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: emailB,
        password: 'Password123!',
        fullName: 'Student Bob',
        department: 'ECE',
        section: 'B',
      }),
    })
    const dataB = await resB.json()
    studentBToken = dataB.token
    studentBId = dataB.user.id

    // 3. Register Staff user and update role directly in DB
    const resStaff = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: emailStaff,
        password: 'Password123!',
        fullName: 'Staff Officer',
      }),
    })
    const dataStaff = await resStaff.json()
    staffId = dataStaff.user.id
    await query('UPDATE users SET role = ? WHERE id = ?', ['staff', staffId])

    // Login as staff to get a token with role: "staff"
    const loginStaff = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailStaff, password: 'Password123!' }),
    })
    const loginData = await loginStaff.json()
    staffToken = loginData.token
  })

  afterAll(async () => {
    try {
      if (createdRequestId) {
        await query('DELETE FROM service_requests WHERE id = ?', [createdRequestId])
      }
      if (studentAId) await query('DELETE FROM users WHERE id = ?', [studentAId])
      if (studentBId) await query('DELETE FROM users WHERE id = ?', [studentBId])
      if (staffId) await query('DELETE FROM users WHERE id = ?', [staffId])
    } catch (err) {
      console.warn('Test cleanup error:', err)
    }
  })

  it('allows authenticated student to create a service request in MySQL', async () => {
    const res = await app.request('/api/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentAToken}`,
      },
      body: JSON.stringify({
        title: 'Need duplicate ID card issued',
        description: 'Lost ID card in library block yesterday afternoon.',
        categoryId: 'cat-admin',
        priority: 'Medium',
      }),
    })

    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.request).toBeDefined()
    expect(data.request.id).toBeDefined()
    expect(data.request.title).toBe('Need duplicate ID card issued')
    expect(data.request.status).toBe('Open')
    createdRequestId = data.request.id
  })

  it('allows creator student to view their own request', async () => {
    expect(createdRequestId).toBeDefined()
    const res = await app.request(`/api/requests/${createdRequestId}`, {
      headers: { Authorization: `Bearer ${studentAToken}` },
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.request.id).toBe(createdRequestId)
    expect(data.request.history).toBeDefined()
  })

  it('blocks Student B from viewing Student A private request with 403 Forbidden', async () => {
    expect(createdRequestId).toBeDefined()
    const res = await app.request(`/api/requests/${createdRequestId}`, {
      headers: { Authorization: `Bearer ${studentBToken}` },
    })
    expect(res.status).toBe(403)
    const data = await res.json()
    expect(data.error).toBe('FORBIDDEN')
  })

  it('blocks Student B from commenting on Student A private request with 403 Forbidden', async () => {
    expect(createdRequestId).toBeDefined()
    const res = await app.request(`/api/requests/${createdRequestId}/activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentBToken}`,
      },
      body: JSON.stringify({ body: 'Unauthorized intrusion note' }),
    })
    expect(res.status).toBe(403)
    const data = await res.json()
    expect(data.error).toBe('FORBIDDEN')
  })

  it('allows creator student to add a comment to their own request', async () => {
    expect(createdRequestId).toBeDefined()
    const res = await app.request(`/api/requests/${createdRequestId}/activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentAToken}`,
      },
      body: JSON.stringify({ body: 'Attached proof of police complaint.' }),
    })
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.activity.body).toBe('Attached proof of police complaint.')
  })

  it('blocks unauthorized student from updating request status with 403 Forbidden', async () => {
    expect(createdRequestId).toBeDefined()
    const res = await app.request(`/api/requests/${createdRequestId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentAToken}`,
      },
      body: JSON.stringify({ status: 'Resolved', note: 'Self-resolved' }),
    })
    expect(res.status).toBe(403)
    const data = await res.json()
    expect(data.error).toBe('FORBIDDEN')
  })

  it('allows authorized staff to update request status', async () => {
    expect(createdRequestId).toBeDefined()
    const res = await app.request(`/api/requests/${createdRequestId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`,
      },
      body: JSON.stringify({ status: 'In progress', note: 'Processing replacement request with admin.' }),
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.status).toBe('In progress')
  })

  it('student list requests only returns their own requests', async () => {
    const res = await app.request('/api/requests', {
      headers: { Authorization: `Bearer ${studentAToken}` },
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data.requests)).toBe(true)
    for (const r of data.requests) {
      expect(r.createdBy).toBe(studentAId)
    }
  })

  it('rejects category creation by ordinary student with 403 Forbidden', async () => {
    const res = await app.request('/api/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentAToken}`,
      },
      body: JSON.stringify({ name: 'Unauthorized Category' }),
    })
    expect(res.status).toBe(403)
  })

  it('rejects knowledge article creation by ordinary student with 403 Forbidden', async () => {
    const res = await app.request('/api/knowledge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentAToken}`,
      },
      body: JSON.stringify({
        title: 'Unauthorized Guide',
        category: 'Academics',
        summary: 'Fake campus guide summary.',
        content: 'This guide should never be permitted to be created by student.',
      }),
    })
    expect(res.status).toBe(403)
  })
})

