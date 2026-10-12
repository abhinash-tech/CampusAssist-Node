import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, GraduationCap, LockKeyhole, Mail, ShieldCheck, AlertCircle } from 'lucide-react'
import SiteHeader from '../components/SiteHeader.jsx'
import SiteFooter from '../components/SiteFooter.jsx'
import { authService } from '../services/authService.js'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await authService.login(email, password)
      navigate('/app/dashboard')
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="auth-page">
        <div className="auth-page-art">
          <div className="auth-art-ring ring-one" />
          <div className="auth-art-ring ring-two" />
          <div className="auth-art-content">
            <span className="auth-art-icon"><GraduationCap size={24} /></span>
            <span className="eyebrow eyebrow-light"><span className="eyebrow-dot" /> YOUR CAMPUS, CONNECTED</span>
            <h2>Every next step<br />starts <em>somewhere.</em></h2>
            <p>One place to ask, track, discover and move forward.</p>
            <div className="auth-art-foot">
              <span>CA / 01</span>
              <span>STUDENT SERVICES REIMAGINED</span>
            </div>
          </div>
        </div>
        <div className="auth-form-side">
          <div className="auth-form-wrap">
            <Link to="/" className="auth-back"><ArrowLeft size={15} /> Back to CampusAssist</Link>
            <span className="auth-form-mark"><LockKeyhole size={20} /></span>
            <span className="eyebrow"><span className="eyebrow-dot" /> WELCOME BACK</span>
            <h1>Sign in to your workspace.</h1>
            <p>Continue to your campus support dashboard.</p>
            <form onSubmit={submit} className="auth-form">
              <label htmlFor="login-email">Email address</label>
              <div className="auth-input">
                <Mail size={17} />
                <input
                  id="login-email"
                  type="email"
                  required
                  placeholder="you@university.edu"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <label htmlFor="login-password">Password</label>
              <div className="auth-input">
                <LockKeyhole size={17} />
                <input
                  id="login-password"
                  type="password"
                  required
                  placeholder="Your account password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              {error && (
                <div className="field-error" style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '8px 0' }}>
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}
              <div className="auth-form-note">
                <span><ShieldCheck size={14} /> Server Verified JWT Authentication</span>
              </div>
              <button className="button button-blue button-full" type="submit" disabled={loading}>
                {loading ? 'Signing in…' : 'Continue to dashboard'} <ArrowRight size={16} />
              </button>
            </form>
            <div className="auth-switch">
              New to CampusAssist? <Link to="/register">Create an account <ArrowUpRight size={14} /></Link>
            </div>
            <div className="auth-safe-note">
              <ShieldCheck size={14} /> Verified against Aiven MySQL with bcrypt password encryption.
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}

export function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function submit(event) {
    event.preventDefault()
    if (form.name.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(form.email) || form.password.length < 6 || form.password !== form.confirm) {
      setError('Enter a name, valid email, password with at least 6 characters, and matching confirmation.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await authService.register({ fullName: form.name.trim(), email: form.email.trim(), password: form.password })
      navigate('/app/dashboard')
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="auth-page">
        <div className="auth-page-art register-art">
          <div className="auth-art-ring ring-one" />
          <div className="auth-art-ring ring-two" />
          <div className="auth-art-content">
            <span className="auth-art-icon"><ShieldCheck size={23} /></span>
            <span className="eyebrow eyebrow-light"><span className="eyebrow-dot" /> MADE FOR YOUR CAMPUS</span>
            <h2>Support that moves<br /><em>with you.</em></h2>
            <p>Find the right guide, reach the right team, and know what's next.</p>
            <div className="auth-art-foot">
              <span>CA / 02</span>
              <span>A SIMPLER WAY FORWARD</span>
            </div>
          </div>
        </div>
        <div className="auth-form-side">
          <div className="auth-form-wrap">
            <Link to="/" className="auth-back"><ArrowLeft size={15} /> Back to CampusAssist</Link>
            <span className="auth-form-mark"><GraduationCap size={21} /></span>
            <span className="eyebrow"><span className="eyebrow-dot" /> GET STARTED</span>
            <h1>Create your profile.</h1>
            <p>Set up your student workspace in a few steps.</p>
            <form onSubmit={submit} className="auth-form">
              <label htmlFor="register-name">Full name</label>
              <div className="auth-input">
                <GraduationCap size={17} />
                <input
                  id="register-name"
                  required
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="Your full name"
                />
              </div>
              <label htmlFor="register-email">Email address</label>
              <div className="auth-input">
                <Mail size={17} />
                <input
                  id="register-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder="you@university.edu"
                />
              </div>
              <label htmlFor="register-password">Create password</label>
              <div className="auth-input">
                <LockKeyhole size={17} />
                <input
                  id="register-password"
                  type="password"
                  required
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  placeholder="At least 6 characters"
                />
              </div>
              <label htmlFor="register-confirm">Confirm password</label>
              <div className="auth-input">
                <LockKeyhole size={17} />
                <input
                  id="register-confirm"
                  type="password"
                  required
                  value={form.confirm}
                  onChange={(event) => setForm({ ...form, confirm: event.target.value })}
                  placeholder="Repeat your password"
                />
              </div>
              {error && <small className="field-error">{error}</small>}
              <button className="button button-blue button-full" type="submit" disabled={loading}>
                {loading ? 'Creating account…' : 'Create profile'} <ArrowRight size={16} />
              </button>
            </form>
            <div className="auth-switch">
              Already have a profile? <Link to="/login">Sign in <ArrowUpRight size={14} /></Link>
            </div>
            <div className="auth-safe-note">
              <Check size={14} /> Registered in CampusAssist database with bcrypt password hashing.
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}


