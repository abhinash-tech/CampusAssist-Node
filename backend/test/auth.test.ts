import { describe, it, expect } from 'vitest'
import bcrypt from 'bcryptjs'
import { signToken, verifyToken } from '../src/middleware/auth.js'

describe('Authentication & Security', () => {
  it('hashes passwords and verifies matching hashes', async () => {
    const raw = 'SuperSecret123!'
    const salt = await bcrypt.genSalt(10)
    const hashed = await bcrypt.hash(raw, salt)

    expect(hashed).not.toBe(raw)
    const valid = await bcrypt.compare(raw, hashed)
    expect(valid).toBe(true)

    const invalid = await bcrypt.compare('WrongPassword', hashed)
    expect(invalid).toBe(false)
  })

  it('signs and verifies JWT tokens with user payload', () => {
    const userPayload = {
      id: 'usr-1234',
      email: 'student@campus.edu',
      role: 'student' as const,
      fullName: 'Test Student',
    }

    const token = signToken(userPayload)
    expect(typeof token).toBe('string')
    expect(token.split('.').length).toBe(3)

    const decoded = verifyToken(token)
    expect(decoded).not.toBeNull()
    expect(decoded?.id).toBe('usr-1234')
    expect(decoded?.email).toBe('student@campus.edu')
    expect(decoded?.role).toBe('student')
  })

  it('rejects tampered or malformed tokens', () => {
    const validToken = signToken({ id: '1', email: 'test@a.com', role: 'student', fullName: 'A' })
    const tampered = validToken.slice(0, -5) + 'xxxxx'
    const decodedTampered = verifyToken(tampered)
    expect(decodedTampered).toBeNull()

    const malformed = verifyToken('not.a.token')
    expect(malformed).toBeNull()
  })
})
