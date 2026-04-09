// api/recruiter-chat.js — Vercel Edge Function
// Compression logic inlined (Edge runtime does not support relative imports)

// ── Candidate contexts ────────────────────────────────────────────────────────
const CANDIDATE_CONTEXTS = {
  shivaraj: `You are an AI assistant helping recruiters evaluate Shivaraj as a candidate.
Be professional, concise, and factual. Only answer questions about Shivaraj or role-fit topics.
Do not share salary numbers — say he prefers to discuss during interviews.

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
}

// ── Inlined compression ───────────────────────────────────────────────────────
const RAW_KEEP       = 4
const COMPRESS_EVERY = 10

function shouldCompress(messages) { return messages.length >= COMPRESS_EVERY }

async function compressHistory(messages, groqKey) {
  const toCompress     = messages.slice(0, messages.length - RAW_KEEP)
  const recentMessages = messages.slice(-RAW_KEEP)
  if (toCompress.length === 0) return { summary: null, recentMessages: messages }

  const transcript = toCompress.map(m => `${m.role==='user'?'User':'Assistant'}: ${m.content}`).join('\n')
  const prompt = `Summarise this conversation into 3-5 bullet points (max 20 words each). Output ONLY the bullets.\n\n${transcript}`

  if (groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages:[{role:'user',content:prompt}], max_tokens:200, temperature:0.3, stream:false }),
      })
      if (res.ok) {
        const data = await res.json()
        const summary = data.choices?.[0]?.message?.content?.trim()
        if (summary) return { summary, recentMessages }
      }
    } catch {}
  }

  const fallback = toCompress.filter(m=>m.role==='user').map(m=>`• ${m.content.slice(0,80)}`).join('\n')
  return { summary: fallback||null, recentMessages }
}

function buildMessages(systemPrompt, summary, recentMessages) {
  const messages = [{ role:'system', content:systemPrompt }]
  if (summary) messages.push({ role:'system', content:`[Earlier conversation summary]\n${summary}` })
  messages.push(...recentMessages)
  return messages
}

// ── Model callers ─────────────────────────────────────────────────────────────
function isRateLimit(s) { return s===429||s===503||s===529 }

async function callGroq(messages, key) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${key}` },
    body: JSON.stringify({ model:'llama-3.3-70b-versatile', messages, stream:true, max_tokens:1024, temperature:0.7 }),
  })
  if (!res.ok) { const e=new Error((await res.json().catch(()=>({}))).error?.message||'Groq error'); e.status=res.status; throw e }
  return { stream:res.body, model:'Groq · llama-3.3-70b' }
}

async function callGemini(messages, key) {
  const sys  = messages.filter(m=>m.role==='system').map(m=>m.content).join('\n\n')
  const chat = messages.filter(m=>m.role!=='system').map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]}))
  const res  = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${key}`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({system_instruction:{parts:[{text:sys}]},contents:chat,generationConfig:{maxOutputTokens:1024,temperature:0.7}}),
  })
  if (!res.ok) { const e=new Error((await res.json().catch(()=>({}))).error?.message||'Gemini error'); e.status=res.status; throw e }
  const {readable,writable}=new TransformStream()
  const writer=writable.getWriter(); const enc=new TextEncoder(); const dec=new TextDecoder()
  ;(async()=>{ try { const reader=res.body.getReader(); let buf=''
    while(true){ const{done,value}=await reader.read(); if(done)break
      buf+=dec.decode(value,{stream:true}); const lines=buf.split('\n'); buf=lines.pop()
      for(const line of lines){ if(!line.startsWith('data: '))continue; const d=line.slice(6).trim(); if(!d||d==='[DONE]')continue
        try{ const j=JSON.parse(d); const t=j?.candidates?.[0]?.content?.parts?.[0]?.text; if(t)await writer.write(enc.encode(`data: ${JSON.stringify({choices:[{delta:{content:t}}]})}\n\n`)) }catch{} }
    } await writer.write(enc.encode('data: [DONE]\n\n'))
  } finally{ writer.close() } })()
  return { stream:readable, model:'Gemini · 1.5-flash' }
}

async function callOpenAI(messages, key) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${key}` },
    body: JSON.stringify({ model:'gpt-4o-mini', messages, stream:true, max_tokens:1024, temperature:0.7 }),
  })
  if (!res.ok) { const e=new Error((await res.json().catch(()=>({}))).error?.message||'OpenAI error'); e.status=res.status; throw e }
  return { stream:res.body, model:'OpenAI · gpt-4o-mini' }
}

// ── Handler ───────────────────────────────────────────────────────────────────
export const config = { runtime: 'edge' }

export default async function handler(req) {
  if (req.method==='OPTIONS') return new Response(null,{headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'}})
  if (req.method!=='POST') return new Response('Method not allowed',{status:405})

  let body; try { body=await req.json() } catch { return new Response('Invalid JSON',{status:400}) }
  const { messages=[], candidateId } = body

  const context = CANDIDATE_CONTEXTS[candidateId]
  if (!context) return new Response(JSON.stringify({error:`Unknown candidate: ${candidateId}`}),{status:400,headers:{'Content-Type':'application/json'}})

  let summary=null, chatMessages=messages
  if (shouldCompress(messages)) {
    const r=await compressHistory(messages, process.env.GROQ_API_KEY)
    summary=r.summary; chatMessages=r.recentMessages
  }

  const fullMessages = buildMessages(context, summary, chatMessages)

  const chain = [
    { call:callGroq,   key:process.env.GROQ_API_KEY,  label:'Groq · llama-3.3-70b' },
    { call:callGemini, key:process.env.GEMINI_API_KEY, label:'Gemini · 1.5-flash' },
    { call:callOpenAI, key:process.env.OPENAI_API_KEY, label:'OpenAI · gpt-4o-mini' },
  ].filter(m=>m.key)

  if (!chain.length) return new Response(JSON.stringify({error:'No AI API keys configured.'}),{status:500,headers:{'Content-Type':'application/json'}})

  let lastError=null
  for (const model of chain) {
    try {
      const {stream,model:label} = await model.call(fullMessages, model.key)
      const {readable,writable}=new TransformStream(); const writer=writable.getWriter(); const enc=new TextEncoder()
      ;(async()=>{
        await writer.write(enc.encode(`data: ${JSON.stringify({model:label})}\n\n`))
        const reader=stream.getReader()
        while(true){ const{done,value}=await reader.read(); if(done)break; await writer.write(value) }
        writer.close()
      })()
      return new Response(readable,{headers:{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Access-Control-Allow-Origin':'*'}})
    } catch(err) { lastError=err; if(isRateLimit(err.status))continue; continue }
  }

  return new Response(JSON.stringify({error:lastError?.message||'All models rate limited.'}),{status:429,headers:{'Content-Type':'application/json'}})
}