import type { Context, Next } from 'hono'
import jwt from 'jsonwebtoken'

export type AuthUser = {
  id: string
  email: string
  role: 'student' | 'staff' | 'admin'
  fullName: string
}

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'campusassist-dev-insecure-secret-change-in-prod'

export function signToken(user: AuthUser, expiresIn: string | number = '7d'): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.fullName,
    },
    JWT_SECRET,
    { expiresIn: expiresIn as any }
  )
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      sub: string
      email: string
      role: 'student' | 'staff' | 'admin'
      name: string
    }
    const sub = payload.sub || (payload as any).id || (payload as any).userId
    return {
      id: sub,
      email: payload.email,
      role: payload.role,
      fullName: payload.name || (payload as any).fullName || '',
    }
  } catch {
    return null
  }
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim()
    const user = verifyToken(token)
    if (user) {
      c.set('user', user)
    }
  }
  await next()
}

export async function requireAuth(c: Context, next: Next) {
  const user = c.get('user')
  if (!user) {
    return c.json({ error: 'UNAUTHORIZED', message: 'You must be signed in to perform this action.' }, 401)
  }
  await next()
}

export function requireRole(...allowedRoles: Array<'student' | 'staff' | 'admin'>) {
  return async (c: Context, next: Next) => {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'UNAUTHORIZED', message: 'Authentication required.' }, 401)
    }
    if (!allowedRoles.includes(user.role)) {
      return c.json({ error: 'FORBIDDEN', message: 'You do not have permission to access this resource.' }, 403)
    }
    await next()
  }
}
