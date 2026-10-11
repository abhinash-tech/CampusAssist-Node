import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowUpRight, ChevronDown, Menu, X, GraduationCap } from 'lucide-react'

const solutions = [
  { title: 'Student requests', text: 'A clear path from question to resolution', href: '/app/requests' },
  { title: 'Campus knowledge', text: 'Answers, guides and useful resources', href: '/app/assistant' },
  { title: 'Staff workspace', text: 'Manage cases and support students', href: '/app/staff' },
]

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [solutionsOpen, setSolutionsOpen] = useState(false)
  const location = useLocation()
  const isPortal = location.pathname.startsWith('/app')

  return (
    <header className={`site-header ${isPortal ? 'site-header-portal' : ''}`}>
      <div className="header-inner">
        <Link to="/" className="brand" aria-label="CampusAssist home" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark"><GraduationCap size={21} strokeWidth={2.2} /></span>
          <span className="brand-name">campus<span>assist</span><i>.</i></span>
        </Link>
        <button className="mobile-menu-button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
        <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`}>
          <div className="nav-dropdown-wrap">
            <button className={`nav-link nav-dropdown-trigger ${solutionsOpen ? 'active' : ''}`} onClick={() => setSolutionsOpen(!solutionsOpen)} aria-expanded={solutionsOpen}>
              Platform <ChevronDown size={15} />
            </button>
            {solutionsOpen && <div className="nav-dropdown">
              {solutions.map((item) => <Link key={item.href} to={item.href} onClick={() => { setSolutionsOpen(false); setMenuOpen(false) }} className="nav-dropdown-item"><span>{item.title}</span><small>{item.text}</small><ArrowUpRight size={16} /></Link>)}
            </div>}
          </div>
          <a href="/#approach" className="nav-link" onClick={() => setMenuOpen(false)}>Our approach</a>
          <Link to="/app/assistant" className="nav-link" onClick={() => setMenuOpen(false)}>AI assistant <span className="nav-new">NEW</span></Link>
          <a href="/#resources" className="nav-link" onClick={() => setMenuOpen(false)}>Resources</a>
        </nav>
        <div className="header-actions">
          <Link to="/login" className="header-login">Sign in</Link>
          <Link to="/app/requests/new" className="button button-dark button-small">Get support <ArrowUpRight size={16} /></Link>
        </div>
      </div>
    </header>
  )
}
