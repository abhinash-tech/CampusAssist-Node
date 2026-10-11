import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, CircleHelp, FileText, Info, Paperclip, Send, ShieldCheck, X, Sparkles, BrainCircuit, WandSparkles } from 'lucide-react'
import { mockStore } from '../services/mockStore.js'
import { classifyRequestDraft, improveRequestDraft, isAIApiMode } from '../services/aiService.js'

export default function RequestFormPage() {
  const navigate = useNavigate()
  const categories = mockStore.getCategories()
  const [form, setForm] = useState({ title: '', category: 'academic', priority: 'Medium', description: '', email: 'abhinashjangapally@gmail.com', attachment: '' })
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [aiBusy, setAiBusy] = useState('')
  const [aiNotice, setAiNotice] = useState('')
  const [improvementSuggestion, setImprovementSuggestion] = useState(null)
  const [classificationSuggestion, setClassificationSuggestion] = useState(null)

  async function runImprove() {
    if (form.description.trim().length < 3) { setAiNotice('Add a short description first, then ask the assistant to improve it.'); return }
    setAiBusy('improve'); setAiNotice('Analyzing and improving your draft…')
    try {
      const result = await improveRequestDraft({ title: form.title, description: form.description })
      setImprovementSuggestion({
        originalTitle: form.title,
        originalDescription: form.description,
        suggestedTitle: result.title || form.title,
        suggestedDescription: result.description || form.description,
        keyChanges: result.keyChanges || (result.changesMade ? [result.changesMade] : ['Clarified context and added structured details']),
        mode: result.mode
      })
      setAiNotice('AI suggestion ready. Review the comparison below before deciding to accept.')
    } catch (error) { setAiNotice(error.message || 'Could not reach the AI API. Check your settings and try again.') }
    finally { setAiBusy('') }
  }

  function acceptImprovement() {
    if (!improvementSuggestion) return
    setForm((previous) => ({
      ...previous,
      title: improvementSuggestion.suggestedTitle,
      description: improvementSuggestion.suggestedDescription
    }))
    setImprovementSuggestion(null)
    setAiNotice('Accepted suggestion! You can still make edits before submitting.')
  }

  function keepOriginal() {
    setImprovementSuggestion(null)
    setAiNotice('Kept your original draft.')
  }

  async function runClassify() {
    if (form.title.trim().length < 3 || form.description.trim().length < 5) { setAiNotice('Add a title and a little more detail before requesting suggestions.'); return }
    setAiBusy('classify'); setAiNotice('Reviewing the request…')
    try {
      const result = await classifyRequestDraft({ title: form.title, description: form.description })
      setClassificationSuggestion(result)
      setAiNotice(`AI Recommendation: ${result.category} · ${result.priority} priority. Review below to apply or dismiss.`)
    } catch (error) { setAiNotice(error.message || 'Could not reach the AI API. Check your settings and try again.') }
    finally { setAiBusy('') }
  }

  function applyClassification() {
    if (!classificationSuggestion) return
    setForm((previous) => ({
      ...previous,
      category: classificationSuggestion.category || previous.category,
      priority: classificationSuggestion.priority || previous.priority
    }))
    setClassificationSuggestion(null)
    setAiNotice('Applied category and priority recommendations.')
  }

  function update(key, value) { setForm((previous) => ({ ...previous, [key]: value })); setErrors((previous) => ({ ...previous, [key]: '' })) }
  async function submit(event) {
    event.preventDefault()
    const nextErrors = {}
    if (form.title.trim().length < 5) nextErrors.title = 'Add a descriptive title of at least 5 characters.'
    if (!form.category) nextErrors.category = 'Choose the category that best fits your request.'
    if (form.description.trim().length < 15) nextErrors.description = 'Please share a little more detail (at least 15 characters).'
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = 'Enter a valid email address.'
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return }

    // Mock store + offline resilience
    const request = mockStore.createRequest({ title: form.title.trim(), category: form.category, priority: form.priority, description: form.description.trim() })
    setSubmitted(true)
    setTimeout(() => navigate(`/app/requests/${request.id}`), 900)
  }
  return <div className="page-stack request-form-page">
    <Link to="/app/requests" className="back-link"><ArrowLeft size={15} /> Back to requests</Link>
    <div className="page-welcome compact-welcome"><div><span className="eyebrow"><span className="eyebrow-dot" /> STUDENT SERVICES / NEW REQUEST</span><h1>Let's get you the right support.</h1><p>Tell us a little about what you need. We'll help you find the right next step.</p></div><div className="form-step-indicator"><span>01</span><i /><span>DETAILS</span></div></div>
    <div className="request-form-layout"><form className="panel request-form-panel" onSubmit={submit} noValidate>
      {submitted && <div className="submit-success"><span><Check size={17} /></span><div><strong>Your request is ready.</strong><small>Saved in workspace. Opening request details…</small></div></div>}
      <div className="form-panel-heading"><div className="form-heading-icon"><FileText size={20} /></div><div><h2>Request details</h2><p>Fields marked with <b>*</b> are required.</p></div><span className="form-step-label">STEP 1 OF 1</span></div>
      <div className="form-field"><label htmlFor="request-title">What do you need help with? <b>*</b></label><input id="request-title" value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="e.g. Attendance record correction" maxLength={120} aria-invalid={Boolean(errors.title)} />{errors.title && <small className="field-error">{errors.title}</small>}<small className="field-hint">Use a short title that describes the issue.</small></div>
      <div className="form-row-fields"><div className="form-field"><label htmlFor="request-category">Choose a category <b>*</b></label><select id="request-category" value={form.category} onChange={(event) => update('category', event.target.value)}>{categories.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select>{errors.category && <small className="field-error">{errors.category}</small>}</div><div className="form-field"><label htmlFor="request-priority">Priority</label><select id="request-priority" value={form.priority} onChange={(event) => update('priority', event.target.value)}><option>Low</option><option>Medium</option><option>High</option></select><small className="field-hint">Choose high only when time-sensitive.</small></div></div>

      {classificationSuggestion && (
        <div className="ai-classify-card">
          <div className="ai-classify-row">
            <div className="ai-classify-pills">
              <span className="ai-classify-pill"><BrainCircuit size={13} /> Suggested Category: {classificationSuggestion.category}</span>
              <span className="ai-classify-pill">Priority: {classificationSuggestion.priority}</span>
            </div>
            <div className="ai-diff-actions" style={{ padding: 0, background: 'transparent', border: 'none' }}>
              <button type="button" className="button button-soft" style={{ minHeight: '32px', fontSize: '13px' }} onClick={applyClassification}><Check size={13} /> Apply suggestion</button>
              <button type="button" className="button button-ghost" style={{ minHeight: '32px', fontSize: '13px' }} onClick={() => setClassificationSuggestion(null)}><X size={13} /> Dismiss</button>
            </div>
          </div>
          {classificationSuggestion.reasoning && <p className="ai-classify-reason"><strong>Reasoning:</strong> {classificationSuggestion.reasoning}</p>}
        </div>
      )}

      <div className="form-field"><label htmlFor="request-description">Describe what happened <b>*</b></label><textarea id="request-description" rows={6} value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Share any details that will help the team understand your request…" aria-invalid={Boolean(errors.description)} />{errors.description && <small className="field-error">{errors.description}</small>}<div className="textarea-footer"><small className="field-hint">Avoid sharing passwords or sensitive personal information.</small><span>{form.description.length}/2000</span></div></div>

      <div className="ai-writing-tools">
        <div className="ai-writing-intro"><span><Sparkles size={17} /></span><div><strong>AI request assistant</strong><small>{isAIApiMode ? 'Server-side AI mode · Powered by Gemini API' : 'Demo mode · sample suggestions, no live model call'}</small></div></div>
        <div className="ai-writing-actions"><button type="button" className="button button-soft" onClick={runImprove} disabled={Boolean(aiBusy)}><WandSparkles size={15} /> {aiBusy === 'improve' ? 'Improving…' : 'Improve draft'}</button><button type="button" className="button button-soft" onClick={runClassify} disabled={Boolean(aiBusy)}><BrainCircuit size={15} /> {aiBusy === 'classify' ? 'Classifying…' : 'Suggest category & priority'}</button></div>
        {aiNotice && <p className="ai-writing-notice" role="status">{aiNotice}</p>}

        {improvementSuggestion && (
          <div className="ai-diff-container">
            <div className="ai-diff-header">
              <div className="ai-diff-header-left">
                <WandSparkles size={16} />
                <span>AI Draft Comparison</span>
              </div>
              <span className="ai-diff-badge">{improvementSuggestion.mode === 'gemini' ? 'Gemini 2.5' : 'Demo Suggestion'}</span>
            </div>
            <div className="ai-diff-grid">
              <div className="ai-diff-card original">
                <span className="ai-diff-card-label">Current Draft</span>
                <div className="ai-diff-title">{improvementSuggestion.originalTitle || '(No title)'}</div>
                <div className="ai-diff-body">{improvementSuggestion.originalDescription || '(No description)'}</div>
              </div>
              <div className="ai-diff-card suggested">
                <span className="ai-diff-card-label">AI Improved Suggestion</span>
                <div className="ai-diff-title">{improvementSuggestion.suggestedTitle}</div>
                <div className="ai-diff-body">{improvementSuggestion.suggestedDescription}</div>
              </div>
            </div>
            {improvementSuggestion.keyChanges && improvementSuggestion.keyChanges.length > 0 && (
              <div className="ai-diff-changes">
                <strong>Key Improvements:</strong>
                <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                  {improvementSuggestion.keyChanges.map((change, i) => (
                    <li key={i}>{change}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="ai-diff-actions">
              <button type="button" className="button button-blue" onClick={acceptImprovement}><Check size={14} /> Accept suggestion</button>
              <button type="button" className="button button-soft" onClick={keepOriginal}><X size={14} /> Keep original</button>
            </div>
          </div>
        )}
      </div>

      <div className="form-field"><label htmlFor="request-email">Contact email</label><input id="request-email" type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="you@university.edu" aria-invalid={Boolean(errors.email)} />{errors.email && <small className="field-error">{errors.email}</small>}<small className="field-hint">Used for request status notifications.</small></div>
      <div className="form-field"><label>Supporting attachment <span className="optional-label">OPTIONAL</span></label><button type="button" className="attachment-dropzone" onClick={() => update('attachment', form.attachment ? '' : 'attachment-placeholder.pdf')}><span className="attachment-icon"><Paperclip size={18} /></span><span><strong>{form.attachment ? form.attachment : 'Add a supporting file'}</strong><small>{form.attachment ? 'Dummy attachment selected · Click to remove' : 'Demo interface only · File upload is not connected'}</small></span>{form.attachment ? <X size={17} /> : <ArrowUpRightIcon />}</button></div>
      <div className="form-disclaimer"><ShieldCheck size={17} /><span>Your request is submitted securely and routed to the corresponding department.</span></div>
      <div className="form-actions"><Link to="/app/requests" className="button button-soft">Cancel</Link><button type="submit" className="button button-blue" disabled={submitted}>Submit request <Send size={15} /></button></div>
    </form>
    <aside className="request-form-aside"><div className="aside-help-card"><span className="aside-kicker"><CircleHelp size={15} /> NEED A QUICK ANSWER?</span><div className="aside-ai-art"><div className="aside-ai-ring ring-one"/><div className="aside-ai-ring ring-two"/><div className="aside-ai-core">✳</div></div><h3>Not sure where to start?</h3><p>Try the campus assistant first. It can point you to relevant guides before you submit a request.</p><Link to="/app/assistant" className="text-link">Ask a question <ArrowRight size={15} /></Link></div><div className="aside-process-card"><h4>What happens next?</h4><div className="process-step"><span>1</span><div><strong>We record your request</strong><small>You'll see it in your requests list.</small></div></div><div className="process-step"><span>2</span><div><strong>The right team reviews it</strong><small>Your ticket gets routed by category.</small></div></div><div className="process-step"><span>3</span><div><strong>You track progress</strong><small>Check status and activity in one place.</small></div></div><small className="aside-demo-note"><Info size={12} /> Demonstration flow, not a live service.</small></div></aside></div>
  </div>
}
function ArrowUpRightIcon() { return <span className="attachment-up-icon">↗</span> }
