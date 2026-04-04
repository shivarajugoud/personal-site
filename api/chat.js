// api/chat.js — Vercel serverless function
// Tries Groq → Gemini → OpenAI in order, falling back on 429 / quota errors.
// Streams the response back to the client using chunked transfer.

import { PERSONAL_CONTEXT } from './context.js'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isRateLimitError(status) {
  return status === 429 || status === 503 || status === 529
}

// ─── Provider callers (all return a ReadableStream of text chunks) ────────────

async function callGroq(messages, apiKey) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      stream: true,
      max_tokens: 1024,
      temperature: 0.7,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const e = new Error(err?.error?.message || 'Groq error')
    e.status = res.status
    throw e
  }

  return { stream: res.body, model: 'Groq · llama-3.3-70b' }
}

async function callGemini(messages, apiKey) {
  // Convert OpenAI-style messages to Gemini format
  const systemMsg = messages.find(m => m.role === 'system')?.content || ''
  const chatMsgs  = messages.filter(m => m.role !== 'system')

  const contents = chatMsgs.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const body = {
    system_instruction: { parts: [{ text: systemMsg }] },
    contents,
    generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const e = new Error(err?.error?.message || 'Gemini error')
    e.status = res.status
    throw e
  }

  // Wrap Gemini SSE into OpenAI-compatible SSE stream
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  ;(async () => {
    try {
      const reader = res.body.getReader()
      let buffer = ''
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
            const text = json?.candidates?.[0]?.content?.parts?.[0]?.text
            if (text) {
              // Emit as OpenAI-compatible SSE chunk
              const chunk = JSON.stringify({ choices: [{ delta: { content: text } }] })
              await writer.write(encoder.encode(`data: ${chunk}\n\n`))
            }
          } catch { /* skip malformed */ }
        }
      }
      await writer.write(encoder.encode('data: [DONE]\n\n'))
    } finally {
      writer.close()
    }
  })()

  return { stream: readable, model: 'Gemini · 1.5-flash' }
}

async function callOpenAI(messages, apiKey) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      stream: true,
      max_tokens: 1024,
      temperature: 0.7,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const e = new Error(err?.error?.message || 'OpenAI error')
    e.status = res.status
    throw e
  }

  return { stream: res.body, model: 'OpenAI · gpt-4o-mini' }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export const config = { runtime: 'edge' }  // Edge runtime for streaming support

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const { messages = [] } = body

  // Build the full message array with personal context as system prompt
  const fullMessages = [
    { role: 'system', content: PERSONAL_CONTEXT },
    ...messages.slice(-20), // keep last 20 messages to avoid token limits
  ]

  // Model chain with env key lookup
  const chain = [
    { call: callGroq,   key: process.env.GROQ_API_KEY,   label: 'Groq · llama-3.3-70b' },
    { call: callGemini, key: process.env.GEMINI_API_KEY,  label: 'Gemini · 1.5-flash' },
    { call: callOpenAI, key: process.env.OPENAI_API_KEY,  label: 'OpenAI · gpt-4o-mini' },
  ].filter(m => m.key) // skip unconfigured models

  if (chain.length === 0) {
    return new Response(
      JSON.stringify({ error: 'No AI API keys configured. Add GROQ_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY to your env vars.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  let lastError = null

  for (const model of chain) {
    try {
      const { stream, model: modelLabel } = await model.call(fullMessages, model.key)

      // Stream back — prepend a metadata line so the client knows which model responded
      const { readable, writable } = new TransformStream()
      const writer = writable.getWriter()
      const encoder = new TextEncoder()

      ;(async () => {
        // First chunk: model metadata
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ model: modelLabel })}\n\n`)
        )
        // Pipe the rest
        const reader = stream.getReader()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          await writer.write(value)
        }
        writer.close()
      })()

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*',
        },
      })
    } catch (err) {
      lastError = err
      if (isRateLimitError(err.status)) {
        console.log(`${model.label} rate limited (${err.status}), trying next model...`)
        continue // try next model
      }
      // Non-rate-limit error — still try next model but log it
      console.error(`${model.label} error: ${err.message}`)
      continue
    }
  }

  // All models failed
  return new Response(
    JSON.stringify({
      error: lastError?.message || 'All AI models failed or are rate limited. Try again shortly.',
    }),
    { status: 429, headers: { 'Content-Type': 'application/json' } }
  )
}
