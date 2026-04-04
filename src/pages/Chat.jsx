import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Bot, User, Zap, RotateCcw, ChevronDown, Loader2 } from 'lucide-react'

// ─── Suggested starter questions ─────────────────────────────────────────────
const SUGGESTIONS = [
  "What's Shivaraj's tech stack?",
  'Tell me about his projects',
  'Is he open to new roles?',
  'What did he study?',
  'Show me his LeetCode stats',
  'How can I contact him?',
]

// ─── Markdown-lite renderer (bold, code, bullets) ────────────────────────────
function MessageText({ text }) {
  const lines = text.split('\n')
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />
        // Bullet
        if (line.match(/^[-•]\s/)) {
          return (
            <div key={i} className="flex gap-2 text-sm text-gray-300">
              <span className="text-accent mt-0.5 shrink-0">›</span>
              <span>{renderInline(line.replace(/^[-•]\s/, ''))}</span>
            </div>
          )
        }
        return <p key={i} className="text-sm text-gray-300 leading-relaxed">{renderInline(line)}</p>
      })}
    </div>
  )
}

function renderInline(text) {
  // Bold **text** and inline `code`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="text-accent bg-accent/10 px-1 rounded text-xs font-mono">{part.slice(1, -1)}</code>
    }
    return part
  })
}

// ─── Single message bubble ────────────────────────────────────────────────────
function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5
        ${isUser ? 'bg-accent/20 border border-accent/30' : 'bg-purple-900/40 border border-purple-700/40'}`}>
        {isUser
          ? <User className="w-3.5 h-3.5 text-accent" />
          : <Bot className="w-3.5 h-3.5 text-purple-400" />
        }
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
        isUser
          ? 'bg-accent/10 border border-accent/20 text-right'
          : 'bg-card border border-border'
      }`}>
        {isUser
          ? <p className="text-sm text-gray-300">{msg.content}</p>
          : <MessageText text={msg.content} />
        }

        {/* Model badge on AI messages */}
        {!isUser && msg.model && (
          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border">
            <Zap className="w-3 h-3 text-gray-600" />
            <span className="text-xs font-mono text-gray-600">{msg.model}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator({ model }) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-purple-900/40 border border-purple-700/40">
        <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
      </div>
      <div className="bg-card border border-border rounded-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-gray-600"
                style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
          {model && <span className="text-xs font-mono text-gray-600">{model}</span>}
        </div>
      </div>
    </div>
  )
}

// ─── Main Chat page ───────────────────────────────────────────────────────────
export default function Chat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm an AI that knows everything about Shivaraj. Ask me about his experience, projects, skills, or whether he's open to new opportunities.",
      model: null,
    },
  ])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [streamModel, setStreamModel] = useState(null)
  const [error, setError]       = useState(null)
  const [showScroll, setShowScroll] = useState(false)

  const bottomRef   = useRef(null)
  const inputRef    = useRef(null)
  const scrollRef   = useRef(null)

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Show scroll-to-bottom button when scrolled up
  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setShowScroll(el.scrollHeight - el.scrollTop - el.clientHeight > 100)
  }

  const sendMessage = useCallback(async (text) => {
    const content = (text || input).trim()
    if (!content || loading) return

    setInput('')
    setError(null)

    const userMsg = { role: 'user', content }
    const history = [...messages, userMsg]
    setMessages(history)
    setLoading(true)
    setStreamModel(null)

    // Build payload (exclude model metadata — API only needs role+content)
    const payload = history
      .filter(m => m.role !== 'system')
      .map(({ role, content }) => ({ role, content }))

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payload }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `HTTP ${res.status}`)
      }

      // Stream the response
      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''
      let usedModel     = null
      let buffer        = ''

      // Add empty assistant message to fill in
      setMessages(prev => [...prev, { role: 'assistant', content: '', model: null }])
      setLoading(false)

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (!data || data === '[DONE]') continue

          try {
            const json = JSON.parse(data)

            // First chunk contains model metadata
            if (json.model && !usedModel) {
              usedModel = json.model
              setStreamModel(usedModel)
              continue
            }

            const delta = json?.choices?.[0]?.delta?.content
            if (delta) {
              assistantText += delta
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: assistantText,
                  model: usedModel,
                }
                return updated
              })
            }
          } catch { /* skip malformed chunks */ }
        }
      }

      // Finalize model label on last message
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          model: usedModel,
        }
        return updated
      })
      setStreamModel(null)

    } catch (err) {
      setError(err.message)
      setLoading(false)
      setStreamModel(null)
    }

    inputRef.current?.focus()
  }, [input, messages, loading])

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: "Chat cleared! Ask me anything about Shivaraj.",
      model: null,
    }])
    setError(null)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] md:h-[calc(100vh-2.5rem)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Ask AI</h1>
          <p className="text-gray-500 text-sm">Knows everything about Shivaraj</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Model chain indicator */}
          <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-gray-600">
            <Zap className="w-3 h-3" />
            <span>Groq → Gemini → OpenAI</span>
          </div>
          <button onClick={clearChat} className="btn-ghost flex items-center gap-1.5 text-xs">
            <RotateCcw className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-4 pr-1 pb-2"
        style={{ scrollbarWidth: 'thin' }}
      >
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}
        {loading && <TypingIndicator model={streamModel} />}
        {error && (
          <div className="card border-red-900/50 bg-red-950/20 text-red-400 text-sm flex items-start gap-2">
            <span className="shrink-0 mt-0.5">⚠</span>
            <span>{error}</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScroll && (
        <button
          onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="absolute bottom-24 right-8 w-8 h-8 bg-card border border-border rounded-full
            flex items-center justify-center text-gray-500 hover:text-accent transition-colors shadow-lg"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      )}

      {/* Suggestions (show when only 1 message — the greeting) */}
      {messages.length === 1 && (
        <div className="shrink-0 mb-3">
          <p className="text-xs font-mono text-gray-600 mb-2">try asking</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-xs px-3 py-1.5 rounded-lg border border-border text-gray-500
                  hover:border-accent/40 hover:text-accent transition-all font-mono"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 flex gap-2 pt-3 border-t border-border">
        <input
          ref={inputRef}
          className="input-field flex-1"
          placeholder="Ask anything about Shivaraj…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          disabled={loading}
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="btn-primary flex items-center gap-2 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  )
}
