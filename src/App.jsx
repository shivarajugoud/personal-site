import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import Home from './pages/Home'
import Resume from './pages/Resume'
import Projects from './pages/Projects'
import Todo from './pages/Todo'
import Stats from './pages/Stats'
import Chat from './pages/Chat'

export default function App() {
  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#161b27',
            color: '#e5e7eb',
            border: '1px solid #1e2536',
            fontSize: '14px',
          },
        }}
      />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/todo" element={<Todo />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </Layout>
    </>
  )
}
