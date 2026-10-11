import { describe, it, expect } from 'vitest'
import { tokenizeText, cosineSimilarity, chunkText, findKnowledgeArticles } from '../src/services/knowledge.js'
import { classifySupportRequest, improveSupportRequest, summarizeRequestForStaff } from '../src/services/ai.js'

describe('Knowledge & Unicode Support', () => {
  it('tokenizes English text accurately', () => {
    const text = 'How to request bonafide certificate for scholarship?'
    const tokens = tokenizeText(text)
    expect(tokens).toContain('how')
    expect(tokens).toContain('request')
    expect(tokens).toContain('bonafide')
    expect(tokens).toContain('certificate')
    expect(tokens).toContain('scholarship')
  })

  it('tokenizes Telugu Unicode characters correctly without truncation', () => {
    const teluguText = 'హాస్టల్ ఫీజు మరియు అటెండెన్స్ నియమాలు ఏమిటి?'
    const tokens = tokenizeText(teluguText)
    expect(tokens.length).toBeGreaterThan(0)
    // Verify Telugu words are retained as complete tokens
    expect(tokens).toContain('హాస్టల్')
    expect(tokens).toContain('ఫీజు')
    expect(tokens).toContain('మరియు')
    expect(tokens).toContain('అటెండెన్స్')
  })

  it('calculates cosine similarity correctly for identical, orthogonal, and arbitrary vectors', () => {
    const v1 = [1, 0, 0]
    const v2 = [1, 0, 0]
    const v3 = [0, 1, 0]
    const v4 = [0.6, 0.8]
    const v5 = [0.8, 0.6]

    expect(cosineSimilarity(v1, v2)).toBeCloseTo(1.0, 5)
    expect(cosineSimilarity(v1, v3)).toBeCloseTo(0.0, 5)
    expect(cosineSimilarity(v4, v5)).toBeCloseTo(0.96, 2)
    expect(cosineSimilarity([], [])).toBe(0)
  })

  it('chunks long text into segments under maximum word boundaries', () => {
    const longText = Array(250).fill('word').join(' ')
    const chunks = chunkText(longText, 100)
    expect(chunks.length).toBe(3)
    expect(chunks[0].split(' ').length).toBeLessThanOrEqual(100)
  })

  it('finds relevant campus knowledge articles using keywords', async () => {
    const results = await findKnowledgeArticles('Wi-Fi connection issues')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].title.toLowerCase()).toContain('wi-fi')
  })
})

describe('Core AI Feature Services', () => {
  it('classifies academic and technical requests with whitelisted categories', async () => {
    const academic = await classifySupportRequest('Missing attendance for math', 'I attended on Oct 5 but marked absent')
    expect(['academic', 'technical', 'administration', 'campus']).toContain(academic.category)
    expect(['Low', 'Medium', 'High']).toContain(academic.priority)
    expect(academic.reasoning).toBeTruthy()

    const tech = await classifySupportRequest('Wi-Fi portal password reset', 'Cannot connect to campus AU-Student internet')
    expect(['academic', 'technical', 'administration', 'campus']).toContain(tech.category)
  })

  it('improves draft requests with structured schema', async () => {
    const result = await improveSupportRequest('wifi not working', 'it stopped in hostel block 4')
    expect(result.title).toBeTruthy()
    expect(result.description).toBeTruthy()
    expect(result.description.length).toBeGreaterThan(15)
    expect(result.keyChanges.length).toBeGreaterThan(0)
  })

  it('summarizes request for staff copilot with key facts and draft reply', async () => {
    const result = await summarizeRequestForStaff({
      requestCode: 'REQ-101',
      title: 'Bus route 14 timing delay',
      description: 'Morning bus arriving 30 minutes late at Uppal circle every day this week.',
      category: 'campus',
      priority: 'High',
      status: 'Open',
      history: [{ title: 'Submitted', body: 'Logged via portal', date: 'Oct 10', actor: 'Student' }],
    })

    expect(result.summary).toBeTruthy()
    expect(result.extractedFacts.length).toBeGreaterThan(0)
    expect(result.suggestedReply).toBeTruthy()
    expect(result.suggestedActions.length).toBeGreaterThan(0)
  })
})
