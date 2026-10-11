import 'dotenv/config'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { isDatabaseConfigured, testDatabaseConnection } from './src/db/mysql.js'
import { isAIAvailable } from './src/services/ai.js'
import { authMiddleware } from './src/middleware/auth.js'
import authRoutes from './src/routes/auth.js'
import requestRoutes from './src/routes/requests.js'
import categoryRoutes from './src/routes/categories.js'
import knowledgeRoutes from './src/routes/knowledge.js'
import aiRoutes from './src/routes/ai.js'

const app = new Hono().basePath('/api')

// CORS Configuration
const configuredOrigins = (process.env.FRONTEND_ORIGINS ?? '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)

app.use('*', cors({
  origin: configuredOrigins.length ? (origin) => {
    if (!origin) return '*'
    // Match exact configured origins or Vercel preview URLs if configured
    if (configuredOrigins.includes(origin) || configuredOrigins.includes('*')) return origin
    if (configuredOrigins.some((allowed) => allowed.includes('vercel.app') && origin.endsWith('.vercel.app'))) return origin
    return null
  } : '*',
  allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
  allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  maxAge: 600,
}))

app.use('*', logger())
app.use('*', secureHeaders())
app.use('*', authMiddleware)

// Health and Status Check
app.get('/health', async (c) => {
  const dbConfigured = isDatabaseConfigured()
  const dbStatus = dbConfigured ? await testDatabaseConnection() : { ok: false, message: 'MySQL unconfigured' }

  return c.json({
    status: 'ok',
    service: 'campusassist-api',
    runtime: 'nodejs-typescript-hono',
    ai: isAIAvailable() ? 'configured' : 'demo-mode',
    database: dbConfigured ? (dbStatus.ok ? 'connected' : 'connection-failed') : 'not-configured',
    dbDetails: dbStatus.message,
    timestamp: new Date().toISOString(),
  })
})

// Sub-routers
app.route('/auth', authRoutes)
app.route('/requests', requestRoutes)
app.route('/categories', categoryRoutes)
app.route('/knowledge', knowledgeRoutes)
app.route('/ai', aiRoutes)

// 404 & Centralized Error Handlers
app.notFound((c) => c.json({ error: 'NOT_FOUND', message: 'This CampusAssist API route does not exist.' }, 404))

app.onError((error, c) => {
  console.error('Unhandled API error:', error.message)
  return c.json({ error: 'INTERNAL_ERROR', message: 'An unexpected API error occurred.' }, 500)
})

export default app
