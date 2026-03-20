import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import babelLogo from '../assets/babel-logo.png'

type Mode = 'signin' | 'signup' | 'forgot'

export default function Landing() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard')
  }, [isAuthenticated])

  // WebSocket — wait for RFID scan
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.hostname
    const ws = new WebSocket(`${protocol}//${host}:3001/ws`)
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'WAITING_FOR_SCAN' }))
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'SCAN_LOGIN') {
          login(data.token, data.user)
          navigate('/dashboard')
        }
      } catch {}
    }

    return () => ws.close()
  }, [])

  const handleSignIn = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return }
    setLoading(true); setError('')
    try {
      const res = await api.post('/auth/login', { email, password })
      login(res.data.token, res.data.user)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async () => {
    if (!email || !password || !username) { setError('Please fill in all fields'); return }
    setLoading(true); setError('')
    try {
      const res = await api.post('/auth/signup', { email, username, password })
      setSuccess(res.data.message)
      setMode('signin')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async () => {
    if (!email) { setError('Please enter your email'); return }
    setLoading(true); setError('')
    try {
      await api.post('/auth/forgot-password', { email })
      setSuccess('If an account exists for this email, a reset link has been sent.')
    } catch {
      setSuccess('If an account exists for this email, a reset link has been sent.')
    } finally {
      setLoading(false)
    }
  }

  const submit = mode === 'signin' ? handleSignIn : mode === 'signup' ? handleSignUp : handleForgot

  return (
    <div style={{
      minHeight: '100vh',
      background: 'rgba(13, 15, 20, 0.88)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Background decorative elements */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        left: '-10%',
        width: '60vw',
        height: '60vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,169,110,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-20%',
        right: '-10%',
        width: '50vw',
        height: '50vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,169,110,0.03) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%',
        maxWidth: 440,
        position: 'relative',
        zIndex: 1,
      }}>

        {/* Logo & title */}
        <div className="animate-fade-up" style={{ textAlign: 'center', marginBottom: 40 }}>
          <img
            src={babelLogo}
            alt="Babel"
            style={{ maxWidth: 280, width: '100%', height: 'auto', display: 'block', margin: '0 auto' }}
          />
        </div>

        {/* Card */}
        <div className="animate-fade-up delay-100 card" style={{ padding: 32 }}>

          {/* Mode tabs */}
          {mode !== 'forgot' && (
            <div style={{
              display: 'flex',
              gap: 4,
              marginBottom: 28,
              background: 'var(--ink-muted)',
              borderRadius: 'var(--radius-sm)',
              padding: 4,
            }}>
              {(['signin', 'signup'] as Mode[]).map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); setSuccess('') }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: 4,
                    border: 'none',
                    background: mode === m ? 'var(--ink-soft)' : 'transparent',
                    color: mode === m ? 'var(--parchment)' : 'var(--text-dim)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all var(--transition)',
                    boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                  }}
                >
                  {m === 'signin' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>
          )}

          {mode === 'forgot' && (
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.3rem',
              color: 'var(--white)',
              marginBottom: 20,
            }}>
              Reset Password
            </h2>
          )}

          {/* Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'signup' && (
              <input
                className="input"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                style={{ padding: '12px 14px' }}
              />
            )}
            <input
              className="input"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ padding: '12px 14px' }}
              onKeyDown={e => e.key === 'Enter' && submit()}
            />
            {mode !== 'forgot' && (
              <input
                className="input"
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ padding: '12px 14px' }}
                onKeyDown={e => e.key === 'Enter' && submit()}
              />
            )}
          </div>

          {/* Error / success */}
          {error && (
            <div style={{
              marginTop: 14,
              padding: '10px 14px',
              background: 'rgba(229,115,115,0.1)',
              border: '1px solid rgba(229,115,115,0.3)',
              borderRadius: 'var(--radius-sm)',
              color: '#e57373',
              fontSize: '0.85rem',
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              marginTop: 14,
              padding: '10px 14px',
              background: 'rgba(129,199,132,0.1)',
              border: '1px solid rgba(129,199,132,0.3)',
              borderRadius: 'var(--radius-sm)',
              color: '#81c784',
              fontSize: '0.85rem',
            }}>
              {success}
            </div>
          )}

          {/* Submit */}
          <button
            className="btn-gold"
            onClick={submit}
            disabled={loading}
            style={{ width: '100%', padding: '13px', marginTop: 20, fontSize: '0.95rem', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? '...' : mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
          </button>

          {/* Forgot password link */}
          {mode === 'signin' && (
            <button
              onClick={() => { setMode('forgot'); setError(''); setSuccess('') }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                marginTop: 14,
                width: '100%',
                textAlign: 'center',
                transition: 'color var(--transition)',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--parchment)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-dim)'}
            >
              Forgot password?
            </button>
          )}

          {mode === 'forgot' && (
            <button
              onClick={() => { setMode('signin'); setError(''); setSuccess('') }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                marginTop: 14,
                width: '100%',
                textAlign: 'center',
                transition: 'color var(--transition)',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--parchment)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-dim)'}
            >
              ← Back to sign in
            </button>
          )}
        </div>

        {/* RFID hint */}
        <div className="animate-fade-up delay-200" style={{
          marginTop: 20,
          textAlign: 'center',
          color: 'var(--text-dim)',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}>
          <span style={{ fontSize: '1rem' }}>📡</span>
          <span>Or scan your RFID tag to sign in instantly</span>
        </div>
      </div>
    </div>
  )
}
