import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, BookOpen, Bot, Check, CircleHelp, GraduationCap, Languages, LifeBuoy, RotateCcw, Send, Sparkles, ThumbsDown, ThumbsUp, TicketCheck, UserRound } from 'lucide-react'
import { knowledgeArticles } from '../data/mockData.js'
import { AI_MODE, chatWithCampusAI } from '../services/aiService.js'

const suggestionsEn = [
  { icon: TicketCheck, text: 'How do I check my request status?' },
  { icon: BookOpen, text: 'How can I request a certificate?' },
  { icon: GraduationCap, text: 'My attendance record looks incorrect.' },
  { icon: LifeBuoy, text: 'Where do I report a campus issue?' },
]

const suggestionsTe = [
  { icon: GraduationCap, text: 'హాజరు సమీక్ష ఎలా అడగాలి?' },
  { icon: BookOpen, text: 'బోనఫైడ్ సర్టిఫికెట్ ఎలా పొందాలి?' },
  { icon: LifeBuoy, text: 'క్యాంపస్ వై-ఫై ఎలా కనెక్ట్ చేయాలి?' },
  { icon: TicketCheck, text: 'నా రిక్వెస్ట్ స్టేటస్ ఎలా చూడాలి?' },
]

function answerFor(text, lang = 'English') {
  const value = text.toLowerCase()
  const isTe = lang === 'Telugu' || /[\u0C00-\u0C7F]/.test(text)

  if (value.includes('attendance') || value.includes('హాజరు')) {
    return {
      body: isTe
        ? 'హాజరు సవరణ కొరకు **Academic support** ఎంచుకుని కొత్త అభ్యర్థనను ప్రారంభించండి. తేదీ, సబ్జెక్ట్ మరియు సమయాన్ని పేర్కొనండి. దీని పురోగతిని **My requests** లో ట్రాక్ చేయవచ్చు.'
        : 'For an attendance correction, start a new support request and choose **Academic support**. Include the date, subject, period, and what appears to be incorrect. You can then track its progress in **My requests**.',
      actions: [{ label: 'Create an academic request', to: '/app/requests/new' }, { label: 'Attendance review guide', to: '/app/knowledge' }],
    }
  }

  if (value.includes('certificate') || value.includes('bonafide') || value.includes('సర్టిఫికెట్') || value.includes('బోనఫైడ్')) {
    return {
      body: isTe
        ? 'సర్టిఫికెట్ దరఖాస్తులు **Administration** విభాగం కిందకు వస్తాయి. ఏ సర్టిఫికెట్ అవసరమో తెలియజేసి రిక్వెస్ట్ సబ్మిట్ చేయండి. సాధారణ ప్రాసెసింగ్ సమయం 2-3 పనిదినాలు.'
        : 'Certificate requests usually belong under **Administration**. Share which certificate you need and why, then check the request for updates. Requirements and processing times vary by institution, so confirm details with your campus office.',
      actions: [{ label: 'Start a certificate request', to: '/app/requests/new' }, { label: 'Browse campus guides', to: '/app/knowledge' }],
    }
  }

  if (value.includes('wifi') || value.includes('wi-fi') || value.includes('internet') || value.includes('వై-ఫై')) {
    return {
      body: isTe
        ? 'వై-ఫై లేదా LMS సమస్యల కోసం **IT & digital access** ఎంచుకోండి. మీ లొకేషన్, డివైస్ మరియు ఎర్రర్ మెసేజ్ జతపరచండి. పాస్‌వర్డ్ లేదా OTP ఎవరితోనూ పంచుకోవద్దు.'
        : 'For Wi-Fi, portal, or learning-management issues, choose **IT & digital access**. Include where you are seeing the issue, the device or service affected, and any error message. Never include a password or verification code.',
      actions: [{ label: 'Start an IT request', to: '/app/requests/new' }, { label: 'Digital access guide', to: '/app/knowledge' }],
    }
  }

  return {
    body: isTe
      ? 'క్యాంపస్ అసిస్టెంట్ మీకు తగిన సమాచారం లేదా గైడ్‌ను కనుగొనడంలో సహాయపడుతుంది. మీ సమస్యను వివరించండి, మేము సరైన విభాగాన్ని సూచిస్తాము.'
      : 'A good place to start is to describe the outcome you need. CampusAssist can direct your question to a service category, show relevant guides, or help you submit a support request. Always verify official policies with your campus office.',
    actions: [{ label: 'Explore campus guides', to: '/app/knowledge' }, { label: 'Create a support request', to: '/app/requests/new' }],
  }
}

export default function AssistantPage() {
  const [language, setLanguage] = useState('English')
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: 'Hi Abhinash — I’m your CampusAssist guide. I can help you explore campus services, find a useful guide, or get started with a support request. You can ask in English, తెలుగు (Telugu), or mixed language. What would you like to work through today?',
      actions: [],
    },
  ])
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState({})
  const [showSources, setShowSources] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [assistantMode, setAssistantMode] = useState(AI_MODE === 'api' ? 'API mode · live server' : 'Demo assistant')
  const messagesEndRef = useRef(null)

  async function send(text = input) {
    const value = text.trim()
    if (!value || isLoading) return
    const now = Date.now()
    const assistantId = now + 1
    const suggested = answerFor(value, language)
    const history = messages.filter((item) => item.id !== 1).slice(-8).map(({ role, text: messageText }) => ({ role, text: messageText }))

    setMessages((previous) => [
      ...previous,
      { id: now, role: 'user', text: value },
      { id: assistantId, role: 'assistant', text: AI_MODE === 'api' ? 'Preparing a response…' : suggested.body, actions: AI_MODE === 'api' ? [] : suggested.actions },
    ])
    setInput('')
    setIsLoading(true)

    try {
      if (AI_MODE === 'api') {
        const result = await chatWithCampusAI(value, history, language)
        if (result && result.answer) {
          setAssistantMode(result.mode === 'gemini' ? `Gemini connected · ${result.model || 'AI'}` : `Demo fallback · ${result.language || 'English'}`)
          setMessages((previous) =>
            previous.map((item) => (item.id === assistantId ? { ...item, text: result.answer, actions: suggested.actions } : item))
          )
        } else {
          setMessages((previous) =>
            previous.map((item) => (item.id === assistantId ? { ...item, text: suggested.body, actions: suggested.actions } : item))
          )
        }
      } else {
        setAssistantMode('Demo assistant · sample responses')
      }
    } catch (error) {
      setAssistantMode('API unavailable')
      setMessages((previous) =>
        previous.map((item) =>
          item.id === assistantId
            ? { ...item, text: `I couldn't reach the CampusAssist API. ${error.message || 'Please check the backend URL and try again.'}`, actions: suggested.actions }
            : item
        )
      )
    } finally {
      setIsLoading(false)
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50)
    }
  }

  function reset() {
    setMessages([
      {
        id: 1,
        role: 'assistant',
        text: 'Hi Abhinash — I’m your CampusAssist guide. Ask in English, తెలుగు, or mixed language. What would you like to work through today?',
        actions: [],
      },
    ])
    setFeedback({})
  }

  const isWelcome = messages.length === 1
  const suggestions = language === 'Telugu' ? suggestionsTe : suggestionsEn

  return (
    <div className="assistant-page-layout">
      <div className="assistant-main">
        <div className="assistant-page-heading">
          <div>
            <span className="eyebrow"><span className="eyebrow-dot" /> CAMPUSASSIST / AI GUIDE</span>
            <h1>How can we help you <span>move forward?</span></h1>
            <p>Ask in your own words. We support English, తెలుగు, and mixed queries.</p>
          </div>
          <div className="assistant-live-mark">
            <span className="assistant-live-icon"><Sparkles size={21} /></span>
            <div><strong>CampusAssist AI</strong><small><i /> {assistantMode}</small></div>
          </div>
        </div>

        <div className="assistant-chat-panel">
          <div className="chat-toolbar">
            <div className="toolbar-left-group">
              <span className="chat-toolbar-icon"><Bot size={17} /></span>
              <div><strong>Campus guide</strong><small>{AI_MODE === 'api' ? assistantMode : 'Sample-response mode'}</small></div>
            </div>

            {/* Language Selection Bar */}
            <div className="language-selector-group" role="radiogroup" aria-label="Select response language">
              <span className="lang-label"><Languages size={14} /> Language:</span>
              <button
                type="button"
                className={`lang-pill ${language === 'English' ? 'active' : ''}`}
                onClick={() => setLanguage('English')}
              >
                English
              </button>
              <button
                type="button"
                className={`lang-pill ${language === 'Telugu' ? 'active' : ''}`}
                onClick={() => setLanguage('Telugu')}
              >
                తెలుగు
              </button>
              <button
                type="button"
                className={`lang-pill ${language === 'Mixed' ? 'active' : ''}`}
                onClick={() => setLanguage('Mixed')}
              >
                Mixed
              </button>
            </div>

            <button className="icon-button" title="Reset conversation" aria-label="Reset conversation" onClick={reset}>
              <RotateCcw size={16} />
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((message) => (
              <div className={`chat-message ${message.role}`} key={message.id}>
                <span className={`chat-avatar ${message.role}`}>
                  {message.role === 'assistant' ? <Sparkles size={17} /> : <UserRound size={16} />}
                </span>
                <div className="chat-message-content">
                  <span className="chat-sender">
                    {message.role === 'assistant' ? 'CampusAssist' : 'You'}{' '}
                    <small>{message.role === 'assistant' ? '· AI guide' : '· Just now'}</small>
                  </span>
                  <div className="chat-bubble">
                    {message.text.split(/(\*\*.*?\*\*)/g).map((piece, index) =>
                      piece.startsWith('**') && piece.endsWith('**') ? (
                        <strong key={index}>{piece.slice(2, -2)}</strong>
                      ) : (
                        <span key={index}>{piece}</span>
                      )
                    )}
                    {isLoading && message.role === 'assistant' && message.text === 'Preparing a response…' && (
                      <span className="chat-typing-indicator" aria-label="Assistant is responding">
                        <i /><i /><i />
                      </span>
                    )}
                  </div>
                  {message.actions?.length > 0 && (
                    <div className="chat-action-links">
                      {message.actions.map((action) => (
                        <Link to={action.to} key={action.label}>
                          {action.label}
                          <ArrowUpRight size={14} />
                        </Link>
                      ))}
                    </div>
                  )}
                  {message.role === 'assistant' && message.id !== 1 && (
                    <div className="message-feedback">
                      <span>Was this useful?</span>
                      <button
                        aria-label="Helpful response"
                        className={feedback[message.id] === 'up' ? 'chosen' : ''}
                        onClick={() => setFeedback({ ...feedback, [message.id]: 'up' })}
                      >
                        <ThumbsUp size={13} />
                      </button>
                      <button
                        aria-label="Not helpful"
                        className={feedback[message.id] === 'down' ? 'chosen' : ''}
                        onClick={() => setFeedback({ ...feedback, [message.id]: 'down' })}
                      >
                        <ThumbsDown size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isWelcome && (
              <div className="suggested-prompts">
                <span>YOU CAN ASK</span>
                <div>
                  {suggestions.map(({ icon: Icon, text }) => (
                    <button key={text} onClick={() => send(text)}>
                      <Icon size={16} />
                      <span>{text}</span>
                      <ArrowUpRight size={14} />
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-composer" onSubmit={(event) => { event.preventDefault(); send() }}>
            <div className="chat-composer-input">
              <Sparkles size={17} />
              <input
                aria-label="Ask CampusAssist"
                placeholder={language === 'Telugu' ? 'క్యాంపస్ సర్వీసులు లేదా నిబంధనల గురించి అడగండి…' : 'Ask about campus services, records or support…'}
                value={input}
                onChange={(event) => setInput(event.target.value)}
              />
              <kbd>↵</kbd>
            </div>
            <button type="submit" className="chat-send-button" disabled={!input.trim() || isLoading} aria-label="Send message">
              <Send size={17} />
            </button>
            <div className="chat-composer-bottom">
              <span>
                <span className="small-online-dot" /> Selected language: <strong>{language}</strong> · Grounded in campus guides
              </span>
              <button type="button" onClick={() => setShowSources(!showSources)}>
                <BookOpen size={13} /> {showSources ? 'Hide sources' : 'View knowledge sources'}
              </button>
            </div>
          </form>
        </div>

        {showSources && (
          <div className="panel sources-panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">DEMO KNOWLEDGE BASE</span>
                <h2>Available sample guides</h2>
              </div>
              <span className="tiny-count">{knowledgeArticles.length.toString().padStart(2, '0')}</span>
            </div>
            {knowledgeArticles.map((item) => (
              <Link to="/app/knowledge" className="source-row" key={item.id}>
                <span><BookOpen size={16} /></span>
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.category} · {item.read}</small>
                </div>
                <ArrowUpRight size={15} />
              </Link>
            ))}
          </div>
        )}

        <div className="assistant-ai-disclaimer">
          <span><CircleHelp size={15} /></span>
          <p>
            <strong>Keep in mind:</strong> AI output may be inaccurate or incomplete. Institution-specific policies and deadlines must be grounded in approved campus documents and verified with your institution. Do not share passwords or sensitive personal information.
          </p>
        </div>
      </div>

      <aside className="assistant-side">
        <div className="assistant-side-card assistant-side-intro">
          <div className="assistant-side-art">
            <div className="assistant-side-orbit" />
            <div className="assistant-side-orbit orbit-two" />
            <span><Sparkles size={23} /></span>
            <div className="side-art-star star-one">✳</div>
            <div className="side-art-star star-two">✦</div>
          </div>
          <span className="eyebrow"><span className="eyebrow-dot" /> YOUR CAMPUS, CONNECTED</span>
          <h3>Find the next right step.</h3>
          <p>Get pointed toward a relevant guide or service request without having to know where to begin.</p>
        </div>

        <div className="assistant-side-card">
          <div className="side-card-heading">
            <span><BookOpen size={16} /></span>
            <h3>Popular campus guides</h3>
          </div>
          <Link to="/app/knowledge" className="guide-row">
            <span className="guide-row-icon blue"><GraduationCap size={16} /></span>
            <span><strong>Attendance review</strong><small>Academic support</small></span>
            <ArrowUpRight size={15} />
          </Link>
          <Link to="/app/knowledge" className="guide-row">
            <span className="guide-row-icon orange"><TicketCheck size={16} /></span>
            <span><strong>Student certificates</strong><small>Administration</small></span>
            <ArrowUpRight size={15} />
          </Link>
          <Link to="/app/knowledge" className="guide-row">
            <span className="guide-row-icon violet"><LifeBuoy size={16} /></span>
            <span><strong>Campus facilities</strong><small>Campus services</small></span>
            <ArrowUpRight size={15} />
          </Link>
          <Link to="/app/knowledge" className="assistant-view-guides">
            Browse all guides <ArrowRight size={14} />
          </Link>
        </div>

        <div className="assistant-side-small-note">
          <span><Check size={15} /></span>
          <div>
            <strong>Multilingual & Grounded</strong>
            <small>Supports English and Telugu with verified campus policy snippets.</small>
          </div>
        </div>
      </aside>
    </div>
  )
}
