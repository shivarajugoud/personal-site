import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import { Home, FileText, FolderGit2, CheckSquare, BarChart2, Menu, X, Terminal, MessageSquare, Briefcase, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

const navItems = [
  { to: '/',          icon: Home,          label: 'home',      protected: false },
  { to: '/resume',    icon: FileText,      label: 'resume',    protected: false },
  { to: '/projects',  icon: FolderGit2,   label: 'projects',  protected: false },
  { to: '/stats',     icon: BarChart2,    label: 'stats',     protected: false },
  { to: '/chat',      icon: MessageSquare, label: 'ask ai',   protected: false },
  { to: '/todo',      icon: CheckSquare,  label: 'todo',      protected: true  },
  { to: '/recruiter', icon: Briefcase,    label: 'recruiters', protected: false },
]

export default function Layout({ children }) {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()

  const NavItem = ({ item }) => (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={() => setOpen(false)}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-mono transition-all duration-150
        ${isActive ? 'bg-accent/10 text-accent border border-accent/20' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`
      }
    >
      <item.icon className="w-4 h-4 shrink-0" />
      <span>./{item.label}</span>
      {item.protected && !user && <Lock className="w-3 h-3 ml-auto text-gray-700" />}
    </NavLink>
  )

  return (
    <div className="min-h-screen flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen border-r border-border bg-card fixed top-0 left-0 z-30">
        <div className="p-5 border-b border-border flex items-center gap-2">
          <Terminal className="w-5 h-5 text-accent" />
          <span className="font-display font-bold text-white text-lg">shivaraj</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => <NavItem key={item.to} item={item} />)}
        </nav>
        <div className="p-4 border-t border-border space-y-2">
          {user ? (
            <div className="text-xs font-mono text-gray-600 truncate" title={user.email}>
              <span className="text-accent">●</span> {user.email}
            </div>
          ) : (
            <Link to="/login" className="btn-ghost w-full text-xs text-center block">Sign in</Link>
          )}
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
          <span className="font-display font-bold text-white">shivaraj</span>
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
              {navItems.map(item => <NavItem key={item.to} item={item} />)}
            </nav>
            <div className="p-4 border-t border-border">
              {!user && <Link to="/login" onClick={() => setOpen(false)} className="btn-ghost w-full text-xs text-center block">Sign in</Link>}
            </div>
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
