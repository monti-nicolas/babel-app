import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = params.get('token')
    if (!token) {
      setStatus('error')
      setMessage('Invalid verification link.')
      return
    }

    api.post('/auth/verify-email', { token })
      .then(res => {
        setStatus('success')
        setMessage(res.data.message)
      })
      .catch(err => {
        setStatus('error')
        setMessage(err.response?.data?.error || 'Verification failed.')
      })
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--ink)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div className="card animate-fade-up" style={{ padding: 40, maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>
          {status === 'loading' ? '⏳' : status === 'success' ? '✅' : '❌'}
        </div>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.4rem',
          color: 'var(--white)',
          marginBottom: 12,
        }}>
          {status === 'loading' ? 'Verifying...' : status === 'success' ? 'Email Verified!' : 'Verification Failed'}
        </h2>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: 24 }}>{message}</p>
        {status !== 'loading' && (
          <button className="btn-gold" onClick={() => navigate('/')} style={{ padding: '11px 28px' }}>
            Go to Sign In
          </button>
        )}
      </div>
    </div>
  )
}
