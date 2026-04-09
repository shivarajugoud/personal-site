import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Resume from './pages/Resume'
import Projects from './pages/Projects'
import Todo from './pages/Todo'
import Stats from './pages/Stats'
import Chat from './pages/Chat'
import Recruiter from './pages/Recruiter'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AuthCallback from './pages/AuthCallback'

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#161b27', color: '#e5e7eb', border: '1px solid #1e2536', fontSize: '14px' } }} />
      <Routes>
        {/* Auth pages — no sidebar layout */}
        <Route path="/login"          element={<Login />} />
        <Route path="/signup"         element={<Signup />} />
        <Route path="/auth/callback"  element={<AuthCallback />} />

        {/* Main app — with sidebar layout */}
        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/"          element={<Home />} />
              <Route path="/resume"    element={<Resume />} />
              <Route path="/projects"  element={<Projects />} />
              <Route path="/stats"     element={<Stats />} />
              <Route path="/chat"      element={<Chat />} />
              <Route path="/recruiter" element={<Recruiter />} />
              <Route path="/todo"      element={
                <ProtectedRoute><Todo /></ProtectedRoute>
              } />
            </Routes>
          </Layout>
        } />
      </Routes>
    </AuthProvider>
  )
}
