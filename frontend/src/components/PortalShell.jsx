import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Activity, ArrowLeft, Bell, BookOpen, Bot, Building2, ChevronDown, ClipboardList, Command, HelpCircle, LayoutDashboard, LifeBuoy, LogOut, Menu, MessageCircle, Settings, ShieldCheck, X } from 'lucide-react'
import { mockStore } from '../services/mockStore.js'

function NavItem({ to, icon: Icon, children, end = false }) {
  return <NavLink to={to} end={end} className={({ isActive }) => `portal-nav-item ${isActive ? 'active' : ''}`}><Icon size={18} strokeWidth={1.8} /><span>{children}</span></NavLink>
}

export default function PortalShell() {
  const sidebarRef = useRef(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [sidebarProfileOpen, setSidebarProfileOpen] = useState(false)
  const [topbarProfileOpen, setTopbarProfileOpen] = useState(false)
  const [role, setRole] = useState(localStorage.getItem('campusassist-role') || 'Student')
  const location = useLocation()
  const navigate = useNavigate()
  const title = location.pathname.includes('/requests/new') ? 'New request' : location.pathname.includes('/requests/') ? 'Request details' : location.pathname.includes('/requests') ? 'My requests' : location.pathname.includes('/assistant') ? 'Campus assistant' : location.pathname.includes('/staff') ? 'Staff workspace' : location.pathname.includes('/admin') ? 'Administration' : location.pathname.includes('/profile') ? 'Profile & settings' : 'Overview'

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

  function changeRole(next) {
    setRole(next)
    localStorage.setItem('campusassist-role', next)
    const paths = { Student: '/app/dashboard', Staff: '/app/staff', Admin: '/app/admin/categories' }
    navigate(paths[next])
    setSidebarProfileOpen(false)
    setTopbarProfileOpen(false)
  }
  function resetDemo() {
    mockStore.reset()
    window.location.reload()
  }

  return <div className="portal-layout">
    <aside ref={sidebarRef} className={`portal-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="portal-sidebar-head"><Link className="brand" to="/"><span className="brand-mark"><Building2 size={20} /></span><span className="brand-name">campus<span>assist</span><i>.</i></span></Link><button className="icon-button sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X size={20} /></button></div>
      <div className="sidebar-workspace"><div className="workspace-icon">AU</div><div><strong>Anurag University</strong><span>Student services</span></div><ChevronDown size={15} /></div>
      <div className="sidebar-group-label">WORKSPACE</div>
      <nav className="portal-navigation">
        <NavItem to="/app/dashboard" icon={LayoutDashboard} end>Overview</NavItem>
        <NavItem to="/app/requests" icon={ClipboardList}>My requests <span className="nav-count">{mockStore.getRequests().filter((r) => r.owner === 'Abhinash Jangapally' && r.status !== 'Resolved').length}</span></NavItem>
        <NavItem to="/app/requests/new" icon={LifeBuoy}>New support request</NavItem>
        <NavItem to="/app/assistant" icon={Bot}>AI campus assistant <span className="nav-spark">✦</span></NavItem>
      </nav>
      <div className="sidebar-group-label sidebar-group-spaced">CAMPUS RESOURCES</div>
      <nav className="portal-navigation">
        <NavItem to="/app/knowledge" icon={BookOpen}>Knowledge centre</NavItem>
        <NavItem to="/app/activity" icon={Activity}>Activity timeline</NavItem>
      </nav>
      <div className="sidebar-spacer" />
      <div className="sidebar-help-card"><div className="help-card-icon"><MessageCircle size={18} /></div><strong>Need a hand?</strong><p>Find quick answers or start a conversation.</p><Link to="/app/assistant">Visit assistant <ArrowLeft size={14} className="arrow-right" /></Link></div>
      <div className="sidebar-profile"><div className="avatar avatar-blue">AJ</div><div className="profile-id"><strong>Abhinash Jangapally</strong><span>{role} workspace</span></div><button aria-label="Open profile menu" className="icon-button profile-more" onClick={() => setSidebarProfileOpen(!sidebarProfileOpen)}><Settings size={18} /></button>
        {sidebarProfileOpen && <div className="profile-menu"><span className="menu-label">Switch demo role</span>{['Student', 'Staff', 'Admin'].map((item) => <button key={item} className={role === item ? 'selected' : ''} onClick={() => changeRole(item)}>{item}{role === item && <span>✓</span>}</button>)}<button onClick={() => { navigate('/app/profile'); setSidebarProfileOpen(false) }}>Profile & settings</button><button onClick={resetDemo}>Reset demo data</button></div>}
      </div>
    </aside>
    {sidebarOpen && <button className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Close navigation overlay" />}
    <div className="portal-main">
      <header className="portal-topbar">
        <div className="topbar-left"><button className="icon-button mobile-sidebar-toggle" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button><div className="breadcrumb"><span>CampusAssist</span><span className="breadcrumb-slash">/</span><strong>{title}</strong></div><span className="demo-badge"><span /> Demo mode</span></div>
        <div className="topbar-actions"><button className="topbar-search" onClick={() => navigate('/app/requests')}><Command size={15} /><span>Search requests</span><kbd>⌘ K</kbd></button><div className="notification-wrap"><button className={`icon-button notification-button ${notificationsOpen ? 'active' : ''}`} aria-label="Notifications" onClick={() => setNotificationsOpen(!notificationsOpen)}><Bell size={19} /><i /></button>{notificationsOpen && <div className="notification-popover"><div className="popover-head"><strong>Notifications</strong><span>2 new</span></div><div className="notice-item"><span className="notice-dot blue" /><div><strong>Request update</strong><p>CA-1048 is now in progress.</p><small>Today · 10:24 AM</small></div></div><div className="notice-item"><span className="notice-dot orange" /><div><strong>Campus guide updated</strong><p>Certificate guide has new information.</p><small>Yesterday</small></div></div><button className="popover-link" onClick={() => { setNotificationsOpen(false); navigate('/app/activity') }}>View activity</button></div>}</div><div className="topbar-divider" /><button className="topbar-user" onClick={() => setTopbarProfileOpen(!topbarProfileOpen)}><span className="avatar avatar-blue">AJ</span><span className="topbar-user-name">Abhinash</span><ChevronDown size={15} /></button><Link className="exit-app" to="/"><LogOut size={16} /><span>Exit</span></Link></div>
      </header>
      {topbarProfileOpen && <div className="topbar-profile-flyout"><strong>Abhinash Jangapally</strong><small>24EG105Q40 · CSE</small><div className="role-switcher"><span>Demo role</span>{['Student','Staff','Admin'].map((item) => <button key={item} className={role === item ? 'selected' : ''} onClick={() => changeRole(item)}>{item}</button>)}</div><button className="reset-demo-button" onClick={resetDemo}>Reset demo data</button></div>}
      <main className="portal-content"><Outlet context={{ role, setRole }} /></main>
      <footer className="portal-footer"><span>© 2026 CampusAssist</span><span><ShieldCheck size={13} /> Demo data only · Not connected to a college system</span><a href="mailto:support@campusassist.demo">Help centre <HelpCircle size={13} /></a></footer>
    </div>
  </div>
}
