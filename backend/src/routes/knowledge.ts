import crypto from 'node:crypto'
import { Hono } from 'hono'
import { z } from 'zod'
import { query, isDatabaseConfigured } from '../db/mysql.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { findKnowledgeArticles, chunkText } from '../services/knowledge.js'
import { generateEmbedding } from '../services/ai.js'
import type { RowDataPacket } from 'mysql2/promise'

const knowledge = new Hono()

const createArticleSchema = z.object({
  title: z.string().trim().min(4).max(200),
  category: z.string().trim().min(2).max(60),
  summary: z.string().trim().min(10).max(1000),
  content: z.string().trim().min(20).max(10000),
  slug: z.string().trim().max(100).optional(),
  isPublished: z.boolean().optional().default(true),
})

knowledge.get('/', async (c) => {
  if (!isDatabaseConfigured()) {
    return c.json({ error: 'SERVICE_UNAVAILABLE', message: 'Database service is unconfigured or unavailable.' }, 503)
  }
  try {
    const rows = await query<RowDataPacket[]>(
      'SELECT id, slug, title, category, summary, content, is_published AS isPublished, updated_at AS updatedAt FROM knowledge_articles WHERE is_published = TRUE ORDER BY title ASC'
    )
    return c.json({ articles: rows, mode: 'database' })
  } catch (error) {
    console.error('Error fetching articles:', error)
    return c.json({ error: 'DB_ERROR', message: 'Could not fetch knowledge articles.' }, 500)
  }
})

knowledge.get('/search', async (c) => {
  if (!isDatabaseConfigured()) {
    return c.json({ error: 'SERVICE_UNAVAILABLE', message: 'Database service is unconfigured or unavailable.' }, 503)
  }
  const queryParam = (c.req.query('q') ?? '').trim().slice(0, 200)
  if (!queryParam) {
    return c.json({ items: [], mode: 'database' })
  }
  const items = await findKnowledgeArticles(queryParam)
  return c.json({ items, mode: 'database' })
})

knowledge.post('/', requireAuth, requireRole('admin', 'staff'), async (c) => {
  if (!isDatabaseConfigured()) {
    return c.json({ error: 'SERVICE_UNAVAILABLE', message: 'Database service is unconfigured or unavailable.' }, 503)
  }

  const parsed = createArticleSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return c.json({ error: 'INVALID_INPUT', message: 'Provide a title, category, summary, and content (min 20 chars).' }, 400)
  }

  const user = c.get('user')
  const { title, category, summary, content, isPublished } = parsed.data
  const slug = parsed.data.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  try {
    const id = crypto.randomUUID()
    await query(
      `INSERT INTO knowledge_articles (id, slug, title, category, summary, content, is_published, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, slug, title, category, summary, content, isPublished, user.id]
    )

    // Chunk text and store chunks with embeddings if available
    const chunks = chunkText(content)
    for (let i = 0; i < chunks.length; i++) {
      const chunkId = crypto.randomUUID()
      const chunkContent = chunks[i]
      const embedding = await generateEmbedding(chunkContent)
      const embeddingJson = embedding ? JSON.stringify(embedding) : null

      await query(
        `INSERT INTO knowledge_chunks (id, article_id, chunk_index, content, embedding_json)
         VALUES (?, ?, ?, ?, ?)`,
        [chunkId, id, i, chunkContent, embeddingJson]
      )
    }

    return c.json({
      article: { id, slug, title, category, summary, content, isPublished },
      chunksCreated: chunks.length,
      mode: 'database',
    }, 201)
  } catch (error) {
    console.error('Error saving article:', error)
    return c.json({ error: 'CREATION_FAILED', message: 'Could not create knowledge article.' }, 500)
  }
})

knowledge.delete('/:id', requireAuth, requireRole('admin'), async (c) => {
  if (!isDatabaseConfigured()) {
    return c.json({ error: 'SERVICE_UNAVAILABLE', message: 'Database service is unconfigured or unavailable.' }, 503)
  }

  const id = c.req.param('id')
  try {
    await query('DELETE FROM knowledge_articles WHERE id = ?', [id])
    return c.json({ success: true, mode: 'database' })
  } catch (error) {
    console.error('Error deleting article:', error)
    return c.json({ error: 'DELETE_FAILED', message: 'Could not delete article.' }, 500)
  }
})

export default knowledge
