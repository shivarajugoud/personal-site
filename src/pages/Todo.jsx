import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Plus, Trash2, Check, Loader2, Tag } from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Supabase client ────────────────────────────────────────────────────────
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'
)

const LABELS = ['all', 'work', 'learning', 'personal', 'oss']
const LABEL_COLORS = {
  work:     'badge-blue',
  learning: 'badge-purple',
  personal: 'badge-green',
  oss:      'badge-yellow',
}

export default function Todo() {
  const [todos, setTodos] = useState([])
  const [input, setInput] = useState('')
  const [label, setLabel] = useState('personal')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  const fetchTodos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setTodos(data || [])
    } catch {
      // Supabase not configured yet — use local state demo
      setTodos([
        { id: 1, text: 'Configure Supabase (see README)', done: false, label: 'work' },
        { id: 2, text: 'Update resume with latest role', done: false, label: 'work' },
        { id: 3, text: 'Solve 2 LeetCode problems today', done: true,  label: 'learning' },
        { id: 4, text: 'Open PR for personal project', done: false, label: 'oss' },
      ])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTodos() }, [fetchTodos])

  async function addTodo() {
    if (!input.trim()) return
    setAdding(true)
    const newTodo = { text: input.trim(), done: false, label }
    try {
      const { data, error } = await supabase.from('todos').insert(newTodo).select().single()
      if (error) throw error
      setTodos(prev => [data, ...prev])
    } catch {
      // Demo mode — just add locally
      setTodos(prev => [{ ...newTodo, id: Date.now() }, ...prev])
    }
    setInput('')
    setAdding(false)
    toast.success('Added')
  }

  async function toggleTodo(id, done) {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !done } : t))
    try {
      await supabase.from('todos').update({ done: !done }).eq('id', id)
    } catch { /* demo mode */ }
  }

  async function deleteTodo(id) {
    setTodos(prev => prev.filter(t => t.id !== id))
    try {
      await supabase.from('todos').delete().eq('id', id)
    } catch { /* demo mode */ }
    toast.success('Deleted')
  }

  const visible = filter === 'all' ? todos : todos.filter(t => t.label === filter)
  const doneCount = todos.filter(t => t.done).length

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="section-title mb-1">Todo</h1>
          <p className="text-gray-500 text-sm font-mono">
            {doneCount}/{todos.length} completed
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-border rounded-full h-1">
        <div
          className="bg-accent h-1 rounded-full transition-all duration-500"
          style={{ width: todos.length ? `${(doneCount / todos.length) * 100}%` : '0%' }}
        />
      </div>

      {/* Add input */}
      <div className="card space-y-3">
        <input
          className="input-field"
          placeholder="What needs doing?"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTodo()}
        />
        <div className="flex items-center gap-3">
          <Tag className="w-4 h-4 text-gray-600 shrink-0" />
          <div className="flex gap-2 flex-wrap flex-1">
            {LABELS.filter(l => l !== 'all').map(l => (
              <button
                key={l}
                onClick={() => setLabel(l)}
                className={`text-xs font-mono px-2.5 py-1 rounded-lg border transition-all ${
                  label === l
                    ? 'bg-accent/10 text-accent border-accent/30'
                    : 'text-gray-600 border-border hover:text-gray-400'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <button
            onClick={addTodo}
            disabled={adding || !input.trim()}
            className="btn-primary flex items-center gap-1.5 shrink-0"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {LABELS.map(l => (
          <button
            key={l}
            onClick={() => setFilter(l)}
            className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-all ${
              filter === l
                ? 'bg-accent/10 text-accent border-accent/30'
                : 'text-gray-600 border-border hover:text-gray-400'
            }`}
          >
            {l}
            <span className="ml-1.5 text-gray-600">
              {l === 'all' ? todos.length : todos.filter(t => t.label === l).length}
            </span>
          </button>
        ))}
      </div>

      {/* Todo list */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map(todo => (
            <div
              key={todo.id}
              className={`card flex items-center gap-3 group transition-all ${
                todo.done ? 'opacity-50' : ''
              }`}
            >
              <button
                onClick={() => toggleTodo(todo.id, todo.done)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                  todo.done
                    ? 'bg-accent border-accent'
                    : 'border-border hover:border-accent/60'
                }`}
              >
                {todo.done && <Check className="w-3 h-3 text-surface" strokeWidth={3} />}
              </button>

              <span className={`flex-1 text-sm ${todo.done ? 'line-through text-gray-600' : 'text-gray-300'}`}>
                {todo.text}
              </span>

              {todo.label && (
                <span className={LABEL_COLORS[todo.label] || 'badge'}>
                  {todo.label}
                </span>
              )}

              <button
                onClick={() => deleteTodo(todo.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-400 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {visible.length === 0 && (
            <p className="text-gray-600 text-sm font-mono text-center py-8">
              nothing here · add a task above
            </p>
          )}
        </div>
      )}
    </div>
  )
}
