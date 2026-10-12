import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Activity, ArrowLeft, BookOpen, Bot, Building2, ChevronDown, ClipboardList, Command, HelpCircle, LayoutDashboard, LifeBuoy, LogOut, Menu, MessageCircle, Settings, ShieldCheck, Users, X, FolderKanban } from 'lucide-react'
import { authService } from '../services/authService.js'
import { requestService } from '../services/api/requestService.js'

function NavItem({ to, icon: Icon, children, end = false }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => `portal-nav-item ${isActive ? 'active' : ''}`}>
      <Icon size={18} strokeWidth={1.8} />
      <span>{children}</span>
    </NavLink>
  )
}

export default function PortalShell() {
  const sidebarRef = useRef(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarProfileOpen, setSidebarProfileOpen] = useState(false)
  const [topbarProfileOpen, setTopbarProfileOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser())
  const [openRequestsCount, setOpenRequestsCount] = useState(0)
  const [isVerifying, setIsVerifying] = useState(true)

  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  useEffect(() => {
    let mounted = true
    async function verifyAuth() {
      const token = authService.getToken()
      if (!token) {
        authService.clearSession()
        navigate('/login', { replace: true })
        return
      }

      try {
        const user = await authService.fetchMe()
        if (mounted) {
          if (user) {
            setCurrentUser(user)
          } else {
            authService.clearSession()
            navigate('/login', { replace: true })
            return
          }
        }
      } catch {
        if (mounted) {
          authService.clearSession()
          navigate('/login', { replace: true })
          return
        }
      } finally {
        if (mounted) setIsVerifying(false)
      }

      // Load real request count
      try {
        const data = await requestService.list('status=Open')
        if (mounted && data?.requests) {
          setOpenRequestsCount(data.requests.length)
        }
      } catch {
        // Silently preserve count
      }
    }

    verifyAuth()
    return () => { mounted = false }
  }, [navigate, location.pathname])

  useEffect(() => {
    const sidebar = sidebarRef.current
    if (!sidebar) return

    function onWheel(e) {
      e.stopPropagation()
      const { scrollTop, scrollHeight, clientHeight } = sidebar
      const canScroll = scrollHeight > clientHeight

      if (!canScroll) {
        e.preventDefault()
        return
      }

      const atTop = scrollTop <= 1 && e.deltaY < 0
      const atBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight - 1 && e.deltaY > 0

      if (atTop || atBottom) {
        e.preventDefault()
      }
    }

    sidebar.addEventListener('wheel', onWheel, { passive: false })
    return () => sidebar.removeEventListener('wheel', onWheel)
  }, [])

  function handleLogout() {
    authService.logout()
    navigate('/login', { replace: true })
  }

  if (isVerifying) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#64748b', fontFamily: 'inherit' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 14px' }} />
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>Verifying secure session…</p>
        </div>
      </div>
    )
  }

  const role = currentUser?.role || 'student'
  const displayName = currentUser?.fullName || 'User'
  const userInitials = displayName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || 'CA'
  const title = location.pathname.includes('/requests/new') ? 'New request'
    : location.pathname.includes('/requests/') ? 'Request details'
    : location.pathname.includes('/requests') ? 'My requests'
    : location.pathname.includes('/assistant') ? 'Campus assistant'
    : location.pathname.includes('/staff') ? 'Staff workspace'
    : location.pathname.includes('/admin/categories') ? 'Service categories'
    : location.pathname.includes('/admin/knowledge') ? 'Knowledge management'
    : location.pathname.includes('/profile') ? 'Profile & settings'
    : 'Overview'

  return (
    <div className="portal-layout">
      <aside ref={sidebarRef} className={`portal-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="portal-sidebar-head">
          <Link className="brand" to="/">
            <span className="brand-mark"><Building2 size={20} /></span>
            <span className="brand-name">campus<span>assist</span><i>.</i></span>
          </Link>
          <button className="icon-button sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation">
            <X size={20} />
          </button>
        </div>
        <div className="sidebar-workspace">
          <div className="workspace-icon">AU</div>
          <div>
            <strong>Anurag University</strong>
            <span>{role.toUpperCase()} WORKSPACE</span>
          </div>
          <ChevronDown size={15} />
        </div>

        <div className="sidebar-group-label">WORKSPACE</div>
        <nav className="portal-navigation">
          <NavItem to="/app/dashboard" icon={LayoutDashboard} end>Overview</NavItem>
          <NavItem to="/app/requests" icon={ClipboardList}>
            My requests
            {openRequestsCount > 0 && <span className="nav-count">{openRequestsCount}</span>}
          </NavItem>
          <NavItem to="/app/requests/new" icon={LifeBuoy}>New support request</NavItem>
          <NavItem to="/app/assistant" icon={Bot}>AI campus assistant <span className="nav-spark">✦</span></NavItem>
          {(role === 'staff' || role === 'admin') && (
            <NavItem to="/app/staff" icon={Users}>Staff desk</NavItem>
          )}
          {role === 'admin' && (
            <>
              <NavItem to="/app/admin/categories" icon={FolderKanban}>Categories</NavItem>
              <NavItem to="/app/admin/knowledge" icon={BookOpen}>Manage guides</NavItem>
            </>
          )}
        </nav>

        <div className="sidebar-group-label sidebar-group-spaced">CAMPUS RESOURCES</div>
        <nav className="portal-navigation">
          <NavItem to="/app/knowledge" icon={BookOpen}>Knowledge centre</NavItem>
          <NavItem to="/app/activity" icon={Activity}>Activity timeline</NavItem>
        </nav>

        <div className="sidebar-spacer" />
        <div className="sidebar-help-card">
          <div className="help-card-icon"><MessageCircle size={18} /></div>
          <strong>Need a hand?</strong>
          <p>Find quick answers or start a conversation.</p>
          <Link to="/app/assistant">Visit assistant <ArrowLeft size={14} className="arrow-right" /></Link>
        </div>

        <div className="sidebar-profile">
          <div className="avatar avatar-blue">{userInitials}</div>
          <div className="profile-id">
            <strong>{displayName}</strong>
            <span>{role.toUpperCase()} account</span>
          </div>
          <button aria-label="Open profile menu" className="icon-button profile-more" onClick={() => setSidebarProfileOpen(!sidebarProfileOpen)}>
            <Settings size={18} />
          </button>
          {sidebarProfileOpen && (
            <div className="profile-menu">
              <button onClick={() => { navigate('/app/profile'); setSidebarProfileOpen(false) }}>Profile & settings</button>
              <button onClick={handleLogout} style={{ color: '#ef4444' }}>Log out</button>
            </div>
          )}
        </div>
      </aside>

      {sidebarOpen && <button className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Close navigation overlay" />}

      <div className="portal-main">
        <header className="portal-topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-sidebar-toggle" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="breadcrumb">
              <span>CampusAssist</span>
              <span className="breadcrumb-slash">/</span>
              <strong>{title}</strong>
            </div>
          </div>
          <div className="topbar-actions">
            <button className="topbar-search" onClick={() => navigate('/app/requests')}>
              <Command size={15} />
              <span>Search requests</span>
              <kbd>⌘ K</kbd>
            </button>
            <div className="topbar-divider" />
            <button className="topbar-user" onClick={() => setTopbarProfileOpen(!topbarProfileOpen)}>
              <span className="avatar avatar-blue">{userInitials}</span>
              <span className="topbar-user-name">{displayName.split(' ')[0]}</span>
              <ChevronDown size={15} />
            </button>
            {topbarProfileOpen && (
              <div className="topbar-profile-flyout">
                <strong>{displayName}</strong>
                <small>{currentUser?.email}</small>
                <div style={{ padding: '8px 0', borderTop: '1px solid #f1f5f9', marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button className="button button-soft" style={{ width: '100%', justifyContent: 'flex-start', fontSize: 13 }} onClick={() => { setTopbarProfileOpen(false); navigate('/app/profile') }}>
                    <Settings size={14} /> Profile settings
                  </button>
                  <button className="button button-soft" style={{ width: '100%', justifyContent: 'flex-start', fontSize: 13, color: '#ef4444' }} onClick={handleLogout}>
                    <LogOut size={14} /> Log out
                  </button>
                </div>
              </div>
            )}
            <button className="exit-app" onClick={handleLogout} title="Sign out of CampusAssist" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <LogOut size={16} />
              <span>Sign out</span>
            </button>
          </div>
        </header>

        <main className="portal-content">
          <Outlet context={{ currentUser, setCurrentUser, role }} />
        </main>

        <footer className="portal-footer">
          <span>© 2026 CampusAssist · All campus rights reserved</span>
          <span><ShieldCheck size={13} /> Aiven MySQL & JWT Secured</span>
          <a href="mailto:support@anurag.edu.in">Help centre <HelpCircle size={13} /></a>
        </footer>
      </div>
    </div>
  )
}

