import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import mysql, { type Pool, type PoolOptions, type RowDataPacket, type ResultSetHeader } from 'mysql2/promise'

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

let pool: Pool | null = null

export function isDatabaseConfigured(): boolean {
  if (process.env.MYSQL_URI || process.env.DATABASE_URL) return true
  return Boolean(process.env.MYSQL_HOST && process.env.MYSQL_USER && process.env.MYSQL_DATABASE)
}

export function getPool(): Pool {
  if (pool) return pool

  const connectionUri = process.env.MYSQL_URI || process.env.DATABASE_URL
  let options: PoolOptions

  if (connectionUri) {
    options = {
      uri: connectionUri,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: process.env.MYSQL_SSL_CA
        ? { ca: process.env.MYSQL_SSL_CA }
        : { rejectUnauthorized: false },
    }
  } else {
    options = {
      host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'campusassist',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: process.env.MYSQL_SSL === 'false'
        ? undefined
        : process.env.MYSQL_SSL_CA
          ? { ca: process.env.MYSQL_SSL_CA }
          : { rejectUnauthorized: false },
    }
  }

  pool = mysql.createPool(options)
  return pool
}

export async function testDatabaseConnection(): Promise<{ ok: boolean; message: string }> {
  if (!isDatabaseConfigured()) {
    return { ok: false, message: 'MySQL is not configured in environment variables.' }
  }
  try {
    const currentPool = getPool()
    const [rows] = await currentPool.query<RowDataPacket[]>('SELECT 1 AS alive')
    if (rows && rows[0]?.alive === 1) {
      return { ok: true, message: 'Connected to MySQL successfully.' }
    }
    return { ok: false, message: 'Unexpected ping response from database.' }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown database error'
    return { ok: false, message: `Database connection failed: ${msg}` }
  }
}

export async function query<T extends RowDataPacket[] | ResultSetHeader>(
  sql: string,
  params: any[] = []
): Promise<T> {
  const currentPool = getPool()
  const [result] = await currentPool.execute(sql, params as any)
  return result as T
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}
