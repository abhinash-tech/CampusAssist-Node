import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envCandidates = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend/.env'),
]
for (const p of envCandidates) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p })
    break
  }
}

import { serve } from '@hono/node-server'
import app from '../index.js'
import { closePool } from './db/mysql.js'

const port = Number(process.env.PORT || 3000)
const hostname = '0.0.0.0'

const server = serve({ fetch: app.fetch, port, hostname }, (info) => {
  console.log(`[CampusAssist API] Listening at http://${info.address}:${info.port}/api/health`)
})

async function gracefulShutdown(signal: string) {
  console.log(`\n[CampusAssist API] Received ${signal}. Shutting down gracefully...`)
  server.close(async () => {
    try {
      await closePool()
      console.log('[CampusAssist API] Database connections closed.')
    } catch (err) {
      console.error('[CampusAssist API] Error closing database pool:', err)
    }
    process.exit(0)
  })
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
