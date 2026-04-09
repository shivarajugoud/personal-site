// api/recruiter-chat.js — Vercel Edge Function
// Same Groq → Gemini → OpenAI fallback chain as /api/chat
// but uses candidate-specific context from the candidate registry

import { shouldCompress, compressHistory, buildMessagesWithSummary } from './compress.js'

// ── Candidate contexts (keep in sync with src/pages/Recruiter.jsx) ────────────
const CANDIDATE_CONTEXTS = {
  shivaraj: `You are an AI assistant helping recruiters evaluate Shivaraj as a candidate.
Be professional, concise, and factual. Only answer questions about Shivaraj or role-fit topics.
Do not discuss salary numbers — say he prefers to discuss during interviews.

━━━ CANDIDATE PROFILE ━━━
Name:       Shivaraj
Location:   Hyderabad, India
Email:      shivaraj@email.com
LinkedIn:   linkedin.com/in/shivaraj
Available:  Yes — open to full-time SDE roles

━━━ EXPERIENCE ━━━
Software Engineer @ Your Company (Jan 2024 — Present)
  • Built features improving system performance
  • Led microservices migration
  • Mentored junior engineers
  Stack: React, Node.js, PostgreSQL, AWS

SDE Intern @ Another Company (May–Aug 2023)
  • REST APIs serving 10k+ requests/day
  • Reduced CI build time by 30%
  Stack: Python, FastAPI, Redis

━━━ EDUCATION ━━━
B.Tech CS — Your University (2020–2024), GPA 8.9/10

━━━ SKILLS ━━━
Python, JavaScript, TypeScript, C++, SQL
React, Node.js, FastAPI, PostgreSQL, Redis, Docker, AWS

━━━ PREFERENCES ━━━
Open to: full-stack or backend-heavy product company roles
Location: remote, hybrid, or Hyderabad on-site
Not preferred: pure frontend or consulting roles`,

  // Add more candidates here matching the ids in Recruiter.jsx
  // candidate2: `...context for candidate 2...`,
}

function isRateLimitError(s) { return s === 429 || s === 503 || s === 529 }

async function callGroq(messages, apiKey) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, stream: true, max_tokens: 1024, temperature: 0.7 }),
  })
  if (!res.ok) { const e = new Error((await res.json().catch(()=>({}))).error?.message || 'Groq error'); e.status = res.status; throw e }
  return { stream: res.body, model: 'Groq · llama-3.3-70b' }
}

async function callGemini(messages, apiKey) {
  const systemMsg = messages.filter(m => m.role === 'system').map(m => m.content).join('\n\n')
  const chatMsgs  = messages.filter(m => m.role !== 'system')
  const contents  = chatMsgs.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system_instruction: { parts: [{ text: systemMsg }] }, contents, generationConfig: { maxOutputTokens: 1024, temperature: 0.7 } }),
  })
  if (!res.ok) { const e = new Error((await res.json().catch(()=>({}))).error?.message || 'Gemini error'); e.status = res.status; throw e }
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter(); const encoder = new TextEncoder(); const decoder = new TextDecoder()
  ;(async () => {
    try {
      const reader = res.body.getReader(); let buffer = ''
      while (true) {
        const { done, value } = await reader.read(); if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n'); buffer = lines.pop()
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim(); if (!data || data === '[DONE]') continue
          try { const json = JSON.parse(data); const text = json?.candidates?.[0]?.content?.parts?.[0]?.text; if (text) await writer.write(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`)) } catch {}
        }
      }
      await writer.write(encoder.encode('data: [DONE]\n\n'))
    } finally { writer.close() }
  })()
  return { stream: readable, model: 'Gemini · 1.5-flash' }
}

async function callOpenAI(messages, apiKey) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages, stream: true, max_tokens: 1024, temperature: 0.7 }),
  })
  if (!res.ok) { const e = new Error((await res.json().catch(()=>({}))).error?.message || 'OpenAI error'); e.status = res.status; throw e }
  return { stream: res.body, model: 'OpenAI · gpt-4o-mini' }
}

export const config = { runtime: 'edge' }

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  let body
  try { body = await req.json() } catch { return new Response('Invalid JSON', { status: 400 }) }

  const { messages = [], candidateId } = body

  const context = CANDIDATE_CONTEXTS[candidateId]
  if (!context) return new Response(JSON.stringify({ error: `Unknown candidate: ${candidateId}` }), { status: 400, headers: { 'Content-Type': 'application/json' } })

  // Context compression
  let summary = null, chatMessages = messages
  if (shouldCompress(messages)) {
    const result  = await compressHistory(messages, process.env.GROQ_API_KEY)
    summary       = result.summary
    chatMessages  = result.recentMessages
  }

  const fullMessages = buildMessagesWithSummary(context, summary, chatMessages)

  const chain = [
    { call: callGroq,   key: process.env.GROQ_API_KEY,  label: 'Groq · llama-3.3-70b' },
    { call: callGemini, key: process.env.GEMINI_API_KEY, label: 'Gemini · 1.5-flash' },
    { call: callOpenAI, key: process.env.OPENAI_API_KEY, label: 'OpenAI · gpt-4o-mini' },
  ].filter(m => m.key)

  if (chain.length === 0) return new Response(JSON.stringify({ error: 'No AI API keys configured.' }), { status: 500, headers: { 'Content-Type': 'application/json' } })

  let lastError = null
  for (const model of chain) {
    try {
      const { stream, model: modelLabel } = await model.call(fullMessages, model.key)
      const { readable, writable } = new TransformStream()
      const writer = writable.getWriter(); const encoder = new TextEncoder()
      ;(async () => {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ model: modelLabel })}\n\n`))
        const reader = stream.getReader()
        while (true) { const { done, value } = await reader.read(); if (done) break; await writer.write(value) }
        writer.close()
      })()
      return new Response(readable, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Access-Control-Allow-Origin': '*' } })
    } catch (err) {
      lastError = err
      if (isRateLimitError(err.status)) continue
      continue
    }
  }

  return new Response(JSON.stringify({ error: lastError?.message || 'All models rate limited.' }), { status: 429, headers: { 'Content-Type': 'application/json' } })
}
