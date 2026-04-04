import { useEffect, useState } from 'react'
import GitHubCalendar from 'react-github-calendar'
import { Code2, Github, Trophy, Zap, TrendingUp, Loader2, AlertCircle } from 'lucide-react'

// ─── GitHub stats ────────────────────────────────────────────────────────────
function GitHubStats({ username }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!username || username === 'yourusername') {
      setError('Set VITE_GITHUB_USERNAME in .env')
      setLoading(false)
      return
    }
    fetch(`https://api.github.com/users/${username}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setError('Failed to fetch GitHub data'); setLoading(false) })
  }, [username])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Github className="w-4 h-4 text-accent" />
        <h2 className="font-display text-lg font-semibold text-white">GitHub</h2>
        {username && username !== 'yourusername' && (
          <a
            href={`https://github.com/${username}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-mono text-gray-600 hover:text-accent transition-colors ml-auto"
          >
            @{username} ↗
          </a>
        )}
      </div>

      {loading && (
        <div className="card flex items-center gap-2 text-gray-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading...
        </div>
      )}
      {error && (
        <div className="card flex items-center gap-2 text-yellow-500 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Repos',       value: data.public_repos },
            { label: 'Followers',   value: data.followers },
            { label: 'Following',   value: data.following },
            { label: 'Gists',       value: data.public_gists },
          ].map(({ label, value }) => (
            <div key={label} className="card text-center">
              <p className="text-2xl font-display font-bold text-accent">{value ?? '—'}</p>
              <p className="text-xs text-gray-500 font-mono mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Contribution Calendar */}
      <div className="card overflow-x-auto">
        <p className="text-xs font-mono text-gray-600 mb-4">contribution activity</p>
        {username && username !== 'yourusername' ? (
          <GitHubCalendar
            username={username}
            colorScheme="dark"
            fontSize={12}
            blockSize={11}
            blockMargin={3}
            theme={{
              dark: ['#1a1f2e', '#0d3320', '#1a5c3a', '#2d9b61', '#6EE7B7'],
            }}
          />
        ) : (
          <p className="text-gray-600 text-sm font-mono">
            Set <code className="text-accent">VITE_GITHUB_USERNAME</code> in .env to see calendar
          </p>
        )}
      </div>
    </div>
  )
}

// ─── LeetCode stats ──────────────────────────────────────────────────────────
function LeetCodeStats({ username }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!username || username === 'yourleetcode') {
      setError('Set VITE_LEETCODE_USERNAME in .env')
      setLoading(false)
      return
    }

    // Fetch via our Vercel serverless function proxy (avoids CORS)
    fetch(`/api/leetcode?username=${username}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setData(d)
        setLoading(false)
      })
      .catch(err => {
        setError('Could not load LeetCode data. Make sure the API route is deployed.')
        setLoading(false)
      })
  }, [username])

  const difficulties = data
    ? [
        { label: 'Easy',   count: data.easySolved,   total: data.easyTotal,   color: 'text-emerald-400' },
        { label: 'Medium', count: data.mediumSolved,  total: data.mediumTotal, color: 'text-yellow-400' },
        { label: 'Hard',   count: data.hardSolved,    total: data.hardTotal,   color: 'text-red-400' },
      ]
    : []

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Code2 className="w-4 h-4 text-accent" />
        <h2 className="font-display text-lg font-semibold text-white">LeetCode</h2>
        {username && username !== 'yourleetcode' && (
          <a
            href={`https://leetcode.com/${username}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-mono text-gray-600 hover:text-accent transition-colors ml-auto"
          >
            @{username} ↗
          </a>
        )}
      </div>

      {loading && (
        <div className="card flex items-center gap-2 text-gray-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading...
        </div>
      )}
      {error && (
        <div className="card flex items-center gap-2 text-yellow-500 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {data && (
        <>
          {/* Overview */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card text-center">
              <p className="text-2xl font-display font-bold text-accent">{data.totalSolved}</p>
              <p className="text-xs text-gray-500 font-mono mt-1">solved</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-display font-bold text-white">{data.ranking ?? '—'}</p>
              <p className="text-xs text-gray-500 font-mono mt-1">rank</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-display font-bold text-white">{data.acceptanceRate ?? '—'}%</p>
              <p className="text-xs text-gray-500 font-mono mt-1">acceptance</p>
            </div>
          </div>

          {/* Difficulty bars */}
          <div className="card space-y-3">
            {difficulties.map(({ label, count, total, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className={color}>{label}</span>
                  <span className="text-gray-500">{count} / {total}</span>
                </div>
                <div className="w-full bg-border rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all duration-700"
                    style={{
                      width: `${(count / total) * 100}%`,
                      background: label === 'Easy' ? '#34d399' : label === 'Medium' ? '#fbbf24' : '#f87171',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function Stats() {
  const githubUsername  = import.meta.env.VITE_GITHUB_USERNAME  || 'yourusername'
  const leetcodeUsername = import.meta.env.VITE_LEETCODE_USERNAME || 'yourleetcode'

  return (
    <div className="space-y-12 animate-fade-in">
      <div>
        <h1 className="section-title mb-1">Coding Stats</h1>
        <p className="text-gray-500 text-sm">Live data from GitHub and LeetCode</p>
      </div>

      <GitHubStats username={githubUsername} />
      <div className="border-t border-border" />
      <LeetCodeStats username={leetcodeUsername} />
    </div>
  )
}
