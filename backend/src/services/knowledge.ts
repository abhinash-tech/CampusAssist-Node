import crypto from 'node:crypto'
import { query, isDatabaseConfigured } from '../db/mysql.js'
import type { RowDataPacket } from 'mysql2/promise'

export type KnowledgeArticle = {
  id: string
  title: string
  category: string
  summary: string
  content: string
  slug?: string
}

export type RetrievedChunk = {
  articleId: string
  title: string
  category: string
  chunkContent: string
  score: number
}

export const sampleArticles: KnowledgeArticle[] = [
  {
    id: 'art-attendance',
    slug: 'attendance-review',
    title: 'How to request an attendance review',
    category: 'Academics',
    summary: 'Include the relevant date, subject, period and the discrepancy you noticed.',
    content: 'Submit an academic support request. Include the attendance date, subject, period, any supporting evidence and the correction you are requesting. Anurag University attendance regulations require maintaining a minimum of 75% attendance to be eligible for end-semester examinations. Condonation may be considered between 65% and 75% on genuine medical grounds with certified documentation. Attendance discrepancies must be brought to the department office within 7 working days.',
  },
  {
    id: 'art-certificates',
    slug: 'student-certificates',
    title: 'Requesting student certificates',
    category: 'Administration',
    summary: 'Start an administration request and specify the certificate type and purpose.',
    content: 'For a bonafide certificate, study certificate, custody certificate, or fee estimate letter, submit an administration request specifying the exact certificate and purpose (such as passport application, bank loan, bus pass, or scholarship). Standard processing time is 2 to 3 working days through the student administration office. Bring your college identity card when collecting original physical copies.',
  },
  {
    id: 'art-wifi',
    slug: 'campus-wifi',
    title: 'Connecting to campus Wi-Fi',
    category: 'Digital services',
    summary: 'Describe the location, device, affected service and error message.',
    content: 'To connect to Anurag University campus Wi-Fi, select AU-Student network and authenticate using your student roll number and student portal password. For connection failures, submit an IT ticket specifying your device MAC address, current campus block/building, and error message. Never disclose or share your password, PIN, or OTP with anyone.',
  },
  {
    id: 'art-facilities',
    slug: 'campus-facilities',
    title: 'Facilities and maintenance requests',
    category: 'Campus life',
    summary: 'Report the location and a clear description of the maintenance issue.',
    content: 'Use a campus services request for classroom amenities, water supply issues, air conditioning, hostel maintenance, or transport/bus routes. State the exact building, floor, room number, and problem description. For urgent electrical hazards or immediate safety risks, notify campus security or facilities desk in Block A directly.',
  },
]

// Unicode-aware tokenization supporting English, Telugu, and other scripts
export function tokenizeText(text: string): string[] {
  // Matches consecutive Unicode letters, combining marks (vital for Telugu/Indic scripts), and numbers
  const matches = text.toLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu)
  if (!matches) return []
  return matches.filter((w) => w.length >= 2)
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

export function chunkText(text: string, maxWords = 120): string[] {
  const paragraphs = text.split(/\n\s*\n/)
  const chunks: string[] = []
  for (const para of paragraphs) {
    const words = para.trim().split(/\s+/)
    if (words.length <= maxWords) {
      if (para.trim()) chunks.push(para.trim())
    } else {
      for (let i = 0; i < words.length; i += maxWords) {
        chunks.push(words.slice(i, i + maxWords).join(' '))
      }
    }
  }
  return chunks.length ? chunks : [text]
}

const STOP_WORDS = new Set([
  'what', 'how', 'the', 'is', 'are', 'for', 'and', 'to', 'in', 'a', 'an',
  'can', 'i', 'you', 'my', 'it', 'of', 'on', 'do', 'does', 'did', 'where',
  'when', 'who', 'which', 'why', 'with', 'about', 'from', 'get', 'any', 'tell'
])

export async function findKnowledgeArticles(queryText: string): Promise<KnowledgeArticle[]> {
  const terms = tokenizeText(queryText).filter((t) => !STOP_WORDS.has(t) && t.length >= 3)
  if (!terms.length) return []

  let articles: KnowledgeArticle[] = sampleArticles

  if (isDatabaseConfigured()) {
    try {
      const rows = await query<RowDataPacket[]>(
        'SELECT id, slug, title, category, summary, content FROM knowledge_articles WHERE is_published = TRUE'
      )
      if (rows && rows.length > 0) {
        articles = rows as KnowledgeArticle[]
      }
    } catch (err) {
      console.warn('Could not read knowledge from MySQL, falling back to local dataset:', err)
    }
  }

  // Score articles by term frequency across title, category, summary, and content
  const scored = articles.map((article) => {
    const searchable = `${article.title} ${article.category} ${article.summary} ${article.content}`.toLowerCase()
    let score = 0
    for (const term of terms) {
      if (searchable.includes(term)) {
        score += term.length >= 4 ? 2 : 1
      }
    }
    return { article, score }
  })

  return scored
    .filter((entry) => entry.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((e) => e.article)
}

export async function retrieveGroundedChunks(
  queryText: string,
  queryEmbedding?: number[] | null
): Promise<RetrievedChunk[]> {
  // If vector embedding is provided and MySQL is configured, perform vector similarity search
  if (queryEmbedding && isDatabaseConfigured()) {
    try {
      const rows = await query<RowDataPacket[]>(
        `SELECT c.article_id AS articleId, a.title, a.category, c.content AS chunkContent, c.embedding_json
         FROM knowledge_chunks c
         JOIN knowledge_articles a ON c.article_id = a.id
         WHERE a.is_published = TRUE AND c.embedding_json IS NOT NULL`
      )

      if (rows && rows.length > 0) {
        const scoredChunks: RetrievedChunk[] = []
        for (const row of rows) {
          try {
            const emb: number[] = typeof row.embedding_json === 'string'
              ? JSON.parse(row.embedding_json)
              : row.embedding_json
            if (Array.isArray(emb) && emb.length === queryEmbedding.length) {
              const score = cosineSimilarity(queryEmbedding, emb)
              if (score >= 0.55) {
                scoredChunks.push({
                  articleId: row.articleId,
                  title: row.title,
                  category: row.category,
                  chunkContent: row.chunkContent,
                  score,
                })
              }
            }
          } catch {
            // Skip invalid embedding row
          }
        }

        if (scoredChunks.length > 0) {
          scoredChunks.sort((a, b) => b.score - a.score)
          return scoredChunks.slice(0, 4)
        }
      }
    } catch (err) {
      console.warn('Vector chunk retrieval encountered an error, falling back to token matching:', err)
    }
  }

  // Fallback: tokenize query text and retrieve matching articles only if keyword threshold is met
  const matchedArticles = await findKnowledgeArticles(queryText)
  if (!matchedArticles.length) return []

  return matchedArticles.map((art) => ({
    articleId: art.id,
    title: art.title,
    category: art.category,
    chunkContent: `${art.summary}\n${art.content}`,
    score: 1.0,
  }))
}
