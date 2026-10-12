import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, CalendarClock, Check, Clock3, MessageSquareText, Paperclip, Send, ShieldCheck, TicketCheck, UserRound, X, Sparkles, Bot, AlertCircle, CornerDownLeft } from 'lucide-react'
import { requestService } from '../services/api/requestService.js'
import { authService } from '../services/authService.js'
import { summarizeRequestForStaff } from '../services/aiService.js'

export default function RequestDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const currentUser = authService.getCurrentUser()
  const isStaffOrAdmin = currentUser?.role === 'staff' || currentUser?.role === 'admin'

  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [comment, setComment] = useState('')
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [copilotLoading, setCopilotLoading] = useState(false)
  const [copilotData, setCopilotData] = useState(null)
  const [copiedDraft, setCopiedDraft] = useState(false)

  async function loadRequest() {
    try {
      setLoading(true)
      setError(null)
      const data = await requestService.get(id)
      setRequest(data.request || data)
    } catch (err) {
      setError(err.message || 'Could not load request.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequest()
  }, [id])

  if (loading) {
    return (
      <div className="page-stack">
        <Link to="/app/requests" className="back-link"><ArrowLeft size={15} /> All requests</Link>
        <div className="panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div className="empty-icon"><TicketCheck size={28} /></div>
          <p style={{ marginTop: '12px', color: '#64748b' }}>Loading request details from campus database…</p>
        </div>
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="page-stack">
        <Link to="/app/requests" className="back-link"><ArrowLeft size={15} /> All requests</Link>
        <div className="panel not-found-panel">
          <span className="empty-icon"><TicketCheck size={24} /></span>
          <h2>Request not found</h2>
          <p>{error || 'This request may not exist or you do not have permission to view it.'}</p>
          <Link to="/app/requests" className="button button-blue">Back to requests</Link>
        </div>
      </div>
    )
  }

  const tone = request.status === 'Resolved' ? 'status-green' : request.status === 'In progress' ? 'status-blue' : 'status-orange'

  async function changeStatus(newStatus) {
    try {
      setActionError(null)
      await requestService.updateStatus(id, newStatus)
      await loadRequest()
    } catch (err) {
      setActionError(err.message || 'Could not update status.')
    }
  }

  async function handleAddComment(event) {
    event.preventDefault()
    if (!comment.trim() || commentSubmitting) return

    setCommentSubmitting(true)
    setActionError(null)
    try {
      await requestService.addComment(id, comment.trim())
      setComment('')
      await loadRequest()
    } catch (err) {
      setActionError(err.message || 'Could not submit comment.')
    } finally {
      setCommentSubmitting(false)
    }
  }

  async function removeRequest() {
    try {
      setActionError(null)
      await requestService.remove(id)
      navigate('/app/requests')
    } catch (err) {
      setActionError(err.message || 'Could not delete request.')
      setShowDelete(false)
    }
  }

  async function loadCopilot() {
    setCopilotLoading(true)
    try {
      const result = await summarizeRequestForStaff(request)
      setCopilotData(result)
    } catch (err) {
      console.error('Failed to load copilot:', err)
    } finally {
      setCopilotLoading(false)
    }
  }

  function applyDraftReply() {
    if (!copilotData?.suggestedReply) return
    setComment(copilotData.suggestedReply)
    setCopiedDraft(true)
    setTimeout(() => setCopiedDraft(false), 2000)
  }

  const historyItems = request.history || []
  const userInitials = (currentUser?.fullName || 'User').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="page-stack">
      <Link to="/app/requests" className="back-link"><ArrowLeft size={15} /> All requests</Link>

      {actionError && (
        <div className="login-error-banner" role="alert" style={{ marginBottom: '16px' }}>
          <AlertCircle size={17} />
          <span>{actionError}</span>
        </div>
      )}

      <div className="detail-heading">
        <div>
          <div className="detail-id-line">
            <span className="detail-ticket-icon"><TicketCheck size={18} /></span>
            <span>{request.requestCode || request.id}</span>
            <span className={`status-pill ${tone}`}><i />{request.status}</span>
          </div>
          <h1>{request.title}</h1>
          <p>
            Submitted on {formatFriendlyDate(request.createdAt)}
            <span> · </span>
            {request.categoryName || 'Campus Support'}
          </p>
        </div>
        <div className="detail-actions">
          <button className="button button-soft" onClick={() => setShowDelete(true)}>
            <X size={16} /> Delete
          </button>
          <Link to="/app/requests/new" className="button button-blue">
            New request <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-main-column">
          <section className="panel detail-description-panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">REQUEST SUMMARY</span>
                <h2>What you shared</h2>
              </div>
              <span className={`priority-label priority-${(request.priority || 'medium').toLowerCase()}`}>
                <i />{request.priority} priority
              </span>
            </div>
            <p className="detail-description">{request.description}</p>
            <div className="detail-meta-grid">
              <div>
                <span className="detail-meta-icon"><CalendarClock size={16} /></span>
                <div>
                  <small>Last updated</small>
                  <strong>{formatFriendlyDate(request.updatedAt)}</strong>
                </div>
              </div>
              <div>
                <span className="detail-meta-icon"><UserRound size={16} /></span>
                <div>
                  <small>Assigned team</small>
                  <strong>{request.assigneeName || 'Student Services'}</strong>
                </div>
              </div>
              <div>
                <span className="detail-meta-icon"><Paperclip size={16} /></span>
                <div>
                  <small>Student</small>
                  <strong>{request.ownerName || currentUser?.fullName || 'Student'}</strong>
                </div>
              </div>
            </div>
          </section>

          {/* Staff Copilot Section */}
          <section className="panel staff-copilot-card">
            <div className="staff-copilot-header">
              <div className="staff-copilot-title">
                <Bot size={18} />
                <span>Staff Copilot Assistant</span>
              </div>
              <button
                type="button"
                className="button button-soft"
                style={{ minHeight: '34px', fontSize: '13px' }}
                onClick={loadCopilot}
                disabled={copilotLoading}
              >
                <Sparkles size={14} /> {copilotLoading ? 'Generating brief…' : copilotData ? 'Refresh brief' : 'Generate Staff Brief'}
              </button>
            </div>

            {copilotData ? (
              <div>
                <div className="copilot-section">
                  <h5>Executive Summary</h5>
                  <div className="copilot-summary-text">{copilotData.summary}</div>
                </div>

                {copilotData.extractedFacts && copilotData.extractedFacts.length > 0 && (
                  <div className="copilot-section">
                    <h5>Key Facts Extracted</h5>
                    <ul className="copilot-fact-list">
                      {copilotData.extractedFacts.map((fact, idx) => (
                        <li key={idx}>{fact}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {copilotData.suggestedActions && copilotData.suggestedActions.length > 0 && (
                  <div className="copilot-section">
                    <h5>Recommended Next Actions</h5>
                    <ul className="copilot-fact-list">
                      {copilotData.suggestedActions.map((action, idx) => (
                        <li key={idx}>{action}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {copilotData.suggestedReply && (
                  <div className="copilot-section" style={{ marginBottom: 0 }}>
                    <h5>Suggested Student Reply</h5>
                    <div className="copilot-draft-box">{copilotData.suggestedReply}</div>
                    <div className="copilot-actions">
                      <button
                        type="button"
                        className="button button-blue"
                        style={{ minHeight: '34px', fontSize: '13px' }}
                        onClick={applyDraftReply}
                      >
                        <CornerDownLeft size={14} /> {copiedDraft ? 'Inserted into reply box!' : 'Use draft reply'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ margin: 0, color: '#64748b', fontSize: 'var(--text-sm)' }}>
                Click <strong>Generate Staff Brief</strong> to have the AI analyze this ticket, extract key bullet points, suggest next actions, and create a draft response for the student.
              </p>
            )}
          </section>

          <section className="panel timeline-panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">KEEPING YOU INFORMED</span>
                <h2>Request activity</h2>
              </div>
              <span className="timeline-count">{historyItems.length} updates</span>
            </div>
            <div className="request-timeline">
              {historyItems.map((item, index) => (
                <div className="timeline-entry" key={item.id || `${item.date}-${index}`}>
                  <span className={`timeline-entry-marker ${index === historyItems.length - 1 ? 'current' : ''}`}>
                    {index === historyItems.length - 1 ? <Clock3 size={14} /> : <Check size={14} />}
                  </span>
                  <div className="timeline-entry-body">
                    <div className="timeline-entry-top">
                      <strong>{item.title}</strong>
                      <span>{item.date}</span>
                    </div>
                    <p>{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <form className="comment-form" onSubmit={handleAddComment}>
              <div className="avatar avatar-blue">{userInitials}</div>
              <div className="comment-input-wrap">
                <input
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Type a response or use the Copilot draft reply…"
                  aria-label="Add a note"
                />
                <button type="submit" aria-label="Add note" disabled={!comment.trim() || commentSubmitting}>
                  <Send size={16} />
                </button>
              </div>
            </form>
            <small className="demo-disclaimer">
              <ShieldCheck size={13} /> Activity updates are persisted directly in campus database.
            </small>
          </section>
        </div>

        <aside className="detail-side-column">
          <section className="panel status-management-panel">
            <span className="panel-kicker">REQUEST STATUS</span>
            <h3>Where things stand</h3>
            <div className="status-stage-list">
              <div className={`status-stage ${historyItems.length >= 1 ? 'complete' : ''}`}>
                <span>{historyItems.length >= 1 ? <Check size={13} /> : '1'}</span>
                <div>
                  <strong>Submitted</strong>
                  <small>Request recorded</small>
                </div>
              </div>
              <div className={`status-stage ${request.status !== 'Open' ? 'complete' : 'active'}`}>
                <span>{request.status !== 'Open' ? <Check size={13} /> : '2'}</span>
                <div>
                  <strong>Under review</strong>
                  <small>Team is looking into it</small>
                </div>
              </div>
              <div className={`status-stage ${request.status === 'Resolved' ? 'complete' : ''}`}>
                <span>{request.status === 'Resolved' ? <Check size={13} /> : '3'}</span>
                <div>
                  <strong>Resolved</strong>
                  <small>Next steps completed</small>
                </div>
              </div>
            </div>

            {isStaffOrAdmin ? (
              <>
                <label htmlFor="staff-status-select" className="status-demo-label">Update status</label>
                <select
                  id="staff-status-select"
                  value={request.status}
                  onChange={(event) => changeStatus(event.target.value)}
                >
                  <option>Open</option>
                  <option>In progress</option>
                  <option>Resolved</option>
                  <option>Closed</option>
                </select>
                <small className="field-hint">Staff status update notifies the student.</small>
              </>
            ) : (
              <div style={{ marginTop: '12px' }}>
                <span className="field-hint">Current state: <strong>{request.status}</strong></span>
              </div>
            )}
          </section>

          <section className="panel assigned-panel">
            <div className="assigned-top">
              <span className="assigned-icon"><UserRound size={17} /></span>
              <span className="assigned-label">ASSIGNED TEAM</span>
            </div>
            <h3>{request.assigneeName || 'Student Services'}</h3>
            <p>Campus support team</p>
            <div className="assigned-response">
              <span className="green-dot" /> Typical response window <strong>1–2 days</strong>
            </div>
          </section>

          <div className="detail-help-note">
            <span><MessageSquareText size={17} /></span>
            <div>
              <strong>Have another question?</strong>
              <p>Start with the campus assistant or submit a separate request.</p>
              <Link to="/app/assistant">Ask assistant <ArrowUpRight size={14} /></Link>
            </div>
          </div>
        </aside>
      </div>

      {showDelete && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="confirm-modal">
            <span className="modal-warning-icon"><X size={20} /></span>
            <h3>Delete this request?</h3>
            <p>{request.requestCode || request.id} will be permanently removed.</p>
            <div className="modal-actions">
              <button className="button button-soft" onClick={() => setShowDelete(false)}>Cancel</button>
              <button className="button button-danger" onClick={removeRequest}>Delete request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function formatFriendlyDate(dateStr) {
  if (!dateStr) return 'Recently'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  } catch {
    return dateStr
  }
}
