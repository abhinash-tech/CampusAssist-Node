import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { Activity, ArrowRight, ArrowUpRight, BookOpen, Building2, CalendarDays, CheckCircle2, CircleDashed, Clock3, FilePlus2, LifeBuoy, MessageCircle, Sparkles, TicketCheck, TrendingUp } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { requestService } from '../services/api/requestService.js'
import { categoryService } from '../services/api/categoryService.js'

function getDayLabel(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

function buildPastSevenDaysData(requestList) {
  const days = []
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(today.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const label = getDayLabel(d)

    const createdCount = requestList.filter((r) => {
      const createdStr = r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : ''
      return createdStr === dateStr
    }).length

    const resolvedCount = requestList.filter((r) => {
      if (r.status !== 'Resolved' && r.status !== 'Closed') return false
      const updatedStr = r.updatedAt ? new Date(r.updatedAt).toISOString().slice(0, 10) : ''
      return updatedStr === dateStr
    }).length

    days.push({ day: label, requests: createdCount, resolved: resolvedCount })
  }
  return days
}

const statusTone = (status) => (status === 'Resolved' ? 'status-green' : status === 'In progress' ? 'status-blue' : 'status-orange')

export default function DashboardPage() {
  const { currentUser } = useOutletContext() || {}
  const [requests, setRequests] = useState([])
  const [categoriesList, setCategoriesList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function loadData() {
      setLoading(true)
      try {
        const [reqData, catData] = await Promise.all([
          requestService.list().catch(() => ({ requests: [] })),
          categoryService.list().catch(() => []),
        ])
        if (mounted) {
          setRequests(reqData?.requests || [])
          setCategoriesList(Array.isArray(catData) ? catData : catData?.categories || [])
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadData()
    return () => { mounted = false }
  }, [])

  const openCount = requests.filter((r) => r.status === 'Open').length
  const inProgressCount = requests.filter((r) => r.status === 'In progress').length
  const resolvedCount = requests.filter((r) => r.status === 'Resolved' || r.status === 'Closed').length
  const recent = [...requests].slice(0, 5)
  const chartData = buildPastSevenDaysData(requests)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = currentUser?.fullName ? currentUser.fullName.split(' ')[0] : 'there'
  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).toUpperCase()

  function getCatLabel(id, slug) {
    const match = categoriesList.find((c) => c.id === id || c.slug === slug || c.slug === id)
    return match?.name || match?.label || 'General support'
  }

  return (
    <div className="page-stack">
      <div className="page-welcome">
        <div>
          <span className="eyebrow"><span className="eyebrow-dot" /> {currentDateFormatted}</span>
          <h1>{greeting}, {firstName}<span className="greeting-wave">✳</span></h1>
          <p>Here's a live overview of your campus support requests in Aiven MySQL.</p>
        </div>
        <div className="welcome-actions">
          <button className="button button-soft" onClick={() => window.print()}>
            <CalendarDays size={16} /> Print summary
          </button>
          <Link to="/app/requests/new" className="button button-blue">
            <FilePlus2 size={16} /> New request
          </Link>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon={TicketCheck} label="Total requests" value={requests.length.toString().padStart(2, '0')} change="Across all categories" tone="blue" />
        <StatCard icon={Clock3} label="Open requests" value={openCount.toString().padStart(2, '0')} change="Waiting for team review" tone="orange" />
        <StatCard icon={Activity} label="In progress" value={inProgressCount.toString().padStart(2, '0')} change="Currently being handled" tone="violet" />
        <StatCard icon={CheckCircle2} label="Resolved" value={resolvedCount.toString().padStart(2, '0')} change="Successfully completed" tone="green" />
      </div>

      <div className="dashboard-main-grid">
        <section className="panel activity-chart-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">DATABASE ACTIVITY</span>
              <h2>Your support overview</h2>
              <p>Requests recorded across the past 7 days</p>
            </div>
          </div>
          <div className="chart-legend">
            <span><i className="legend-dot legend-blue" /> Requests created</span>
            <span><i className="legend-dot legend-orange" /> Requests resolved</span>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 4, left: -14, bottom: 0 }}>
                <defs>
                  <linearGradient id="requestFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3d77f6" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#3d77f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="resolvedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff805f" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#ff805f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#edf0f5" strokeDasharray="4 5" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#8a95a7', fontSize: 13 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8a95a7', fontSize: 13 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #edf0f5', boxShadow: '0 12px 40px rgba(11,28,53,.10)', fontFamily: 'DM Sans', fontSize: '13px' }} />
                <Area type="monotone" dataKey="requests" name="Requests created" stroke="#3d77f6" strokeWidth={2.5} fill="url(#requestFill)" />
                <Area type="monotone" dataKey="resolved" name="Requests resolved" stroke="#ff805f" strokeWidth={2.5} fill="url(#resolvedFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-footer">
            <span><TrendingUp size={15} /> Real database-backed statistics for your account.</span>
            <Link to="/app/requests">View all requests <ArrowRight size={15} /></Link>
          </div>
        </section>

        <section className="panel assistant-panel">
          <div className="assistant-panel-top">
            <div className="assistant-orb"><Sparkles size={20} /></div>
            <span className="status-online"><i /> Live AI Available</span>
          </div>
          <span className="panel-kicker">CAMPUSASSIST AI</span>
          <h2>One question can move you forward.</h2>
          <p>Explore campus guides or get a starting point for your next support request in English or తెలుగు.</p>
          <div className="assistant-suggestion"><span>“How do I request an attendance review?”</span><ArrowUpRight size={17} /></div>
          <div className="assistant-suggestion"><span>“Requesting a bonafide certificate”</span><ArrowUpRight size={17} /></div>
          <Link to="/app/assistant" className="button button-dark button-full">Talk to the assistant <ArrowRight size={16} /></Link>
        </section>
      </div>

      <div className="dashboard-lower-grid">
        <section className="panel requests-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">YOUR WORKSPACE</span>
              <h2>Recent requests</h2>
            </div>
            <Link to="/app/requests" className="panel-view-link">View all <ArrowUpRight size={15} /></Link>
          </div>
          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#8a95a7' }}>Loading records…</div>
          ) : recent.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <TicketCheck size={22} />
              </div>
              <strong style={{ display: 'block', fontSize: '15px', color: '#1e293b', marginBottom: 4 }}>No requests submitted yet</strong>
              <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 16px' }}>Need help with attendance, certificates, Wi-Fi, or hostel? Submit your first request.</p>
              <Link to="/app/requests/new" className="button button-blue" style={{ display: 'inline-flex' }}>
                <FilePlus2 size={15} /> Create your first request
              </Link>
            </div>
          ) : (
            <div className="requests-table-wrap">
              <table className="requests-table">
                <thead>
                  <tr>
                    <th>Request</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Updated</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {recent.map((request) => (
                    <tr key={request.id}>
                      <td>
                        <Link to={`/app/requests/${request.id}`} className="request-title-cell">
                          <span className="request-row-icon"><TicketCheck size={17} /></span>
                          <span>
                            <strong>{request.title}</strong>
                            <small>{request.requestCode || request.id.slice(0, 8)}</small>
                          </span>
                        </Link>
                      </td>
                      <td><span className="category-cell">{getCatLabel(request.categoryId, request.categorySlug)}</span></td>
                      <td><span className={`status-pill ${statusTone(request.status)}`}><i />{request.status}</span></td>
                      <td className="date-cell">{formatDate(request.updatedAt || request.createdAt)}</td>
                      <td>
                        <Link to={`/app/requests/${request.id}`} className="table-arrow" aria-label="Open request">
                          <ArrowUpRight size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="panel-bottom-link">
            <Link to="/app/requests/new"><FilePlus2 size={15} /> Create a support request</Link>
          </div>
        </section>

        <section className="panel quick-links-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">SERVICES</span>
              <h2>Campus categories</h2>
            </div>
            <span className="tiny-count">{categoriesList.length.toString().padStart(2, '0')}</span>
          </div>
          <div className="quick-links-list">
            {categoriesList.slice(0, 4).map((category) => (
              <Link key={category.id} to="/app/requests/new" className="quick-link-row">
                <span className={`quick-link-icon ${category.slug || 'blue'}`}>
                  <CategoryIcon id={category.slug || category.id} />
                </span>
                <span>
                  <strong>{category.name || category.label}</strong>
                  <small>{category.description || 'Campus service category'}</small>
                </span>
                <ArrowUpRight size={16} />
              </Link>
            ))}
          </div>
          <div className="quick-help">
            <div className="quick-help-icon"><MessageCircle size={17} /></div>
            <div>
              <strong>Need help finding the right place?</strong>
              <span>Ask our campus assistant.</span>
            </div>
            <Link to="/app/assistant" aria-label="Ask the campus assistant"><ArrowRight size={17} /></Link>
          </div>
        </section>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, change, tone }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}><Icon size={18} /></div>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value}<span className={`stat-trend ${tone}`}><ArrowUpRight size={14} /></span></div>
      <div className="stat-card-caption">{change}</div>
      <div className={`stat-card-ribbon ${tone}`} />
    </div>
  )
}

function CategoryIcon({ id }) {
  if (id === 'academic' || id?.includes('acad')) return <BookOpen size={18} />
  if (id === 'campus') return <Building2 size={18} />
  if (id === 'technical' || id?.includes('tech')) return <CircleDashed size={18} />
  return <LifeBuoy size={18} />
}

function formatDate(date) {
  if (!date) return 'Recently'
  const d = new Date(date)
  if (isNaN(d.getTime())) return 'Recently'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

