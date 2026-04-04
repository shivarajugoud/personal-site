import { useState } from 'react'
import { Github, ExternalLink, Star, GitFork } from 'lucide-react'

const TAGS = ['All', 'React', 'Python', 'Node.js', 'ML', 'CLI']

const projects = [
  {
    name: 'Project Alpha',
    description: 'A full-stack web app that does X. Built with React on the frontend and Node.js + PostgreSQL on the backend. Features real-time updates via WebSockets.',
    tags: ['React', 'Node.js'],
    github: 'https://github.com/yourusername/project-alpha',
    live: 'https://project-alpha.vercel.app',
    stars: 42,
    forks: 8,
    status: 'active',
  },
  {
    name: 'ML Pipeline Tool',
    description: 'CLI tool for automating ML experiment tracking. Integrates with Weights & Biases and supports multi-GPU training configurations.',
    tags: ['Python', 'ML', 'CLI'],
    github: 'https://github.com/yourusername/ml-pipeline',
    live: null,
    stars: 18,
    forks: 3,
    status: 'active',
  },
  {
    name: 'Dev Portfolio V1',
    description: 'Previous version of this portfolio site. Open sourced for anyone to fork and customise. Minimal HTML/CSS/JS, no framework.',
    tags: ['React'],
    github: 'https://github.com/yourusername/portfolio-v1',
    live: null,
    stars: 9,
    forks: 5,
    status: 'archived',
  },
  {
    name: 'Expense Tracker API',
    description: 'REST API for expense tracking with multi-user support, categories, budgets, and monthly reports exported as PDF.',
    tags: ['Node.js', 'Python'],
    github: 'https://github.com/yourusername/expense-api',
    live: null,
    stars: 6,
    forks: 1,
    status: 'active',
  },
]

function ProjectCard({ project }) {
  return (
    <div className="card hover:border-accent/30 transition-all duration-200 group flex flex-col h-full">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white group-hover:text-accent transition-colors">
              {project.name}
            </h3>
            {project.status === 'archived' && (
              <span className="text-xs font-mono text-gray-600 border border-gray-700 px-1.5 py-0.5 rounded">archived</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {project.live && (
            <a href={project.live} target="_blank" rel="noreferrer"
              className="text-gray-600 hover:text-accent transition-colors"
              title="Live demo">
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <a href={project.github} target="_blank" rel="noreferrer"
            className="text-gray-600 hover:text-accent transition-colors"
            title="Source code">
            <Github className="w-4 h-4" />
          </a>
        </div>
      </div>

      <p className="text-sm text-gray-400 leading-relaxed flex-1 mb-4">
        {project.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {project.tags.map(t => <span key={t} className="badge-blue">{t}</span>)}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-600 font-mono shrink-0">
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3" />{project.stars}
          </span>
          <span className="flex items-center gap-1">
            <GitFork className="w-3 h-3" />{project.forks}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function Projects() {
  const [active, setActive] = useState('All')

  const filtered = active === 'All'
    ? projects
    : projects.filter(p => p.tags.includes(active))

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="section-title mb-1">Projects</h1>
        <p className="text-gray-500 text-sm">Things I've built and open-sourced</p>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {TAGS.map(tag => (
          <button
            key={tag}
            onClick={() => setActive(tag)}
            className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-all ${
              active === tag
                ? 'bg-accent/10 text-accent border-accent/30'
                : 'text-gray-500 border-border hover:border-gray-600 hover:text-gray-300'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map(p => <ProjectCard key={p.name} project={p} />)}
      </div>

      {filtered.length === 0 && (
        <p className="text-gray-600 text-sm font-mono text-center py-10">
          no projects with tag "{active}"
        </p>
      )}
    </div>
  )
}
