import { NavLink, useLocation } from 'react-router-dom'
import { useState } from 'react'

// To this (added MessageSquare)
import { Home, FileText, FolderGit2, CheckSquare, BarChart2, Menu, X, Terminal, MessageSquare } from 'lucide-react'


const navItems = [
  { to: '/',         icon: Home,        label: 'home' },
  { to: '/resume',   icon: FileText,    label: 'resume' },
  { to: '/projects', icon: FolderGit2,  label: 'projects' },
  { to: '/todo',     icon: CheckSquare, label: 'todo' },
  { to: '/stats',    icon: BarChart2,   label: 'stats' },
  { to: '/chat', icon: MessageSquare, label: 'ask ai' },
]

export default function Layout({ children }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen flex">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen border-r border-border bg-card fixed top-0 left-0 z-30">
        <div className="p-5 border-b border-border flex items-center gap-2">
          <Terminal className="w-5 h-5 text-accent" />
          <span className="font-display font-bold text-white text-lg">yourname</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-mono transition-all duration-150
                ${isActive
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              ./{label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="glow-dot shrink-0" />
            <span className="text-xs font-mono text-gray-500">available for work</span>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-accent" />
          <span className="font-display font-bold text-white">yourname</span>
        </div>
        <button onClick={() => setOpen(!open)} className="text-gray-400 hover:text-white">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-30 bg-surface/90" onClick={() => setOpen(false)}>
          <div className="w-56 h-full bg-card border-r border-border pt-14" onClick={e => e.stopPropagation()}>
            <nav className="p-4 space-y-1">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-mono transition-all
                    ${isActive
                      ? 'bg-accent/10 text-accent border border-accent/20'
                      : 'text-gray-500 hover:text-gray-300'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  ./{label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-56 pt-14 md:pt-0 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-10">
          {children}
        </div>
      </main>
    </div>
  )
}
