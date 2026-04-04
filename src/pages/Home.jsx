import { Link } from 'react-router-dom'
import { ArrowRight, Github, Linkedin, Mail, ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'

const TYPING_STRINGS = [
  'Software Engineer',
  'Open Source Contributor',
  'Problem Solver',
  'Full Stack Developer',
]

function TypedText() {
  const [idx, setIdx] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const target = TYPING_STRINGS[idx]
    let timer

    if (!deleting && displayed.length < target.length) {
      timer = setTimeout(() => setDisplayed(target.slice(0, displayed.length + 1)), 80)
    } else if (!deleting && displayed.length === target.length) {
      timer = setTimeout(() => setDeleting(true), 2000)
    } else if (deleting && displayed.length > 0) {
      timer = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 40)
    } else if (deleting && displayed.length === 0) {
      setDeleting(false)
      setIdx((idx + 1) % TYPING_STRINGS.length)
    }

    return () => clearTimeout(timer)
  }, [displayed, deleting, idx])

  return (
    <span className="text-accent font-mono">
      {displayed}
      <span className="animate-blink">|</span>
    </span>
  )
}

const quickLinks = [
  { to: '/resume',   label: 'View Resume',   icon: ArrowRight },
  { to: '/projects', label: 'Projects',      icon: ArrowRight },
  { to: '/stats',    label: 'Coding Stats',  icon: ArrowRight },
  { to: '/todo',     label: 'Todo List',     icon: ArrowRight },
]

export default function Home() {
  return (
    <div className="space-y-10 animate-fade-in">
      {/* Hero */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center gap-2 text-sm font-mono text-gray-500">
          <span className="glow-dot" />
          <span>Open to opportunities</span>
        </div>

        <div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white leading-tight">
            Hi, I'm <span className="text-accent">Shiva Raj Madhagoni</span>
          </h1>
          <p className="text-xl text-gray-400 mt-2 font-light">
            <TypedText />
          </p>
        </div>

        <p className="text-gray-400 max-w-xl leading-relaxed">
          I build robust, scalable software and love competitive programming.
          Based in Hyderabad, India. Currently working on cool stuff.
        </p>

        {/* Social links */}
        <div className="flex items-center gap-3 pt-1">
          <a
            href="https://github.com/shivarajugoud"
            target="_blank"
            rel="noreferrer"
            className="btn-ghost flex items-center gap-2"
          >
            <Github className="w-4 h-4" />
            GitHub
          </a>
          <a
            href="https://linkedin.com/in/shivaraj-madhagoni-59061116b/"
            target="_blank"
            rel="noreferrer"
            className="btn-ghost flex items-center gap-2"
          >
            <Linkedin className="w-4 h-4" />
            LinkedIn
          </a>
          <a
            href="mailto:shivarajum127@email.com"
            className="btn-primary flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Contact
          </a>
        </div>
      </section>

      {/* Quick nav cards */}
      <section>
        <p className="text-xs font-mono text-gray-600 uppercase tracking-widest mb-4">explore</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="card hover:border-accent/30 hover:bg-accent/5 transition-all duration-200 group"
            >
              <span className="text-sm text-gray-400 group-hover:text-accent transition-colors font-mono">
                {label}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-accent mt-1 transition-colors" />
            </Link>
          ))}
        </div>
      </section>

      {/* About snippet */}
      <section className="card space-y-3">
        <h2 className="font-display text-lg font-semibold text-white">About me</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          Edit <code className="text-accent font-mono bg-accent/10 px-1 rounded">src/pages/Home.jsx</code> to
          update this section. Mention your background, what you're working on, and what
          excites you about software.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {['React', 'Node.js', 'Python', 'TypeScript', 'PostgreSQL', 'Docker'].map(t => (
            <span key={t} className="badge-green">{t}</span>
          ))}
        </div>
      </section>
    </div>
  )
}
