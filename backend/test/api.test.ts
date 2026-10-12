import { describe, it, expect } from 'vitest'
import app from '../index.js'
import { signToken } from '../src/middleware/auth.js'

describe('CampusAssist API Endpoints', () => {
  it('GET /api/health returns status and system details', async () => {
    const res = await app.request('/api/health')
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.status).toBe('ok')
    expect(data.service).toBe('campusassist-api')
    expect(data.runtime).toBe('nodejs-typescript-hono')
    expect(data.database).toBeDefined()
    expect(data.ai).toBeDefined()
  })

  it('GET /api/categories returns service categories', async () => {
    const res = await app.request('/api/categories')
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThan(0)
    expect(data[0].id).toBeDefined()
  })

  it('POST /api/ai/classify-request returns category and priority recommendations', async () => {
    const res = await app.request('/api/ai/classify-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Bonafide certificate for passport verification',
        description: 'Need letter addressed to Regional Passport Officer.',
      }),
    })
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.category).toBeDefined()
    expect(data.priority).toBeDefined()
    expect(data.reasoning).toBeDefined()
  })

  it('POST /api/ai/improve-request returns improved draft schema', async () => {
    const res = await app.request('/api/ai/improve-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'wifi hostel broken',
        description: 'it is not working since morning in room 204',
      }),
    })
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.title).toBeTruthy()
    expect(data.description).toBeTruthy()
    expect(Array.isArray(data.keyChanges)).toBe(true)
  })

  it('POST /api/ai/chat supports English queries and document grounding', async () => {
    const res = await app.request('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'How do I request an attendance review and what is the minimum requirement?',
        history: [],
      }),
    })
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.reply).toBeTruthy()
    expect(data.sources).toBeDefined()
  }, 60000)

  it('POST /api/ai/chat supports Telugu queries', async () => {
    const res = await app.request('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'నాకు బోనఫైడ్ సర్టిఫికేట్ ఎలా లభిస్తుంది?',
        history: [],
      }),
    })
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.reply).toBeTruthy()
  }, 60000)

  it('POST /api/ai/copilot/summarize authorizes staff token and returns summary', async () => {
    const staffToken = signToken({
      id: 'staff-01',
      email: 'staff@campus.edu',
      role: 'staff',
      fullName: 'Support Staff',
    })

    const res = await app.request('/api/ai/copilot/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`,
      },
      body: JSON.stringify({
        requestId: 'REQ-DEMO-1',
        title: 'Hostel AC repair needed',
        description: 'AC unit leaking water in room 312 Block B',
      }),
    })
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.summary).toBeTruthy()
    expect(data.extractedFacts).toBeDefined()
    expect(data.suggestedReply).toBeTruthy()
  }, 60000)

  it('POST /api/ai/copilot/summarize rejects unauthorized student tokens with 403', async () => {
    const studentToken = signToken({
      id: 'student-01',
      email: 'student@campus.edu',
      role: 'student',
      fullName: 'Student User',
    })

    const res = await app.request('/api/ai/copilot/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ requestId: 'REQ-DEMO-1' }),
    })
    expect(res.status).toBe(403)
  })

  it('returns 404 for unknown API route', async () => {
    const res = await app.request('/api/nonexistent-route')
    expect(res.status).toBe(404)
  })
})
