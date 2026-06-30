import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from '../components/ThemeToggle'

export default function Login() {
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const [isSignup, setIsSignup] = useState(false)
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setErr('')
    if (!username || !password || (isSignup && !name)) {
      setErr('Please fill in all fields.')
      return
    }
    setLoading(true)
    try {
      if (isSignup) await register(name.trim(), username.trim(), password)
      else await login(username.trim(), password)
      navigate('/')
    } catch (e) {
      setErr(e.response?.data?.message || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const onKey = (e) => { if (e.key === 'Enter') submit() }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <ThemeToggle />
        <h1>💰 ExpenseFlow</h1>
        <p className="sub">
          {isSignup ? 'Create your account to get started' : 'Sign in to track your daily expenses'}
        </p>

        {isSignup && (
          <div className="field">
            <label>Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              onKeyDown={onKey} placeholder="Jane Doe" />
          </div>
        )}

        <div className="field">
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)}
            onKeyDown={onKey} placeholder="your username" />
        </div>

        <div className="field">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            onKeyDown={onKey} placeholder="••••••••" />
        </div>

        <button className="btn" onClick={submit} disabled={loading}>
          {loading ? 'Please wait...' : isSignup ? 'Create account' : 'Sign in'}
        </button>

        <div className="err">{err}</div>

        <p className="toggle-link">
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
          <a onClick={() => { setIsSignup(!isSignup); setErr('') }}>
            {isSignup ? 'Sign in' : 'Sign up'}
          </a>
        </p>
      </div>
    </div>
  )
}
