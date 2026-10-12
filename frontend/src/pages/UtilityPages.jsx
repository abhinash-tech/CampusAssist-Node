import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Activity, ArrowRight, ArrowUpRight, BookOpen, Building2, Check, CheckCircle2, ClipboardList, Clock3, FileText, Filter, GraduationCap, Grid2X2, LifeBuoy, Plus, Search, ShieldCheck, Sparkles, Trash2, Users, AlertCircle, X } from 'lucide-react'
import { knowledgeService } from '../services/api/knowledgeService.js'
import { requestService } from '../services/api/requestService.js'
import { categoryService } from '../services/api/categoryService.js'
import { authService } from '../services/authService.js'

// ==========================================
// 1. Knowledge Centre (Public/Student View)
// ==========================================
export function KnowledgePage() {
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeArticle, setActiveArticle] = useState(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    knowledgeService.list()
      .then((data) => {
        if (!active) return
        const list = Array.isArray(data) ? data : data?.articles || []
        setArticles(list)
      })
      .catch((err) => {
        if (!active) return
        setError(err.message || 'Could not load knowledge resources.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const filtered = articles
    .filter((a) => !categoryFilter || a.category?.toLowerCase() === categoryFilter.toLowerCase())
    .filter((a) => {
      if (!query.trim()) return true
      const q = query.toLowerCase()
      return `${a.title || ''} ${a.summary || ''} ${a.category || ''} ${a.content || ''}`.toLowerCase().includes(q)
    })

  return (
    <div className="page-stack">
      <div className="page-welcome">
        <div>
          <span className="eyebrow"><span className="eyebrow-dot" /> CAMPUS RESOURCES / KNOWLEDGE</span>
          <h1>Knowledge centre</h1>
          <p>Practical campus guides grounded in verified documents.</p>
        </div>
        <div className="knowledge-total">
          <strong>{articles.length.toString().padStart(2, '0')}</strong>
          <span>Published guides</span>
        </div>
      </div>

      <div className="knowledge-search-banner">
        <div className="knowledge-search-mark"><BookOpen size={23} /></div>
        <div>
          <h2>What would you like to know?</h2>
          <p>Search official campus guides and departmental procedures.</p>
        </div>
        <label className="knowledge-search">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search guides and topics…"
          />
        </label>
      </div>

      <div className="knowledge-category-row">
        <button
          className={`knowledge-category ${categoryFilter === '' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('')}
        >
          <Grid2X2 size={15} /> All guides <span>{articles.length}</span>
        </button>
        {['Academics', 'Administration', 'Digital services', 'Campus life'].map((item) => (
          <button
            key={item}
            className={`knowledge-category ${categoryFilter === item ? 'active' : ''}`}
            onClick={() => setCategoryFilter(categoryFilter === item ? '' : item)}
          >
            {item}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="panel" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
          Loading campus guides from database…
        </div>
      ) : error ? (
        <div className="table-empty" style={{ color: '#ef4444' }}>
          <strong>Error loading guides:</strong> {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="table-empty">
          <strong>{articles.length === 0 ? 'No campus guides published yet.' : 'No guides match your search.'}</strong>
          {articles.length === 0 ? (
            <p style={{ marginTop: '8px', color: '#64748b' }}>
              Campus administrators can publish verified guides from the Knowledge management panel.
            </p>
          ) : (
            <button className="button button-soft" onClick={() => { setQuery(''); setCategoryFilter('') }}>
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="knowledge-grid">
          {filtered.map((article, index) => (
            <article className="knowledge-card" key={article.id}>
              <div className={`knowledge-card-art art-${index % 4}`}>
                <span className="knowledge-card-count">{String(index + 1).padStart(2, '0')} / GUIDE</span>
                <div className="knowledge-art-icon">
                  {index % 4 === 0 ? <GraduationCap size={24} /> : index % 4 === 1 ? <FileText size={24} /> : index % 4 === 2 ? <Grid2X2 size={24} /> : <LifeBuoy size={24} />}
                </div>
                <span className="knowledge-art-ring" />
              </div>
              <div className="knowledge-card-body">
                <span className="knowledge-tag">{article.category}</span>
                <h3>{article.title}</h3>
                <p>{article.summary}</p>
                <div className="knowledge-card-meta">
                  <span>{article.read || '3 min read'}</span>
                  <span>{article.updatedAt ? new Date(article.updatedAt).toLocaleDateString() : 'Updated recently'}</span>
                </div>
                <button
                  className="text-link"
                  onClick={() => setActiveArticle(article)}
                >
                  Read guide <span><ArrowUpRight size={16} /></span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {activeArticle && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setActiveArticle(null)}>
          <div className="panel" style={{ maxWidth: '640px', width: '90%', margin: 'auto', padding: '28px', background: '#ffffff', borderRadius: '16px', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <button
              style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'transparent', cursor: 'pointer' }}
              onClick={() => setActiveArticle(null)}
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <span className="knowledge-tag">{activeArticle.category}</span>
            <h2 style={{ margin: '12px 0 8px 0', fontSize: '20px' }}>{activeArticle.title}</h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>{activeArticle.summary}</p>
            <div style={{ lineHeight: 1.6, fontSize: '14px', color: '#1e293b', whiteSpace: 'pre-line', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              {activeArticle.content || activeArticle.summary}
            </div>
          </div>
        </div>
      )}

      <div className="knowledge-contact-strip">
        <span><Sparkles size={18} /></span>
        <div>
          <strong>Didn't find what you need?</strong>
          <p>Our AI assistant can ground answers in these guides or help you file a request.</p>
        </div>
        <Link to="/app/assistant" className="button button-dark">
          Ask the assistant <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  )
}

// ==========================================
// 2. Activity Timeline Page
// ==========================================
export function ActivityPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    requestService.list()
      .then((data) => {
        if (!active) return
        const list = Array.isArray(data) ? data : data?.requests || []
        setRequests(list)
      })
      .catch((err) => {
        if (!active) return
        setError(err.message || 'Could not load activity.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const rows = requests.map((req) => ({
    id: req.id,
    requestId: req.requestCode || req.id,
    reqId: req.id,
    title: `Request updated · ${req.status}`,
    detail: `${req.title} (${req.priority} priority)`,
    date: req.updatedAt ? new Date(req.updatedAt).toLocaleString() : 'Recently',
    status: req.status,
  }))

  return (
    <div className="page-stack">
      <div className="page-welcome">
        <div>
          <span className="eyebrow"><span className="eyebrow-dot" /> WORKSPACE / ACTIVITY</span>
          <h1>Activity timeline</h1>
          <p>A running view of updates across your authenticated requests.</p>
        </div>
        <Link to="/app/requests" className="button button-soft">
          My requests <ArrowUpRight size={16} />
        </Link>
      </div>

      <div className="panel activity-feed-panel">
        <div className="panel-heading">
          <div>
            <span className="panel-kicker">ALL ACTIVITY</span>
            <h2>Recent updates</h2>
          </div>
          <span className="tiny-count">{rows.length.toString().padStart(2, '0')}</span>
        </div>

        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
            Loading activity from campus database…
          </div>
        ) : error ? (
          <div className="table-empty" style={{ color: '#ef4444' }}>
            {error}
          </div>
        ) : rows.length === 0 ? (
          <div className="table-empty">
            <strong>No activity recorded yet.</strong>
            <p style={{ marginTop: '8px', color: '#64748b' }}>
              When you submit service requests or staff updates status, timeline events will appear here.
            </p>
          </div>
        ) : (
          <div className="activity-feed">
            {rows.map((item, index) => (
              <div className="activity-feed-row" key={item.id}>
                <span className={`activity-feed-icon icon-tone-${index % 4}`}>
                  {index % 3 === 0 ? <CheckCircle2 size={17} /> : index % 3 === 1 ? <Clock3 size={17} /> : <Activity size={17} />}
                </span>
                <div className="activity-feed-body">
                  <div className="activity-feed-title">
                    <strong>{item.title}</strong>
                    <span>{item.date}</span>
                  </div>
                  <p>{item.detail}</p>
                  <Link to={`/app/requests/${item.reqId}`}>
                    {item.requestId} <ArrowUpRight size={13} />
                  </Link>
                </div>
                <span className={`status-pill ${item.status === 'Resolved' ? 'status-green' : item.status === 'In progress' ? 'status-blue' : 'status-orange'}`}>
                  <i />{item.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ==========================================
// 3. Staff Request Operations Queue
// ==========================================
export function StaffPage() {
  const currentUser = authService.getCurrentUser()
  const isAuthorized = currentUser?.role === 'staff' || currentUser?.role === 'admin'

  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')

  async function loadQueue() {
    try {
      setLoading(true)
      const data = await requestService.list()
      const list = Array.isArray(data) ? data : data?.requests || []
      setRequests(list)
    } catch (err) {
      setError(err.message || 'Could not load staff queue.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthorized) {
      loadQueue()
    }
  }, [isAuthorized])

  if (!isAuthorized) {
    return (
      <div className="page-stack">
        <div className="panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <ShieldCheck size={32} style={{ color: '#ef4444', marginBottom: '12px' }} />
          <h2>Staff Access Restricted</h2>
          <p style={{ maxWidth: '440px', margin: '8px auto', color: '#64748b' }}>
            The Request Operations queue requires staff or administrator permissions. Your current account role is <strong>{currentUser?.role || 'student'}</strong>.
          </p>
          <Link to="/app/requests" className="button button-blue" style={{ marginTop: '16px' }}>
            Go to My Requests
          </Link>
        </div>
      </div>
    )
  }

  const filtered = requests
    .filter((req) => `${req.requestCode || req.id} ${req.title} ${req.ownerName || ''} ${req.description}`.toLowerCase().includes(query.toLowerCase()))
    .filter((req) => filter === 'All' || req.status === filter)

  const openCount = requests.filter((r) => r.status === 'Open').length
  const activeCount = requests.filter((r) => r.status === 'In progress').length
  const resolvedCount = requests.filter((r) => r.status === 'Resolved').length

  async function handleStatusChange(id, newStatus) {
    try {
      await requestService.updateStatus(id, newStatus)
      await loadQueue()
    } catch (err) {
      alert(`Could not update status: ${err.message}`)
    }
  }

  return (
    <div className="page-stack">
      <div className="page-welcome">
        <div>
          <span className="eyebrow"><span className="eyebrow-dot" /> STAFF WORKSPACE / SERVICE DESK</span>
          <h1>Request operations</h1>
          <p>A shared queue for handling campus student requests in real time.</p>
        </div>
        <span className="role-preview-badge">
          <Users size={15} /> Staff Copilot Enabled
        </span>
      </div>

      <div className="stats-grid staff-stats">
        <StaffStat label="Needs attention" value={String(openCount).padStart(2, '0')} tone="orange" />
        <StaffStat label="Being handled" value={String(activeCount).padStart(2, '0')} tone="blue" />
        <StaffStat label="Resolved" value={String(resolvedCount).padStart(2, '0')} tone="green" />
        <StaffStat label="In queue" value={String(openCount + activeCount).padStart(2, '0')} tone="violet" />
      </div>

      <div className="panel staff-queue-panel">
        <div className="staff-toolbar">
          <div>
            <span className="panel-kicker">SERVICE REQUEST QUEUE</span>
            <h2>All requests</h2>
          </div>
          <label className="request-search">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search requests…"
            />
          </label>
          <label className="staff-filter">
            <Filter size={14} />
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option>All</option>
              <option>Open</option>
              <option>In progress</option>
              <option>Resolved</option>
            </select>
          </label>
        </div>

        <div className="requests-table-wrap">
          <table className="requests-table requests-table-large">
            <thead>
              <tr>
                <th>Request</th>
                <th>Student</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Last updated</th>
                <th>Actions & Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((request) => (
                <tr key={request.id}>
                  <td>
                    <Link to={`/app/requests/${request.id}`} className="request-title-cell">
                      <span className="request-row-icon"><ClipboardList size={17} /></span>
                      <span>
                        <strong>{request.title}</strong>
                        <small>{request.requestCode || request.id}</small>
                      </span>
                    </Link>
                  </td>
                  <td>
                    <span className="student-name-cell">
                      <span className="avatar avatar-soft">
                        {(request.ownerName || 'Student').split(' ').map((item) => item[0]).slice(0, 2).join('')}
                      </span>
                      {request.ownerName || 'Student'}
                    </span>
                  </td>
                  <td>
                    <span className={`priority-label priority-${(request.priority || 'medium').toLowerCase()}`}>
                      <i />{request.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${request.status === 'Resolved' ? 'status-green' : request.status === 'In progress' ? 'status-blue' : 'status-orange'}`}>
                      <i />{request.status}
                    </span>
                  </td>
                  <td className="date-cell">
                    {request.updatedAt ? new Date(request.updatedAt).toLocaleDateString() : 'Recent'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <select
                        className="table-status-select"
                        aria-label={`Update status for ${request.requestCode || request.id}`}
                        value={request.status}
                        onChange={(event) => handleStatusChange(request.id, event.target.value)}
                      >
                        <option>Open</option>
                        <option>In progress</option>
                        <option>Resolved</option>
                        <option>Closed</option>
                      </select>
                      <Link
                        to={`/app/requests/${request.id}`}
                        className="button button-soft"
                        style={{ minHeight: '32px', padding: '0 10px', fontSize: '12px' }}
                        title="Open Copilot brief and details"
                      >
                        <Sparkles size={12} /> Copilot
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="table-empty">
              {loading ? 'Loading queue from campus database…' : 'No requests match this filter.'}
            </div>
          )}
        </div>
        <div className="staff-note">
          <ShieldCheck size={15} /> Staff Copilot provides automatic executive summarization, key fact extraction, and draft reply generation.
        </div>
      </div>
    </div>
  )
}

// ==========================================
// 4. Admin Category Configuration
// ==========================================
export function AdminCategoriesPage() {
  const currentUser = authService.getCurrentUser()
  const isAdmin = currentUser?.role === 'admin'

  const [categories, setCategories] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function loadData() {
    try {
      setLoading(true)
      const [catData, reqData] = await Promise.all([
        categoryService.list(),
        requestService.list().catch(() => []),
      ])
      setCategories(Array.isArray(catData) ? catData : catData?.categories || [])
      setRequests(Array.isArray(reqData) ? reqData : reqData?.requests || [])
    } catch (err) {
      setError(err.message || 'Could not load service categories.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      loadData()
    }
  }, [isAdmin])

  if (!isAdmin) {
    return (
      <div className="page-stack">
        <div className="panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <ShieldCheck size={32} style={{ color: '#ef4444', marginBottom: '12px' }} />
          <h2>Administrator Access Required</h2>
          <p style={{ maxWidth: '440px', margin: '8px auto', color: '#64748b' }}>
            Service category configuration requires administrator permissions. Your current role is <strong>{currentUser?.role || 'student'}</strong>.
          </p>
        </div>
      </div>
    )
  }

  async function handleAdd(event) {
    event.preventDefault()
    if (!form.name.trim() || form.name.trim().length < 3) {
      setError('Enter a category name of at least 3 characters.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await categoryService.create({
        name: form.name.trim(),
        description: form.description.trim() || 'A campus support category.',
      })
      setForm({ name: '', description: '' })
      setAddOpen(false)
      await loadData()
    } catch (err) {
      setError(err.message || 'Could not save category.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete category “${name}” from database?`)) return
    try {
      await categoryService.remove(id)
      await loadData()
    } catch (err) {
      alert(`Could not delete category: ${err.message}`)
    }
  }

  return (
    <div className="page-stack">
      <div className="page-welcome">
        <div>
          <span className="eyebrow"><span className="eyebrow-dot" /> ADMIN / SERVICE CONFIGURATION</span>
          <h1>Service categories</h1>
          <p>Organize the kinds of support students can request.</p>
        </div>
        <button className="button button-blue" onClick={() => setAddOpen(!addOpen)}>
          <Plus size={17} /> Add category
        </button>
      </div>

      <div className="admin-info-banner">
        <span><ShieldCheck size={17} /></span>
        <div>
          <strong>Database-backed Categories</strong>
          <p>Categories are persisted directly to Aiven MySQL and determine ticket routing.</p>
        </div>
      </div>

      {addOpen && (
        <form className="panel admin-add-form" onSubmit={handleAdd}>
          <div className="form-field">
            <label htmlFor="new-category">Category name *</label>
            <input
              id="new-category"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="e.g. Library services"
            />
            {error && <small className="field-error">{error}</small>}
          </div>
          <div className="form-field">
            <label htmlFor="new-category-description">Description</label>
            <input
              id="new-category-description"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="What does this category cover?"
            />
          </div>
          <div className="admin-add-actions">
            <button type="button" className="button button-soft" onClick={() => setAddOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="button button-blue" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save category'} <Check size={15} />
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          Loading categories from MySQL…
        </div>
      ) : (
        <div className="admin-category-grid">
          {categories.map((item, index) => {
            const reqCount = requests.filter((r) => r.categoryId === item.id || r.categoryName === item.name).length
            return (
              <article className="panel admin-category-card" key={item.id}>
                <div className="admin-category-card-top">
                  <span className={`category-admin-icon tone-${item.tone || 'blue'}`}>
                    {index === 0 ? <GraduationCap size={21} /> : index === 1 ? <Building2 size={21} /> : index === 2 ? <Grid2X2 size={21} /> : <ClipboardList size={21} />}
                  </span>
                  <span className="category-id">CAT / {String(index + 1).padStart(2, '0')}</span>
                  <button
                    className="icon-button delete-small"
                    aria-label={`Delete ${item.name}`}
                    onClick={() => handleDelete(item.id, item.name)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <div className="admin-category-footer">
                  <span><span className="small-online-dot" /> Active</span>
                  <span>{reqCount} requests</span>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ==========================================
// 5. Admin Knowledge Resources Management
// ==========================================
export function AdminKnowledgePage() {
  const currentUser = authService.getCurrentUser()
  const isAuthorized = currentUser?.role === 'admin' || currentUser?.role === 'staff'

  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ title: '', category: 'Academics', summary: '', content: '' })
  const [error, setError] = useState('')

  async function loadArticles() {
    try {
      setLoading(true)
      const data = await knowledgeService.list()
      const list = Array.isArray(data) ? data : data?.articles || []
      setArticles(list)
    } catch (err) {
      setError(err.message || 'Could not load knowledge resources.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthorized) {
      loadArticles()
    }
  }, [isAuthorized])

  if (!isAuthorized) {
    return (
      <div className="page-stack">
        <div className="panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <ShieldCheck size={32} style={{ color: '#ef4444', marginBottom: '12px' }} />
          <h2>Knowledge Administration Restricted</h2>
          <p style={{ maxWidth: '440px', margin: '8px auto', color: '#64748b' }}>
            Knowledge resource management requires staff or administrator permissions. Your current role is <strong>{currentUser?.role || 'student'}</strong>.
          </p>
        </div>
      </div>
    )
  }

  async function handleAdd(event) {
    event.preventDefault()
    if (form.title.trim().length < 4 || form.summary.trim().length < 10) {
      setError('Provide a title (min 4 chars) and a summary (min 10 chars).')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await knowledgeService.create({
        title: form.title.trim(),
        category: form.category,
        summary: form.summary.trim(),
        content: form.content.trim() || form.summary.trim(),
      })
      setForm({ title: '', category: 'Academics', summary: '', content: '' })
      setAdding(false)
      await loadArticles()
    } catch (err) {
      setError(err.message || 'Could not save knowledge resource.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Delete “${title}” from campus knowledge base?`)) return
    try {
      await knowledgeService.remove(id)
      await loadArticles()
    } catch (err) {
      alert(`Could not delete article: ${err.message}`)
    }
  }

  return (
    <div className="page-stack">
      <div className="page-welcome">
        <div>
          <span className="eyebrow"><span className="eyebrow-dot" /> ADMIN / KNOWLEDGE</span>
          <h1>Knowledge resources</h1>
          <p>Curate the verified guides that help students and ground the AI assistant.</p>
        </div>
        <button className="button button-blue" onClick={() => setAdding(!adding)}>
          <Plus size={17} /> Add resource
        </button>
      </div>

      <div className="admin-info-banner">
        <span><BookOpen size={17} /></span>
        <div>
          <strong>Verified Knowledge Base</strong>
          <p>Published resources are automatically indexed for search and Gemini AI grounding.</p>
        </div>
      </div>

      {adding && (
        <form className="panel admin-article-form" onSubmit={handleAdd}>
          <div className="form-field">
            <label htmlFor="article-title">Title *</label>
            <input
              id="article-title"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="e.g. Attendance Review Guidelines"
            />
          </div>
          <div className="form-field">
            <label htmlFor="article-category">Category</label>
            <select
              id="article-category"
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
            >
              <option>Academics</option>
              <option>Administration</option>
              <option>Digital services</option>
              <option>Campus life</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="article-summary">Summary *</label>
            <textarea
              id="article-summary"
              rows={2}
              value={form.summary}
              onChange={(event) => setForm({ ...form, summary: event.target.value })}
              placeholder="What will students learn from this guide? (min 10 chars)"
            />
          </div>
          <div className="form-field">
            <label htmlFor="article-content">Detailed Content</label>
            <textarea
              id="article-content"
              rows={4}
              value={form.content}
              onChange={(event) => setForm({ ...form, content: event.target.value })}
              placeholder="Detailed guidelines, eligibility criteria, and instructions…"
            />
          </div>
          {error && <small className="field-error">{error}</small>}
          <div className="admin-add-actions">
            <button type="button" className="button button-soft" onClick={() => setAdding(false)}>
              Cancel
            </button>
            <button type="submit" className="button button-blue" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save resource'} <Check size={15} />
            </button>
          </div>
        </form>
      )}

      <div className="panel admin-article-list">
        <div className="panel-heading">
          <div>
            <span className="panel-kicker">PUBLISHED GUIDES</span>
            <h2>All resources</h2>
          </div>
          <span className="tiny-count">{articles.length.toString().padStart(2, '0')}</span>
        </div>

        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
            Loading resources from database…
          </div>
        ) : articles.length === 0 ? (
          <div className="table-empty">
            No knowledge resources published yet. Click "Add resource" to create the first guide.
          </div>
        ) : (
          articles.map((article) => (
            <div className="admin-article-row" key={article.id}>
              <span className="article-row-icon"><BookOpen size={18} /></span>
              <div className="admin-article-main">
                <strong>{article.title}</strong>
                <p>{article.summary}</p>
                <span>{article.category} {article.updatedAt && `· Updated ${new Date(article.updatedAt).toLocaleDateString()}`}</span>
              </div>
              <button
                className="icon-button delete-small"
                aria-label={`Delete ${article.title}`}
                onClick={() => handleDelete(article.id, article.title)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ==========================================
// 6. User Profile & Settings
// ==========================================
export function ProfilePage() {
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser())
  const [form, setForm] = useState({
    fullName: currentUser?.fullName || '',
    email: currentUser?.email || '',
    studentId: currentUser?.studentId || '',
    department: currentUser?.department || 'Computer Science',
    section: currentUser?.section || 'A',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    authService.fetchMe()
      .then((user) => {
        if (!active || !user) return
        setCurrentUser(user)
        setForm({
          fullName: user.fullName || '',
          email: user.email || '',
          studentId: user.studentId || '',
          department: user.department || 'Computer Science',
          section: user.section || 'A',
        })
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

  async function handleSave(event) {
    event.preventDefault()
    if (!form.fullName.trim()) {
      setError('Full name cannot be blank.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const updated = await authService.updateProfile({
        fullName: form.fullName.trim(),
        studentId: form.studentId.trim() || undefined,
        department: form.department,
        section: form.section,
      })
      setCurrentUser(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err.message || 'Could not update profile.')
    } finally {
      setSaving(false)
    }
  }

  const roleLabel = currentUser?.role === 'admin'
    ? 'Campus Administrator'
    : currentUser?.role === 'staff'
    ? 'Staff Member'
    : 'Verified Student'

  const initials = (form.fullName || 'User')
    .split(' ')
    .map((item) => item[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="page-stack">
      <div className="page-welcome">
        <div>
          <span className="eyebrow"><span className="eyebrow-dot" /> ACCOUNT / PROFILE</span>
          <h1>Profile & settings</h1>
          <p>Manage your campus identity and notification preferences.</p>
        </div>
        <span className="role-preview-badge">
          <ShieldCheck size={15} /> {roleLabel}
        </span>
      </div>

      <div className="profile-page-grid">
        <section className="panel profile-form-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">YOUR DETAILS</span>
              <h2>Personal information</h2>
              <p>Profile details are persisted in Aiven MySQL and linked to your session.</p>
            </div>
          </div>

          <form onSubmit={handleSave}>
            <div className="profile-hero-row">
              <span className="profile-large-avatar">{initials}</span>
              <div>
                <strong>{form.fullName || 'Campus User'}</strong>
                <span>{roleLabel} · {form.department}</span>
                <small>{currentUser?.email}</small>
              </div>
            </div>

            {error && (
              <div className="login-error-banner" role="alert" style={{ marginBottom: '16px' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-field">
              <label htmlFor="profile-name">Full name</label>
              <input
                id="profile-name"
                value={form.fullName}
                onChange={(event) => setForm({ ...form, fullName: event.target.value })}
              />
            </div>

            <div className="form-field">
              <label htmlFor="profile-email">Email address</label>
              <input
                id="profile-email"
                type="email"
                value={form.email}
                disabled
                title="Email is verified and cannot be changed here."
                style={{ opacity: 0.8, background: '#f8fafc', cursor: 'not-allowed' }}
              />
              <small className="field-hint">Registered campus account email.</small>
            </div>

            <div className="form-row-fields">
              <div className="form-field">
                <label htmlFor="profile-roll">Roll / Student ID</label>
                <input
                  id="profile-roll"
                  value={form.studentId}
                  onChange={(event) => setForm({ ...form, studentId: event.target.value })}
                  placeholder="e.g. 24EG105Q40"
                />
              </div>
              <div className="form-field">
                <label htmlFor="profile-branch">Department / Branch</label>
                <select
                  id="profile-branch"
                  value={form.department}
                  onChange={(event) => setForm({ ...form, department: event.target.value })}
                >
                  <option>Computer Science</option>
                  <option>Artificial Intelligence</option>
                  <option>Information Technology</option>
                  <option>Data Science</option>
                  <option>Electronics</option>
                  <option>Mechanical</option>
                </select>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="profile-section">Section</label>
              <select
                id="profile-section"
                value={form.section}
                onChange={(event) => setForm({ ...form, section: event.target.value })}
              >
                {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'Q'].map((sec) => (
                  <option key={sec}>{sec}</option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <span className={saved ? 'save-feedback show' : 'save-feedback'}>
                {saved && <><Check size={14} /> Saved to database</>}
              </span>
              <button type="submit" className="button button-blue" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'} <Check size={15} />
              </button>
            </div>
          </form>
        </section>

        <aside className="profile-side-stack">
          <div className="panel profile-demo-card">
            <span className="profile-demo-icon"><ShieldCheck size={19} /></span>
            <h3>Security & Session</h3>
            <p>Your session is cryptographically signed and authenticated by the backend.</p>
            <div className="demo-detail-line">
              <span>Authentication</span>
              <strong>JWT Verified</strong>
            </div>
            <div className="demo-detail-line">
              <span>Database</span>
              <strong>Aiven MySQL</strong>
            </div>
            <div className="demo-detail-line">
              <span>Assigned Role</span>
              <strong>{currentUser?.role || 'student'}</strong>
            </div>
          </div>

          <div className="panel support-card-mini">
            <span><LifeBuoy size={18} /></span>
            <div>
              <strong>Need help?</strong>
              <p>Explore support options or ask the AI assistant.</p>
              <Link to="/app/assistant">Open assistant <ArrowRight size={14} /></Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function StaffStat({ label, value, tone }) {
  return (
    <div className="stat-card staff-stat-card">
      <div className={`stat-icon ${tone}`}>
        {tone === 'orange' ? <Clock3 size={18} /> : tone === 'blue' ? <Activity size={18} /> : tone === 'green' ? <CheckCircle2 size={18} /> : <ClipboardList size={18} />}
      </div>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value}</div>
      <div className={`stat-card-ribbon ${tone}`} />
    </div>
  )
}
