import { GoogleGenAI } from '@google/genai'
import { retrieveGroundedChunks, type RetrievedChunk } from './knowledge.js'

export type ChatHistoryItem = { role: 'user' | 'assistant'; text: string }

const EMBEDDING_MODEL = 'gemini-embedding-001'

function getAvailableModels(): string[] {
  const primary = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite'
  const fallbackList = ['gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash']
  const set = new Set([primary, ...fallbackList])
  return Array.from(set)
}

function getAI(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY
  return key ? new GoogleGenAI({ apiKey: key }) : null
}

export function isAIAvailable(): boolean {
  return Boolean(process.env.GEMINI_API_KEY)
}

async function generateContentWithFailover(
  ai: GoogleGenAI,
  options: {
    contents: string
    config?: any
  }
): Promise<{ text: string; model: string }> {
  const models = getAvailableModels()
  let lastError: unknown = null
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: options.contents,
        config: options.config,
      })
      const text = response.text?.trim() ?? ''
      return { text, model }
    } catch (err) {
      lastError = err
      const status = (err as any)?.status
      console.warn(`Gemini model ${model} issue (status ${status}), evaluating failover...`)
      if (status !== 429 && status !== 503) {
        throw err
      }
    }
  }
  throw lastError
}

function parseJsonSafe<T = Record<string, unknown>>(raw: string): T | null {
  if (!raw) return null
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    return JSON.parse(cleaned) as T
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return JSON.parse(match[0]) as T
      } catch {
        return null
      }
    }
    return null
  }
}

// Generate vector embedding using Google GenAI SDK
export async function generateEmbedding(text: string): Promise<number[] | null> {
  const ai = getAI()
  if (!ai || !text.trim()) return null
  try {
    const response = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: text.slice(0, 2000),
    })
    // SDK returns embedding values
    const values = response.embeddings?.[0]?.values
    return Array.isArray(values) ? values : null
  } catch (err) {
    console.warn('Embedding generation failed (falling back):', err instanceof Error ? err.message : String(err))
    return null
  }
}

// System instruction generator respecting language preference
function buildSystemInstruction(language: string = 'English'): string {
  let langDirective = 'Respond in clear, helpful English.'
  if (language.toLowerCase().includes('telugu') || language === 'తెలుగు') {
    langDirective = 'Respond in natural, polite Telugu script (తెలుగు). Ensure proper grammar and terminology. Maintain all factual policy terms and official office names accurately.'
  } else if (language.toLowerCase().includes('mixed')) {
    langDirective = 'Respond in accessible, bilingual English-Telugu conversational tone as appropriate.'
  }

  return `You are CampusAssist, the official student-support guide for Anurag University.
${langDirective}
Use the supplied knowledge snippets as the ONLY source for institution-specific claims, rules, office locations, and deadlines.
If the snippets do not provide sufficient information to answer the question, state politely that you cannot confirm the institution's official policy and advise the student which campus office (Academic Office, Student Services, or Administration) to contact.
Never invent office hours, fees, contact phone numbers, or eligibility rules.
Never ask for passwords, OTPs, or financial details.`
}

function makeChatPrompt(
  history: ChatHistoryItem[],
  message: string,
  chunks: RetrievedChunk[],
  language: string
): string {
  const context = chunks.length
    ? chunks
        .map(
          (c, i) =>
            `[Snippet ${i + 1}] Title: ${c.title} (${c.category})\nContent: ${c.chunkContent}`
        )
        .join('\n\n')
    : 'No relevant campus policy document was found for this query in the knowledge base.'

  const transcript = history
    .slice(-8)
    .map((item) => `${item.role === 'assistant' ? 'CampusAssist' : 'Student'}: ${item.text.slice(0, 1500)}`)
    .join('\n')

  return `Approved Institutional Knowledge Snippets:
${context}

Recent conversation:
${transcript || '(No previous messages)'}

User's requested response language: ${language}
Student Question:
${message}`
}

function demoChatAnswer(message: string, chunks: RetrievedChunk[], language = 'English'): string {
  const isTelugu = language.toLowerCase().includes('telugu') || /[\u0C00-\u0C7F]/.test(message)
  const chunk = chunks[0]

  if (!chunk) {
    if (isTelugu) {
      return 'క్షమించండి, మీ ప్రశ్నకు సంబంధించిన అధికారిక సమాచారం మా వద్ద ప్రస్తుతానికి అందుబాటులో లేదు. దయచేసి సంబంధిత కళాశాల కార్యాలయాన్ని (Student Services Desk) సంప్రదించండి.'
    }
    return 'I cannot confirm the institution’s exact policy on this topic from available campus guides. Please consult your academic coordinator or the Student Services desk in Block A.'
  }

  if (isTelugu) {
    return `“${chunk.title}” గైడ్ ఆధారంగా సమాచారం: ${chunk.chunkContent} అధికారిక నియమ నిబంధనల కొరకు మీ కళాశాల పరిపాలనా కార్యాలయాన్ని సంప్రదించండి.`
  }

  return `Here is the relevant guidance from “${chunk.title}” (${chunk.category}): ${chunk.chunkContent} Please verify deadlines and requirements with your department office.`
}

// 1. Campus AI Assistant
export async function answerCampusQuestion(
  message: string,
  history: ChatHistoryItem[] = [],
  language = 'English'
) {
  // Detect Telugu characters if language wasn't explicitly set
  const effectiveLanguage =
    language === 'English' && /[\u0C00-\u0C7F]/.test(message) ? 'Telugu' : language

  const embedding = await generateEmbedding(message)
  const chunks = await retrieveGroundedChunks(message, embedding)

  const ai = getAI()
  if (!ai) {
    const text = demoChatAnswer(message, chunks, effectiveLanguage)
    return {
      answer: text,
      reply: text,
      mode: 'demo',
      model: 'demo-fallback',
      sources: chunks.map((c) => ({ title: c.title, category: c.category })),
      language: effectiveLanguage,
    }
  }

  try {
    const prompt = makeChatPrompt(history, message, chunks, effectiveLanguage)
    const { text, model: usedModel } = await generateContentWithFailover(ai, {
      contents: prompt,
      config: {
        systemInstruction: buildSystemInstruction(effectiveLanguage),
        temperature: 0.2,
        maxOutputTokens: 750,
      },
    })

    const finalAnswer = text || 'I could not generate an answer right now. Please try again.'
    return {
      answer: finalAnswer,
      reply: finalAnswer,
      mode: 'gemini',
      model: usedModel,
      sources: chunks.map((c) => ({ title: c.title, category: c.category })),
      language: effectiveLanguage,
    }
  } catch (error) {
    console.error('Gemini chat error:', error)
    const text = demoChatAnswer(message, chunks, effectiveLanguage)
    return {
      answer: text,
      reply: text,
      mode: 'demo',
      model: 'fallback-on-error',
      sources: chunks.map((c) => ({ title: c.title, category: c.category })),
      language: effectiveLanguage,
    }
  }
}

// 2. Smart Request Classification
export async function classifySupportRequest(title: string, description: string) {
  const categoryChoices = ['academic', 'campus', 'technical', 'administration']
  const priorityChoices = ['Low', 'Medium', 'High']

  const ai = getAI()
  if (!ai) {
    const text = `${title} ${description}`.toLowerCase()
    let category = 'academic'
    if (/certificate|bonafide|fee|scholarship|administration|document/.test(text)) category = 'administration'
    else if (/wifi|wi-fi|internet|portal|lms|login|password|technical|computer/.test(text)) category = 'technical'
    else if (/hostel|transport|bus|maintenance|water|electricity|cleaning|facility|campus/.test(text)) category = 'campus'

    const priority = /urgent|today|tomorrow|exam|safety|danger|blocked|deadline/.test(text) ? 'High' : 'Medium'
    return {
      category,
      priority,
      reason: 'Rule-based demo suggestion. Review before applying.',
      reasoning: 'Rule-based demo suggestion. Review before applying.',
      missingDetails: category === 'academic' ? ['Relevant subject or date'] : ['Specific location or error code'],
      mode: 'demo',
    }
  }

  try {
    const prompt = `Classify this student campus support request.
Return JSON ONLY with keys:
- category: one of [academic, campus, technical, administration]
- priority: one of [Low, Medium, High] (recommend High only for imminent exams, system blockades, or safety hazards)
- reason: short explanation of recommendation (max 150 chars)
- missingDetails: array of 1-3 short strings of details the student should add

Request Title: ${title}
Request Description: ${description}`

    const { text } = await generateContentWithFailover(ai, {
      contents: prompt,
      config: { responseMimeType: 'application/json', temperature: 0.1, maxOutputTokens: 600 },
    })

    const parsed = parseJsonSafe(text) || {}
    const reasonText = typeof parsed.reason === 'string' ? parsed.reason.slice(0, 200) : 'Recommended based on request details.'

    return {
      category: categoryChoices.includes(String(parsed.category)) ? String(parsed.category) : 'academic',
      priority: priorityChoices.includes(String(parsed.priority)) ? String(parsed.priority) : 'Medium',
      reason: reasonText,
      reasoning: reasonText,
      missingDetails: Array.isArray(parsed.missingDetails) ? parsed.missingDetails.map(String).slice(0, 5) : [],
      mode: 'gemini',
    }
  } catch (error) {
    console.error('Classification error:', error)
    return {
      category: 'academic',
      priority: 'Medium',
      reason: 'Classification service temporarily using fallback.',
      reasoning: 'Classification service temporarily using fallback.',
      missingDetails: [],
      mode: 'demo',
    }
  }
}

// 3. AI Request Writing Assistant
export async function improveSupportRequest(title: string, description: string) {
  const ai = getAI()
  if (!ai) {
    const cleanTitle = title.trim() || description.trim().split(/[.!?\n]/)[0].slice(0, 100)
    return {
      title: cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1),
      description: description.trim().replace(/\s+/g, ' '),
      notes: 'Demo mode: formatted draft only; connect Gemini for AI rewrite.',
      keyChanges: ['Formatted draft for clarity and conciseness', 'Added structured context for university staff review'],
      changesMade: 'Formatted draft for improved clarity and readability.',
      missingDetails: ['Specific date or time', 'Relevant course or location'],
      mode: 'demo',
    }
  }

  try {
    const prompt = `Rewrite a student's support request to make it polite, clear, structured, and easy for university staff to take action on.
Do NOT invent any facts, dates, names, or promises.
Return JSON ONLY with keys:
- title: concise title (max 120 characters)
- description: improved description (polite, concise, factual)
- keyChanges: array of 1-3 short strings describing what was improved
- missingDetails: array of strings noting any critical details that seem missing (e.g. date, roll number, block)

Current Title: ${title}
Current Description: ${description}`

    const { text } = await generateContentWithFailover(ai, {
      contents: prompt,
      config: { responseMimeType: 'application/json', temperature: 0.2, maxOutputTokens: 1200 },
    })

    const parsed = parseJsonSafe(text) || {}

    return {
      title: typeof parsed.title === 'string' ? parsed.title.slice(0, 140) : title,
      description: typeof parsed.description === 'string' ? parsed.description.slice(0, 4000) : description,
      keyChanges: Array.isArray(parsed.keyChanges) ? parsed.keyChanges.map(String).slice(0, 4) : ['Clarified context and added professional tone'],
      changesMade: 'Clarified context and polished wording.',
      missingDetails: Array.isArray(parsed.missingDetails) ? parsed.missingDetails.map(String).slice(0, 5) : [],
      mode: 'gemini',
    }
  } catch (error) {
    console.error('Writing assistant error:', error)
    return {
      title: title || 'Support request',
      description,
      keyChanges: ['Structured draft for team submission'],
      changesMade: 'Applied basic structuring.',
      missingDetails: [],
      mode: 'demo',
    }
  }
}

// 4. Staff Copilot: Request Summarization & Suggested Response
export type StaffCopilotInput = {
  requestCode: string
  title: string
  description: string
  category: string
  priority: string
  status: string
  history: Array<{ title: string; body: string; date: string; actor: string }>
}

export async function summarizeRequestForStaff(data: StaffCopilotInput) {
  const ai = getAI()
  const historyText = data.history.length
    ? data.history.map((h) => `[${h.date}] ${h.actor}: ${h.title} - ${h.body}`).join('\n')
    : '(No prior timeline events)'

  if (!ai) {
    return {
      summary: `Request ${data.requestCode} (${data.category}): Student reported "${data.title}". Status is currently ${data.status} with ${data.priority} priority.`,
      extractedFacts: [
        `Category: ${data.category}`,
        `Current Status: ${data.status}`,
        `Priority: ${data.priority}`,
      ],
      missingInformation: ['Verify student identity and supporting documentation.'],
      suggestedReply: `Dear Student, we have received your request regarding "${data.title}". Our team is currently reviewing your submission and will provide an update within 1-2 business days.`,
      suggestedActions: ['Review departmental logs', 'Verify supporting evidence', 'Update status to In Progress'],
      mode: 'demo',
    }
  }

  try {
    const prompt = `You are an AI Copilot for University Support Staff.
Analyze this student support request and its timeline history:

Request Code: ${data.requestCode}
Category: ${data.category}
Priority: ${data.priority}
Current Status: ${data.status}
Title: ${data.title}
Description: ${data.description}

Timeline History:
${historyText}

Return JSON ONLY with keys:
- summary: 2-3 sentence executive summary of the issue and current state.
- extractedFacts: array of 3-5 key facts established in the ticket.
- missingInformation: array of 1-3 critical pieces of info still needed from the student.
- suggestedReply: a professional, empathetic draft response to the student with clear next steps.
- suggestedActions: array of 2-3 actionable operational next steps for staff.`

    const { text } = await generateContentWithFailover(ai, {
      contents: prompt,
      config: { responseMimeType: 'application/json', temperature: 0.2, maxOutputTokens: 1500 },
    })

    const parsed = parseJsonSafe(text) || {}

    return {
      summary: typeof parsed.summary === 'string' ? parsed.summary : `Summary for ${data.requestCode}`,
      extractedFacts: Array.isArray(parsed.extractedFacts) ? parsed.extractedFacts.map(String) : [],
      missingInformation: Array.isArray(parsed.missingInformation) ? parsed.missingInformation.map(String) : [],
      suggestedReply: typeof parsed.suggestedReply === 'string' ? parsed.suggestedReply : '',
      suggestedActions: Array.isArray(parsed.suggestedActions) ? parsed.suggestedActions.map(String) : [],
      mode: 'gemini',
    }
  } catch (error) {
    console.error('Staff copilot error:', error)
    return {
      summary: `Request ${data.requestCode}: ${data.title}`,
      extractedFacts: [`Status: ${data.status}`],
      missingInformation: [],
      suggestedReply: `Dear Student, thank you for reaching out regarding "${data.title}". We are investigating this issue.`,
      suggestedActions: ['Check department records'],
      mode: 'demo',
    }
  }
}
