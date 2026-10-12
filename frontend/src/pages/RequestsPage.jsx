import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownUp, ArrowRight, ArrowUpRight, Filter, ListFilter, Plus, Search, TicketCheck, X, AlertCircle } from 'lucide-react'
import { requestService } from '../services/api/requestService.js'
import { categoryService } from '../services/api/categoryService.js'

export default function RequestsPage() {
  const [requests, setRequests] = useState([])
  const [categoriesList, setCategoriesList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All statuses')
  const [category, setCategory] = useState('All categories')
  const [sort, setSort] = useState('Newest first')
  const [selected, setSelected] = useState([])
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [reqData, catData] = await Promise.all([
        requestService.list(),
        categoryService.list().catch(() => []),
      ])
      setRequests(reqData?.requests || [])
      setCategoriesList(Array.isArray(catData) ? catData : catData?.categories || [])
    } catch (err) {
      setError(err.message || 'Could not load requests.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  let list = [...requests]

  if (query.trim()) {
    const q = query.toLowerCase()
    list = list.filter((r) =>
      `${r.title || ''} ${r.requestCode || ''} ${r.description || ''}`.toLowerCase().includes(q)
    )
  }

  if (status !== 'All statuses') {
    list = list.filter((r) => r.status === status)
  }

  if (category !== 'All categories') {
    list = list.filter((r) => r.categoryId === category || r.categorySlug === category)
  }

  list.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return sort === 'Newest first' ? dateB - dateA : dateA - dateB
  })

  const allSelected = list.length > 0 && selected.length === list.length

  function toggleAll(checked) {
    setSelected(checked ? list.map((item) => item.id) : [])
  }

  async function deleteSelected() {
    setIsDeleting(true)
    try {
      await Promise.all(selected.map((id) => requestService.remove(id)))
      setSelected([])
      setConfirmDelete(false)
      await loadData()
    } catch (err) {
      alert(err.message || 'Could not delete one or more requests.')
    } finally {
      setIsDeleting(false)
    }
  }

  const statusClass = (value) =>
    value === 'Resolved' ? 'status-green' : value === 'In progress' ? 'status-blue' : 'status-orange'

  const openCount = requests.filter((r) => r.status === 'Open').length
  const inProgressCount = requests.filter((r) => r.status === 'In progress').length
  const resolvedCount = requests.filter((r) => r.status === 'Resolved' || r.status === 'Closed').length

  function getCategoryName(id, slug) {
    const match = categoriesList.find((c) => c.id === id || c.slug === slug || c.slug === id)
    return match?.name || match?.label || 'General'
  }

  return (
    <div className="page-stack">
      <div className="page-welcome">
        <div>
          <span className="eyebrow"><span className="eyebrow-dot" /> STUDENT WORKSPACE / REQUESTS</span>
          <h1>My requests<span className="heading-count">{requests.length}</span></h1>
          <p>Keep track of your campus service inquiries and follow their progress in real-time.</p>
        </div>
        <Link to="/app/requests/new" className="button button-blue">
          <Plus size={17} /> New request
        </Link>
      </div>

      <div className="requests-summary-strip">
        <div>
          <span className="summary-mini-icon orange"><ListFilter size={17} /></span>
          <div><strong>{openCount}</strong><small>Open</small></div>
        </div>
        <div>
          <span className="summary-mini-icon blue"><ArrowDownUp size={17} /></span>
          <div><strong>{inProgressCount}</strong><small>In progress</small></div>
        </div>
        <div>
          <span className="summary-mini-icon green"><TicketCheck size={17} /></span>
          <div><strong>{resolvedCount}</strong><small>Resolved</small></div>
        </div>
        <div className="summary-strip-note">
          <span className="small-online-dot" /> Live Aiven MySQL Connection
        </div>
      </div>

      {error && (
        <div className="field-error" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 8 }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <section className="panel requests-browser-panel">
        <div className="request-toolbar">
          <div className="request-search">
            <Search size={17} />
            <input
              type="search"
              placeholder="Search by title, ID or keywords..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <kbd>/</kbd>
            {query && (
              <button onClick={() => setQuery('')} aria-label="Clear search">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="request-filters">
            <label>
              <Filter size={15} />
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option>All statuses</option>
                <option>Open</option>
                <option>In progress</option>
                <option>Resolved</option>
              </select>
            </label>
            <label>
              <ListFilter size={15} />
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="All categories">All categories</option>
                {categoriesList.map((item) => (
                  <option value={item.id} key={item.id}>{item.name || item.label}</option>
                ))}
              </select>
            </label>
            <label className="sort-select">
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                <option>Newest first</option>
                <option>Oldest first</option>
              </select>
              <span>⌄</span>
            </label>
          </div>
        </div>

        {selected.length > 0 && (
          <div className="bulk-action-bar">
            <span>{selected.length} selected</span>
            <button onClick={() => setConfirmDelete(true)}>Delete selected</button>
            <button onClick={() => setSelected([])}>Clear selection</button>
          </div>
        )}

        <div className="requests-table-wrap">
          {loading ? (
            <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
              Loading requests…
            </div>
          ) : list.length === 0 ? (
            <div className="table-empty">
              <span className="empty-icon"><Search size={22} /></span>
              <strong>No requests found</strong>
              <p>{requests.length === 0 ? 'You have not submitted any requests yet.' : 'Try changing your search or filters.'}</p>
              {requests.length === 0 ? (
                <Link to="/app/requests/new" className="button button-blue" style={{ marginTop: 8 }}>
                  <Plus size={15} /> Create a request
                </Link>
              ) : (
                <button className="button button-soft" onClick={() => { setQuery(''); setStatus('All statuses'); setCategory('All categories') }}>
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <table className="requests-table requests-table-large">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      aria-label="Select all requests"
                      checked={allSelected}
                      onChange={(event) => toggleAll(event.target.checked)}
                    />
                  </th>
                  <th>Request details</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Last updated</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.map((request) => (
                  <tr key={request.id}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Select ${request.requestCode || request.id}`}
                        checked={selected.includes(request.id)}
                        onChange={(event) =>
                          setSelected(
                            event.target.checked
                              ? [...selected, request.id]
                              : selected.filter((id) => id !== request.id)
                          )
                        }
                      />
                    </td>
                    <td>
                      <Link to={`/app/requests/${request.id}`} className="request-title-cell">
                        <span className="request-row-icon"><TicketCheck size={17} /></span>
                        <span>
                          <strong>{request.title}</strong>
                          <small>
                            {request.requestCode || request.id.slice(0, 8)}{' '}
                            <span className="table-dot-separator">·</span> Created {formatDate(request.createdAt)}
                          </small>
                        </span>
                      </Link>
                    </td>
                    <td>
                      <span className="category-cell">
                        {getCategoryName(request.categoryId, request.categorySlug)}
                      </span>
                    </td>
                    <td>
                      <span className={`priority-label priority-${(request.priority || 'medium').toLowerCase()}`}>
                        <i />{request.priority || 'Medium'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${statusClass(request.status)}`}>
                        <i />{request.status}
                      </span>
                    </td>
                    <td className="date-cell">{formatDate(request.updatedAt || request.createdAt)}</td>
                    <td>
                      <Link to={`/app/requests/${request.id}`} className="table-arrow" aria-label={`View ${request.id}`}>
                        <ArrowUpRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="table-bottom">
          <span>Showing <strong>{list.length}</strong> of <strong>{requests.length}</strong> requests</span>
          <div className="table-pagination">
            <button disabled><ArrowRight size={15} className="rotate-left" /></button>
            <button className="page-current">1</button>
            <button disabled><ArrowRight size={15} /></button>
          </div>
        </div>
      </section>

      <div className="inline-tip">
        <span><TicketCheck size={17} /></span>
        <div>
          <strong>Not sure which category to pick?</strong>
          <p>Our campus assistant can help you find the right service or guide.</p>
        </div>
        <Link to="/app/assistant">Ask the assistant <ArrowRight size={15} /></Link>
      </div>

      {confirmDelete && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="confirm-modal">
            <span className="modal-warning-icon"><X size={20} /></span>
            <h3>Delete selected requests?</h3>
            <p>This will permanently remove {selected.length} item(s) from your database records. Only requests in 'Open' status can be deleted.</p>
            <div className="modal-actions">
              <button className="button button-soft" onClick={() => setConfirmDelete(false)} disabled={isDeleting}>
                Cancel
              </button>
              <button className="button button-danger" onClick={deleteSelected} disabled={isDeleting}>
                {isDeleting ? 'Deleting…' : 'Delete requests'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function formatDate(date) {
  if (!date) return 'Recently'
  const d = new Date(date)
  if (isNaN(d.getTime())) return 'Recently'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

