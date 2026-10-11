import { ArrowUpRight, GraduationCap, Mail, MapPin, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function SiteFooter() {
  return (
    <footer className="site-footer" id="contact">
      <div className="footer-top container">
        <div className="footer-brand-block">
          <Link to="/" className="brand brand-light"><span className="brand-mark"><GraduationCap size={21} /></span><span className="brand-name">campus<span>assist</span><i>.</i></span></Link>
          <h2>Every student deserves<br />a clearer way forward.</h2>
          <Link to="/app/requests/new" className="button button-light">Start a request <ArrowUpRight size={16} /></Link>
        </div>
        <div className="footer-column"><h4>Explore</h4><Link to="/app/dashboard">Student dashboard</Link><Link to="/app/requests">My requests</Link><Link to="/app/assistant">AI assistant</Link><a href="/#approach">Our approach</a></div>
        <div className="footer-column"><h4>For campus teams</h4><Link to="/app/staff">Staff workspace</Link><Link to="/app/admin/categories">Service categories</Link><Link to="/app/admin/knowledge">Knowledge centre</Link><a href="mailto:support@campusassist.demo">Contact support</a></div>
        <div className="footer-contact"><h4>Get in touch</h4><p><Mail size={17} /> support@campusassist.demo</p><p><Phone size={17} /> +91 00000 00000</p><p><MapPin size={17} /> Hyderabad, Telangana, India</p><span className="footer-note">Demo contact information · Replace before production</span></div>
      </div>
      <div className="footer-bottom container"><span>© 2026 CampusAssist. A student project experience.</span><div><a href="#privacy">Privacy</a><a href="#terms">Terms</a><span className="demo-pill"><span /> DEMO ENVIRONMENT</span></div></div>
    </footer>
  )
}
