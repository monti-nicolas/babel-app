import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    if (!password || !confirm) { setError('Please fill in both fields'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }

    setLoading(true); setError('')
    try {
      const token = params.get('token')
      await api.post('/auth/reset-password', { token, password })
      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--ink)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div className="card animate-fade-up" style={{ padding: 40, maxWidth: 400, width: '100%' }}>
        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>✅</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--white)', marginBottom: 12 }}>
              Password Reset!
            </h2>
            <p style={{ color: 'var(--text-dim)', marginBottom: 24 }}>You can now sign in with your new password.</p>
            <button className="btn-gold" onClick={() => navigate('/')} style={{ padding: '11px 28px' }}>
              Go to Sign In
            </button>
          </div>
        ) : (
          <>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--white)', marginBottom: 24 }}>
              New Password
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input
                className="input"
                type="password"
                placeholder="New password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ padding: '12px 14px' }}
              />
              <input
                className="input"
                type="password"
                placeholder="Confirm password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                style={{ padding: '12px 14px' }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>
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
            <button
              className="btn-gold"
              onClick={handleSubmit}
              disabled={loading}
              style={{ width: '100%', padding: '13px', marginTop: 20, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? '...' : 'Reset Password'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
