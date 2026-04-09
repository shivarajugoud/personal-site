// src/pages/Recruiter.jsx
import { useState, useRef, useEffect } from 'react'
import { Search, Bot, User, Send, Loader2, Zap, ChevronDown, Briefcase, Code2, MapPin, Star } from 'lucide-react'

// ─── Candidate registry ───────────────────────────────────────────────────────
// Add more candidates here — each gets their own AI context
const CANDIDATES = [
  {
    id: 'shivaraj',
    name: 'Shivaraj',
    role: 'Software Engineer',
    location: 'Hyderabad, India',
    tags: ['React', 'Node.js', 'Python', 'PostgreSQL'],
    available: true,
    summary: 'Full-stack engineer with 2+ years experience. Strong in backend systems and competitive programming.',
    context: `You are an AI assistant helping recruiters learn about Shivaraj, a software engineering candidate.
Answer questions about his skills, experience, and fit for roles professionally and concisely.
Only answer questions about Shivaraj or general role-fit topics.

━━━ CANDIDATE PROFILE ━━━
Name:       Shivaraj
Location:   Hyderabad, India
Email:      shivaraj@email.com
LinkedIn:   linkedin.com/in/shivaraj
GitHub:     github.com/shivaraj
Available:  Yes — open to full-time SDE roles

━━━ EXPERIENCE ━━━
Software Engineer @ Your Company (Jan 2024 — Present)
  • Built and shipped features improving system performance
  • Led microservices migration
  • Mentored junior engineers
  Stack: React, Node.js, PostgreSQL, AWS

SDE Intern @ Another Company (May–Aug 2023)
  • Built REST APIs serving 10k+ requests/day
  • Reduced CI build time by 30%
  Stack: Python, FastAPI, Redis

━━━ EDUCATION ━━━
B.Tech Computer Science — Your University (2020–2024), GPA 8.9/10

━━━ SKILLS ━━━
Languages: Python, JavaScript, TypeScript, C++, SQL
Frontend:  React, Vite, Tailwind, Next.js
Backend:   Node.js, FastAPI, Express, GraphQL
DB:        PostgreSQL, MySQL, Redis, MongoDB
DevOps:    Docker, GitHub Actions, AWS, Vercel

━━━ STRENGTHS ━━━
- Strong DSA fundamentals (competitive programming background)
- Full-stack capable with backend preference
- Fast learner, proven in intern → full-time progression
- Open source contributor

━━━ PREFERENCES ━━━
- Preferred: backend-heavy or full-stack product company roles
- Open to: remote, hybrid, or on-site (Hyderabad)
- Not preferred: pure frontend or service/consulting roles
- Salary: happy to discuss during interview process`,
  },
  // ── Add more candidates below ─────────────────────────────────────────────
  // {
  //   id: 'candidate2',
  //   name: 'Jane Doe',
  //   role: 'ML Engineer',
  //   location: 'Bangalore, India',
  //   tags: ['Python', 'TensorFlow', 'PyTorch'],
  //   available: true,
  //   summary: 'ML engineer specialising in NLP and LLM fine-tuning.',
  //   context: `...your context here...`,
  // },
]

const RECRUITER_SUGGESTIONS = [
  'What is their strongest skill?',
  'Are they open to remote work?',
  'What roles are they best suited for?',
  'Describe their backend experience',
  'What is their availability?',
]

// ─── Chat window for a single candidate ──────────────────────────────────────
function CandidateChat({ candidate }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm an AI assistant for **${candidate.name}**. Ask me anything about their skills, experience, or role fit.`,
      model: null,
    },
  ])
  const [input, setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef           = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  // Reset chat when candidate changes
  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: `Hi! I'm an AI assistant for **${candidate.name}**. Ask me anything about their skills, experience, or role fit.`,
      model: null,
    }])
  }, [candidate.id])

  async function send(text) {
    const content = (text || input).trim()
    if (!content || loading) return
    setInput('')

    const history = [...messages, { role: 'user', content }]
    setMessages(history)
    setLoading(true)

    try {
      const payload = history
        .filter(m => m.role !== 'system')
        .map(({ role, content }) => ({ role, content }))

      const res = await fetch('/api/recruiter-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payload, candidateId: candidate.id }),
      })

      if (!res.ok) throw new Error('API error')

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
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
            if (delta) {
              text += delta
              setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: 'assistant', content: text, model }; return u })
            }
          } catch {}
        }
      }
    } catch {
      setLoading(false)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.', model: null }])
    }
  }

  function renderText(text) {
    // Simple bold markdown support
    return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>
        : part
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-2" style={{ scrollbarWidth: 'thin' }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
              msg.role === 'user' ? 'bg-accent/20 border border-accent/30' : 'bg-purple-900/40 border border-purple-700/40'
            }`}>
              {msg.role === 'user'
                ? <User className="w-3 h-3 text-accent" />
                : <Bot className="w-3 h-3 text-purple-400" />
              }
            </div>
            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
              msg.role === 'user'
                ? 'bg-accent/10 border border-accent/20 text-gray-300'
                : 'bg-card border border-border text-gray-300'
            }`}>
              {renderText(msg.content)}
              {msg.model && (
                <div className="flex items-center gap-1 mt-1 pt-1 border-t border-border">
                  <Zap className="w-2.5 h-2.5 text-gray-700" />
                  <span className="text-xs font-mono text-gray-700">{msg.model}</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-md bg-purple-900/40 border border-purple-700/40 flex items-center justify-center">
              <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />
            </div>
            <div className="bg-card border border-border rounded-xl px-3 py-2">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-600"
                    style={{ animation: `bounce 1.2s ease-in-out ${i*0.2}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {RECRUITER_SUGGESTIONS.map(s => (
            <button key={s} onClick={() => send(s)}
              className="text-xs px-2.5 py-1 rounded-lg border border-border text-gray-600
                hover:border-accent/40 hover:text-accent transition-all font-mono">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 pt-3 border-t border-border shrink-0">
        <input
          className="input-field flex-1 text-sm"
          placeholder={`Ask about ${candidate.name}...`}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          disabled={loading}
        />
        <button onClick={() => send()} disabled={loading || !input.trim()}
          className="btn-primary flex items-center gap-1.5 shrink-0 disabled:opacity-40">
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-sm">Send</span>
        </button>
      </div>

      <style>{`@keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-4px)} }`}</style>
    </div>
  )
}

// ─── Candidate card ───────────────────────────────────────────────────────────
function CandidateCard({ candidate, selected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(candidate)}
      className={`w-full text-left card transition-all duration-200 hover:border-accent/30 ${
        selected ? 'border-accent/50 bg-accent/5' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-white text-sm">{candidate.name}</h3>
          <p className="text-xs text-accent font-mono">{candidate.role}</p>
        </div>
        {candidate.available && (
          <span className="flex items-center gap-1 text-xs font-mono text-emerald-400 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" style={{ boxShadow: '0 0 6px #34d399' }} />
            available
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 mb-2 leading-relaxed">{candidate.summary}</p>
      <div className="flex items-center gap-1 mb-2">
        <MapPin className="w-3 h-3 text-gray-600" />
        <span className="text-xs text-gray-600">{candidate.location}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {candidate.tags.map(t => <span key={t} className="badge-blue">{t}</span>)}
      </div>
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Recruiter() {
  const [selected, setSelected] = useState(CANDIDATES[0])
  const [search, setSearch]     = useState('')

  const filtered = CANDIDATES.filter(c =>
    search === '' ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.role.toLowerCase().includes(search.toLowerCase()) ||
    c.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Briefcase className="w-4 h-4 text-accent" />
          <h1 className="font-display text-2xl font-bold text-white">Recruiter Portal</h1>
        </div>
        <p className="text-gray-500 text-sm">
          Search and chat with AI assistants for each candidate. Find the right fit for your role.
        </p>
      </div>

      <div className="grid md:grid-cols-[280px_1fr] gap-5 h-[calc(100vh-14rem)]">
        {/* Sidebar — candidate list */}
        <div className="flex flex-col gap-3 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input
              className="input-field pl-9 text-sm"
              placeholder="Search by name, role, skill..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <p className="text-xs font-mono text-gray-600">
            {filtered.length} candidate{filtered.length !== 1 ? 's' : ''}
            {search && ` matching "${search}"`}
          </p>

          {filtered.map(c => (
            <CandidateCard
              key={c.id}
              candidate={c}
              selected={selected?.id === c.id}
              onSelect={setSelected}
            />
          ))}

          {filtered.length === 0 && (
            <p className="text-gray-600 text-sm font-mono text-center py-4">
              no candidates found
            </p>
          )}
        </div>

        {/* Main — chat panel */}
        {selected ? (
          <div className="card flex flex-col overflow-hidden">
            {/* Chat header */}
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-border shrink-0">
              <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                <Code2 className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-white text-sm">{selected.name}</h2>
                <p className="text-xs text-gray-500 font-mono">{selected.role} · {selected.location}</p>
              </div>
              {selected.available && (
                <span className="badge-green flex items-center gap-1">
                  <Star className="w-3 h-3" /> available
                </span>
              )}
            </div>
            <CandidateChat candidate={selected} />
          </div>
        ) : (
          <div className="card flex items-center justify-center text-gray-600 text-sm font-mono">
            select a candidate to start chatting
          </div>
        )}
      </div>
    </div>
  )
}
