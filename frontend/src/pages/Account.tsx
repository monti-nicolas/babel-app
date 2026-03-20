import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import AvatarPicker from '../components/AvatarPicker'
import BackgroundPicker from '../components/BackgroundPicker'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function Account() {
  const { user, login, token, logout } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState(user?.username || '')
  const [avatarId, setAvatarId] = useState(user?.avatarId || 'avatar_1')
  const [backgroundId, setBackgroundId] = useState(user?.backgroundId || 'bg_library')
  const [saving, setSaving] = useState<string | null>(null)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // RFID
  const [rfidTags, setRfidTags] = useState<{ id: string; uid: string; label: string }[]>([])
  const [rfidLoaded, setRfidLoaded] = useState(false)
  const [waitingForScan, setWaitingForScan] = useState(false)
  const [rfidLabel, setRfidLabel] = useState('My Tag')
  const [rfidError, setRfidError] = useState('')
  const [rfidSuccess, setRfidSuccess] = useState('')

  // Delete account
  const [confirmDelete, setConfirmDelete] = useState(false)

  const notify = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(''), 3000)
  }

  const loadRfidTags = async () => {
    if (rfidLoaded) return
    try {
      const res = await api.get('/rfid/tags')
      setRfidTags(res.data.tags)
      setRfidLoaded(true)
    } catch {}
  }

  const handleSaveUsername = async () => {
    setSaving('username'); setError('')
    try {
      await api.patch('/users/username', { username })
      if (user && token) login(token, { ...user, username })
      notify('Username updated!')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update username')
    } finally {
      setSaving(null)
    }
  }

  const handleSaveAvatar = async (id: string) => {
    setAvatarId(id)
    setSaving('avatar')
    try {
      await api.patch('/users/avatar', { avatarId: id })
      if (user && token) login(token, { ...user, avatarId: id })
      notify('Avatar updated!')
    } catch {} finally { setSaving(null) }
  }

  const handleSaveBackground = async (id: string) => {
    setBackgroundId(id)
    setSaving('background')
    try {
      await api.patch('/users/background', { backgroundId: id })
      if (user && token) login(token, { ...user, backgroundId: id })
      notify('Background updated!')
    } catch {} finally { setSaving(null) }
  }

  const startRfidScan = async () => {
    setWaitingForScan(true)
    setRfidError('')
    setRfidSuccess('')

    // Poll /api/rfid/pending for up to 30 seconds
    const start = Date.now()
    const poll = async () => {
      if (Date.now() - start > 30000) {
        setWaitingForScan(false)
        setRfidError('Scan timed out. Please try again.')
        return
      }
      try {
        const res = await api.get('/rfid/pending')
        if (res.data.scan) {
          // Got a scan — link it
          await api.post('/rfid/tags', { uid: res.data.scan.user ? res.data.scan.user.id : undefined })
        }
      } catch {}

      // Actually for RFID registration we use a different approach:
      // wait for a raw scan event and then POST to /rfid/tags with the UID
      // We reuse the pending endpoint to get the latest uid
    }

    // Use WebSocket to get the next scan
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.hostname}:3001/ws`)

    // Don't send WAITING_FOR_SCAN here — we want to intercept the raw UID
    // Instead, poll the scan_events table via a dedicated endpoint
    const interval = setInterval(async () => {
      if (Date.now() - start > 30000) {
        clearInterval(interval)
        setWaitingForScan(false)
        setRfidError('Scan timed out. Please try again.')
        return
      }
      try {
        const res = await api.get('/rfid/pending-raw')
        if (res.data.uid) {
          clearInterval(interval)
          // Link this UID to the account
          const linkRes = await api.post('/rfid/tags', { uid: res.data.uid, label: rfidLabel })
          setRfidTags(prev => [...prev, linkRes.data.tag])
          setRfidSuccess('Tag linked successfully!')
          setWaitingForScan(false)
        }
      } catch {}
    }, 1000)

    ws.onclose = () => clearInterval(interval)
  }

  const handleRemoveTag = async (id: string) => {
    try {
      await api.delete(`/rfid/tags/${id}`)
      setRfidTags(prev => prev.filter(t => t.id !== id))
      notify('Tag removed')
    } catch {}
  }

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/auth/account')
      logout()
      navigate('/')
    } catch {}
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>
        <div className="animate-fade-up" style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--white)' }}>
            Account
          </h1>
        </div>

        {success && (
          <div style={{
            padding: '10px 16px',
            background: 'rgba(129,199,132,0.1)',
            border: '1px solid rgba(129,199,132,0.3)',
            borderRadius: 'var(--radius-sm)',
            color: '#81c784',
            fontSize: '0.875rem',
            marginBottom: 20,
            animation: 'fadeIn 0.2s ease',
          }}>
            {success}
          </div>
        )}

        {/* Username */}
        <Section title="Username">
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              className="input"
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={{ padding: '11px 14px' }}
            />
            <button
              className="btn-gold"
              onClick={handleSaveUsername}
              disabled={saving === 'username'}
              style={{ padding: '11px 20px', whiteSpace: 'nowrap', opacity: saving === 'username' ? 0.7 : 1 }}
            >
              Save
            </button>
          </div>
          {error && <div style={{ color: '#e57373', fontSize: '0.8rem', marginTop: 8 }}>{error}</div>}
        </Section>

        {/* Avatar */}
        <Section title="Avatar">
          <AvatarPicker value={avatarId} onChange={handleSaveAvatar} />
        </Section>

        {/* Background */}
        <Section title="Colour Theme">
          <BackgroundPicker value={backgroundId} onChange={handleSaveBackground} />
        </Section>

        {/* RFID Tags */}
        <Section title="RFID Tags" onOpen={loadRfidTags}>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: 16 }}>
            Link RFID tags to your account for instant sign-in.
          </p>

          {rfidTags.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {rfidTags.map(tag => (
                <div key={tag.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--ink-muted)',
                  border: '1px solid var(--border-soft)',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  <div>
                    <div style={{ color: 'var(--white)', fontSize: '0.875rem' }}>{tag.label}</div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontFamily: 'monospace', marginTop: 2 }}>
                      {tag.uid}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveTag(tag.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#e57373',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      opacity: 0.7,
                      transition: 'opacity var(--transition)',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '0.7'}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {rfidSuccess && (
            <div style={{ color: '#81c784', fontSize: '0.85rem', marginBottom: 12 }}>{rfidSuccess}</div>
          )}
          {rfidError && (
            <div style={{ color: '#e57373', fontSize: '0.85rem', marginBottom: 12 }}>{rfidError}</div>
          )}

          {waitingForScan ? (
            <div style={{
              padding: '16px',
              background: 'var(--ink-muted)',
              border: '1px dashed var(--border)',
              borderRadius: 'var(--radius-sm)',
              textAlign: 'center',
              color: 'var(--parchment)',
              fontSize: '0.875rem',
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>📡</div>
              Waiting for RFID tag to be scanned...
              <button
                onClick={() => setWaitingForScan(false)}
                style={{
                  display: 'block',
                  margin: '10px auto 0',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                className="input"
                placeholder="Tag label (e.g. My Tag)"
                value={rfidLabel}
                onChange={e => setRfidLabel(e.target.value)}
                style={{ padding: '10px 14px', flex: 1 }}
              />
              <button
                className="btn-gold"
                onClick={startRfidScan}
                style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}
              >
                + Add Tag
              </button>
            </div>
          )}
        </Section>

        {/* Delete account */}
        <Section title="Danger Zone">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{
                background: 'rgba(229,115,115,0.08)',
                border: '1px solid rgba(229,115,115,0.3)',
                borderRadius: 'var(--radius-sm)',
                color: '#e57373',
                padding: '10px 20px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontFamily: 'var(--font-body)',
                transition: 'all var(--transition)',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(229,115,115,0.15)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(229,115,115,0.08)'}
            >
              Delete Account
            </button>
          ) : (
            <div style={{
              padding: 16,
              background: 'rgba(229,115,115,0.06)',
              border: '1px solid rgba(229,115,115,0.3)',
              borderRadius: 'var(--radius-sm)',
            }}>
              <p style={{ color: '#e57373', fontSize: '0.875rem', marginBottom: 14 }}>
                Are you sure? This will permanently delete your account and all your data.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={handleDeleteAccount}
                  style={{
                    background: '#e57373',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    color: 'white',
                    padding: '9px 18px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  Yes, delete
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => setConfirmDelete(false)}
                  style={{ padding: '9px 18px', fontSize: '0.875rem' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children, onOpen }: { title: string; children: React.ReactNode; onOpen?: () => void }) {
  return (
    <div
      className="animate-fade-up"
      style={{ marginBottom: 28 }}
      onMouseEnter={onOpen}
    >
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1rem',
        color: 'var(--parchment)',
        marginBottom: 14,
        paddingBottom: 8,
        borderBottom: '1px solid var(--border-soft)',
      }}>
        {title}
      </h2>
      {children}
    </div>
  )
}
