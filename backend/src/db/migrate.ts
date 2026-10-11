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

import { getPool, isDatabaseConfigured } from './mysql.js'

export async function runMigrations(): Promise<{ success: boolean; executed: number; error?: string }> {
  if (!isDatabaseConfigured()) {
    return { success: false, executed: 0, error: 'Database is not configured in environment.' }
  }

  const schemaPath = path.resolve(__dirname, '../../../database/schema.sql')
  if (!fs.existsSync(schemaPath)) {
    return { success: false, executed: 0, error: `Schema file not found at ${schemaPath}` }
  }

  const sqlContent = fs.readFileSync(schemaPath, 'utf8')
  // Strip multi-line and single-line comments properly
  const cleanSql = sqlContent
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/--.*$/gm, '')

  const statements = cleanSql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  const pool = getPool()
  let count = 0

  try {
    await pool.query('SET FOREIGN_KEY_CHECKS = 0')
  } catch {
    // If not supported by user permissions, continue
  }

  for (const statement of statements) {
    if (!statement) continue
    try {
      await pool.query(statement)
      count++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`Migration error on statement: ${statement.slice(0, 80)}... \nError: ${msg}`)
      try { await pool.query('SET FOREIGN_KEY_CHECKS = 1') } catch {}
      return { success: false, executed: count, error: msg }
    }
  }

  try {
    await pool.query('SET FOREIGN_KEY_CHECKS = 1')
  } catch {}

  return { success: true, executed: count }
}

// If executed directly via CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations().then((res) => {
    if (res.success) {
      console.log(`Successfully executed ${res.executed} schema statements.`)
      process.exit(0)
    } else {
      console.error(`Migration failed: ${res.error}`)
      process.exit(1)
    }
  })
}
