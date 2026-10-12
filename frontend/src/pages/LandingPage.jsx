import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUpRight, Bot, Check, CircleHelp, Compass, GraduationCap, ShieldCheck, Sparkles, TicketCheck, UsersRound, Zap } from 'lucide-react'
import SiteHeader from '../components/SiteHeader.jsx'
import SiteFooter from '../components/SiteFooter.jsx'

const solutions = [
  { number: '01', eyebrow: 'STUDENT SERVICES', title: 'Every request. One clear path.', description: 'Submit a request, see what happens next, and stay informed from first response to resolution.', icon: TicketCheck, tint: 'solution-blue', link: '/app/requests' },
  { number: '02', eyebrow: 'CAMPUS KNOWLEDGE', title: 'The answers you need, closer.', description: 'Helpful campus guides and common answers in one place, available whenever you need them.', icon: Compass, tint: 'solution-orange', link: '/app/knowledge' },
  { number: '03', eyebrow: 'AI-POWERED SUPPORT', title: 'A smarter starting point.', description: 'Ask a question in natural language and get guided toward useful campus information.', icon: Sparkles, tint: 'solution-violet', link: '/app/assistant' },
]

const featureItems = [
  { icon: UsersRound, title: 'Built around students', text: 'Clear, accessible support that fits how students actually ask for help.' },
  { icon: ShieldCheck, title: 'Designed for transparency', text: 'Understand request status, ownership and what happens next.' },
  { icon: Zap, title: 'Less friction, more momentum', text: 'Bring support pathways and campus knowledge together in one experience.' },
]

export default function LandingPage() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  return <>
    <SiteHeader />
    <main className="public-site">
      <section className="hero-home">
        <div className="hero-glow hero-glow-one" /><div className="hero-glow hero-glow-two" />
        <div className="container hero-content">
          <div className="hero-copy">
            <span className="eyebrow eyebrow-light"><span className="eyebrow-dot" /> A CONNECTED CAMPUS EXPERIENCE</span>
            <h1>Great support.<br /><em>Greater</em> possibilities.</h1>
            <p>One thoughtful place for student services, campus knowledge, and the people who help you move forward.</p>
            <div className="hero-actions"><Link to="/app/dashboard" className="button button-light">Explore CampusAssist <ArrowUpRight size={17} /></Link><Link to="/app/assistant" className="button button-outline-light"><span className="play-pip"><Bot size={15} /></span> Meet your campus assistant</Link></div>
            <div className="hero-proof"><div className="proof-avatars"><span>AJ</span><span>RS</span><span>MK</span><span><UsersRound size={14} /></span></div><div><strong>One connected experience</strong><small>For students, staff and campus teams</small></div></div>
          </div>
          <div className="hero-visual">
            <div className="hero-image-frame"><img src="https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1100&q=85" alt="Modern university campus building" /><div className="image-overlay" /></div>
            <div className="hero-orbit orbit-a" /><div className="hero-orbit orbit-b" />
            <div className="floating-ticket"><div className="ticket-icon"><TicketCheck size={19} /></div><div><strong>Request updated</strong><span>Attendance review · CA-1048</span></div><span className="ticket-status">In progress</span></div>
            <div className="floating-ai"><div className="ai-spark"><Sparkles size={17} /></div><div><strong>Campus AI</strong><span>Here to help you find answers</span></div><span className="online-dot" /></div>
            <div className="hero-vertical-note">STUDENT SUPPORT, REIMAGINED <span /> 2026</div>
          </div>
          <a href="#discover" className="hero-scroll"><span className="scroll-icon"><ArrowDown size={16} /></span><span>Scroll to discover</span></a>
          <span className="hero-coordinate">17° 27' N&nbsp;&nbsp; 78° 22' E</span>
        </div>
      </section>

      <section className="intro-section section-pad" id="discover">
        <div className="container intro-grid">
          <div className="intro-image-wrap"><img className="intro-image" src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1000&q=85" alt="Students celebrating together on campus" /><div className="intro-image-caption"><span className="caption-mark"><GraduationCap size={18} /></span><div><strong>Student-first by design</strong><small>Support that feels connected</small></div><ArrowUpRight size={18} /></div><div className="image-index">01 <span /> 04</div></div>
          <div className="intro-copy"><span className="eyebrow"><span className="eyebrow-dot" /> A BETTER WAY TO GET HELP</span><h2>Innovation at the heart of <span>student support.</span></h2><p className="lead">Campus life moves fast. Getting help should feel simple.</p><p>CampusAssist brings requests, campus information and support teams into one considered experience — so students know where to start, and teams have a clearer way to respond.</p><Link to="/app/dashboard" className="text-link">Discover the platform <span><ArrowUpRight size={17} /></span></Link><div className="intro-mini-stats"><div><strong>01</strong><span>Connected<br />workspace</span></div><div><strong>24/7</strong><span>Access to campus<br />guidance</span></div><div><strong>AI+</strong><span>Support that<br />can grow smarter</span></div></div></div>
        </div>
      </section>

      <section className="solutions-section section-pad" id="solutions">
        <div className="container">
          <div className="section-heading-row"><div><span className="eyebrow"><span className="eyebrow-dot" /> SOLUTIONS & SERVICES</span><h2>One platform.<br /><span>Every next step.</span></h2></div><div className="section-heading-aside"><p>From the first question to the final update, make every support interaction feel a little more human.</p><Link to="/app/dashboard" className="text-link">See the experience <span><ArrowUpRight size={17} /></span></Link></div></div>
          <div className="solution-cards">{solutions.map((item) => { const Icon = item.icon; return <article className={`solution-card ${item.tint}`} key={item.number}><div className="solution-card-top"><span className="solution-number">{item.number} / 03</span><span className="solution-icon"><Icon size={21} /></span></div><div className="solution-graphic"><div className="graphic-ring ring-one"/><div className="graphic-ring ring-two"/><div className="graphic-core"><Icon size={29} /></div><span className="graphic-label label-one">{item.number === '01' ? 'REQUEST' : item.number === '02' ? 'DISCOVER' : 'ASK'}</span><span className="graphic-label label-two">CAMPUS / 2026</span></div><div className="solution-card-copy"><span className="eyebrow">{item.eyebrow}</span><h3>{item.title}</h3><p>{item.description}</p><Link to={item.link} className="circle-arrow" aria-label={`Explore ${item.title}`}><ArrowUpRight size={19} /></Link></div></article> })}</div>
        </div>
      </section>

      <section className="metrics-section">
        <div className="container metrics-inner"><div className="metrics-intro"><span className="eyebrow eyebrow-light"><span className="eyebrow-dot" /> THE IMPACT OF ONE</span><h2>A more connected<br />campus, by design.</h2><p>Bring together the people, information and services that help campus life run a little smoother.</p><Link to="/app/dashboard" className="button button-outline-light">Take a look around <ArrowUpRight size={16} /></Link></div><div className="metrics-grid"><div className="metric-cell"><span className="metric-symbol">↗</span><strong>01</strong><span>Shared support<br />destination</span></div><div className="metric-cell"><span className="metric-symbol">◎</span><strong>24/7</strong><span>Campus guidance<br />at your pace</span></div><div className="metric-cell"><span className="metric-symbol">✳</span><strong>3</strong><span>Connected user<br />workspaces</span></div><div className="metric-cell"><span className="metric-symbol">⌘</span><strong>∞</strong><span>Possibilities to<br />keep improving</span></div></div><div className="metrics-orbit" /></div>
      </section>

      <section className="approach-section section-pad" id="approach">
        <div className="container approach-grid"><div className="approach-copy"><span className="eyebrow"><span className="eyebrow-dot" /> THE CAMPUSASSIST DIFFERENCE</span><h2>Good technology should feel <span>like a helping hand.</span></h2><p>We believe student services work best when they are easy to find, simple to understand and designed around the person asking for help.</p><div className="approach-points">{featureItems.map(({ icon: Icon, title, text }) => <div className="approach-point" key={title}><div className="approach-point-icon"><Icon size={19} /></div><div><strong>{title}</strong><p>{text}</p></div><Check size={17} className="approach-check" /></div>)}</div><Link to="/app/assistant" className="text-link">Meet the campus assistant <span><ArrowUpRight size={17} /></span></Link></div><div className="approach-visual"><img src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1000&q=85" alt="A collaborative team working together" /><div className="approach-photo-tag"><span className="tag-pulse" /><div><strong>People before process.</strong><small>Support made more human.</small></div></div><div className="approach-orbit" /><div className="approach-side-label">A SHARED WAY FORWARD / CA—01</div></div></div>
      </section>

      <section className="knowledge-band" id="resources"><div className="container knowledge-band-inner"><div className="knowledge-orb"><span /><span /><span /><BookIcon /></div><div><span className="eyebrow eyebrow-light"><span className="eyebrow-dot" /> KNOWLEDGE, MADE ACCESSIBLE</span><h2>Find your answer.<br /><em>Find your way.</em></h2><p>Explore practical guides for the everyday questions that come with campus life — from academic records to digital access and student services.</p><Link to="/app/knowledge" className="button button-light">Explore the knowledge centre <ArrowUpRight size={16} /></Link></div><div className="knowledge-side-note">GOOD TO KNOW<br /><span>Anytime. Anywhere.</span></div></div></section>

      <section className="newsletter-section section-pad"><div className="container newsletter-card"><div className="newsletter-text"><span className="eyebrow"><span className="eyebrow-dot" /> KEEP IN THE LOOP</span><h2>A clearer campus<br /><span>starts here.</span></h2><p>Get occasional product updates and practical campus-service tips in your inbox.</p></div><form className="newsletter-form" onSubmit={(event) => { event.preventDefault(); if (email.trim()) setSubscribed(true) }}><label htmlFor="newsletter-email">Your email address</label><div className="newsletter-input"><input id="newsletter-email" type="email" required placeholder="you@university.edu" value={email} onChange={(event) => { setEmail(event.target.value); setSubscribed(false) }} /><button aria-label="Subscribe" type="submit"><ArrowUpRight size={21} /></button></div>{subscribed ? <p className="form-success"><Check size={15} /> Thanks for subscribing to CampusAssist updates.</p> : <small>No spam. No unnecessary noise. Unsubscribe anytime.</small>}</form><div className="newsletter-decoration"><span /><span /><span /></div></div></section>
    </main>
    <SiteFooter />
  </>
}

function BookIcon() { return <CircleHelp size={28} strokeWidth={1.4} /> }
