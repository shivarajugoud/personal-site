// src/pages/Home.jsx
import { Link } from 'react-router-dom'
import { ArrowRight, Github, Linkedin, Mail, Send, Bot, Loader2, Zap } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'

const TYPING_STRINGS = ['Software Engineer', 'Open Source Contributor', 'Problem Solver', 'Full Stack Developer']

function TypedText() {
  const [idx, setIdx] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [deleting, setDeleting] = useState(false)
  useEffect(() => {
    const target = TYPING_STRINGS[idx]
    let timer
    if (!deleting && displayed.length < target.length) timer = setTimeout(() => setDisplayed(target.slice(0, displayed.length + 1)), 80)
    else if (!deleting && displayed.length === target.length) timer = setTimeout(() => setDeleting(true), 2000)
    else if (deleting && displayed.length > 0) timer = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 40)
    else { setDeleting(false); setIdx((idx + 1) % TYPING_STRINGS.length) }
    return () => clearTimeout(timer)
  }, [displayed, deleting, idx])
  return <span className="text-accent font-mono">{displayed}<span className="animate-blink">|</span></span>
}

const SUGGESTIONS = ["What's his tech stack?", 'Is he open to new roles?', 'Best project?']

function MiniChat() {
  const [messages, setMessages] = useState([{ role: 'assistant', content: "Hi! Ask me anything about Shivaraj 👋", model: null }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const msgCount = messages.filter(m => m.role === 'user').length
  const limitReached = msgCount >= 3

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  async function send(text) {
    const content = (text || input).trim()
    if (!content || loading || limitReached) return
    setInput('')
    const history = [...messages, { role: 'user', content }]
    setMessages(history)
    setLoading(true)
    try {
      const payload = history.filter(m => m.role !== 'system').map(({ role, content }) => ({ role, content }))
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: payload }) })
      const reader = res.body.getReader(); const decoder = new TextDecoder()
      let text = '', model = null, buffer = ''
      setMessages(prev => [...prev, { role: 'assistant', content: '', model: null }])
      setLoading(false)
      while (true) {
        const { done, value } = await reader.read(); if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n'); buffer = lines.pop()
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim(); if (!data || data === '[DONE]') continue
          try {
            const json = JSON.parse(data)
            if (json.model && !model) { model = json.model; continue }
            const delta = json?.choices?.[0]?.delta?.content
            if (delta) { text += delta; setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: 'assistant', content: text, model }; return u }) }
          } catch {}
        }
      }
    } catch { setLoading(false) }
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-purple-900/40 border border-purple-700/40 flex items-center justify-center">
          <Bot className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <span className="text-sm font-mono text-gray-400">ask ai about me</span>
        <span className="ml-auto text-xs font-mono text-gray-700">{3 - msgCount} questions left</span>
      </div>
      <div className="space-y-3 max-h-52 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`rounded-lg px-3 py-2 text-sm max-w-[85%] ${msg.role === 'user' ? 'bg-accent/10 border border-accent/20 text-gray-300' : 'bg-surface border border-border text-gray-300'}`}>
              {msg.content}
              {msg.model && <div className="flex items-center gap-1 mt-1 pt-1 border-t border-border"><Zap className="w-2.5 h-2.5 text-gray-700" /><span className="text-xs font-mono text-gray-700">{msg.model}</span></div>}
            </div>
          </div>
        ))}
        {loading && <div className="flex gap-2"><div className="bg-surface border border-border rounded-lg px-3 py-2"><Loader2 className="w-3.5 h-3.5 animate-spin text-gray-600" /></div></div>}
        <div ref={bottomRef} />
      </div>
      {messages.length === 1 && (
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => send(s)} className="text-xs px-2.5 py-1 rounded-lg border border-border text-gray-600 hover:border-accent/40 hover:text-accent transition-all font-mono">{s}</button>
          ))}
        </div>
      )}
      {limitReached ? (
        <div className="text-center space-y-2 pt-1">
          <p className="text-xs text-gray-600 font-mono">3 question preview reached</p>
          <Link to="/chat" className="btn-primary text-xs inline-flex items-center gap-1.5">Open full chat <ArrowRight className="w-3 h-3" /></Link>
        </div>
      ) : (
        <div className="flex gap-2">
          <input className="input-field flex-1 text-sm py-1.5" placeholder="Ask something..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} disabled={loading} />
          <button onClick={() => send()} disabled={loading || !input.trim()} className="btn-primary px-3 py-1.5 disabled:opacity-40"><Send className="w-3.5 h-3.5" /></button>
        </div>
      )}
    </div>
  )
}

const quickLinks = [
  { to: '/resume', label: 'Resume' },
  { to: '/projects', label: 'Projects' },
  { to: '/stats', label: 'Coding Stats' },
  { to: '/todo', label: 'Todo' },
]

export default function Home() {
  const { user, signOut } = useAuth()
  return (
    <div className="space-y-8 animate-fade-in pt-4">
      {user && (
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-gray-600">signed in as <span className="text-accent">{user.email}</span></span>
          <button onClick={signOut} className="text-gray-600 hover:text-red-400 transition-colors">sign out</button>
        </div>
      )}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-mono text-gray-500"><span className="glow-dot" /><span>Open to opportunities</span></div>
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white leading-tight">Hi, I'm <span className="text-accent">Shivaraj</span></h1>
          <p className="text-xl text-gray-400 mt-2 font-light"><TypedText /></p>
        </div>
        <p className="text-gray-400 max-w-xl leading-relaxed">I build robust, scalable software and love competitive programming. Based in Hyderabad, India.</p>
        <div className="flex items-center gap-3 pt-1">
          <a href="https://github.com/yourusername" target="_blank" rel="noreferrer" className="btn-ghost flex items-center gap-2"><Github className="w-4 h-4" />GitHub</a>
          <a href="https://linkedin.com/in/yourusername" target="_blank" rel="noreferrer" className="btn-ghost flex items-center gap-2"><Linkedin className="w-4 h-4" />LinkedIn</a>
          <a href="mailto:you@email.com" className="btn-primary flex items-center gap-2"><Mail className="w-4 h-4" />Contact</a>
        </div>
      </section>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-xs font-mono text-gray-600 uppercase tracking-widest">explore</p>
          <div className="grid grid-cols-2 gap-2">
            {quickLinks.map(({ to, label }) => (
              <Link key={to} to={to} className="card hover:border-accent/30 hover:bg-accent/5 transition-all duration-200 group py-3">
                <span className="text-sm text-gray-400 group-hover:text-accent transition-colors font-mono">{label}</span>
                <ArrowRight className="w-3 h-3 text-gray-700 group-hover:text-accent mt-1 transition-colors" />
              </Link>
            ))}
          </div>
          {!user && <Link to="/login" className="block text-center text-xs font-mono text-gray-600 hover:text-accent transition-colors pt-1">Sign in to access Todo →</Link>}
        </div>
        <MiniChat />
      </div>
      <section className="card space-y-3">
        <h2 className="font-display text-lg font-semibold text-white">About me</h2>
        <p className="text-gray-400 text-sm leading-relaxed">Edit <code className="text-accent font-mono bg-accent/10 px-1 rounded">src/pages/Home.jsx</code> to personalise this section.</p>
        <div className="flex flex-wrap gap-2 pt-1">
          {['React', 'Node.js', 'Python', 'TypeScript', 'PostgreSQL', 'Docker'].map(t => (<span key={t} className="badge-green">{t}</span>))}
        </div>
      </section>
    </div>
  )
}
