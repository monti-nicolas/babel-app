import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import BookSearchModal, { BookResult } from '../components/BookSearchModal'
import ConfettiOverlay from '../components/ConfettiOverlay'
import api from '../services/api'

interface PointsInfo {
  basePoints: number
  bonusPoints: number
  totalPoints: number
  descriptions: string[]
}

interface BadgeInfo {
  newBadge: { name: string; emoji: string } | null
  currentBadge: { name: string; emoji: string }
  totalPoints: number
}

export default function RegisterBook() {
  const navigate = useNavigate()
  const [showSearch, setShowSearch] = useState(false)
  const [selected, setSelected] = useState<BookResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ points: PointsInfo; badge: BadgeInfo } | null>(null)
  const [confetti, setConfetti] = useState(false)

  const handleSelect = (book: BookResult) => {
    setSelected(book)
    setShowSearch(false)
    setError('')
  }

  const handleSubmit = async () => {
    if (!selected) { setError('Please select a book first'); return }
    setLoading(true); setError('')
    try {
      const res = await api.post('/books', {
        title: selected.title,
        author: selected.author,
        coverUrl: selected.coverUrl,
        pageCount: selected.pageCount,
        genre: selected.genre,
        openLibraryKey: selected.key,
      })
      setResult({ points: res.data.points, badge: res.data.badge })
      if (res.data.badge.newBadge) setConfetti(true)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to register book')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setSelected(null)
    setResult(null)
    setConfetti(false)
    setError('')
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <ConfettiOverlay trigger={confetti} />

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 24px' }}>
        <div className="animate-fade-up">
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2rem',
            color: 'var(--white)',
            marginBottom: 6,
          }}>
            Register a Book
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', marginBottom: 32 }}>
            Search for a book you've read and add it to your library
          </p>
        </div>

        {/* Success result */}
        {result ? (
          <div className="card animate-fade-up" style={{ padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>
              {result.badge.newBadge ? result.badge.newBadge.emoji : '✅'}
            </div>

            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              color: 'var(--white)',
              marginBottom: 6,
            }}>
              {result.badge.newBadge
                ? `New badge: ${result.badge.newBadge.name}!`
                : `"${selected?.title}" registered!`
              }
            </h2>

            {/* Points breakdown */}
            <div style={{
              background: 'var(--ink-muted)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '16px 20px',
              margin: '20px 0',
              textAlign: 'left',
            }}>
              <div style={{
                color: 'var(--parchment)',
                fontWeight: 600,
                fontSize: '1rem',
                marginBottom: 8,
              }}>
                Total +{result.points.totalPoints}pts
              </div>
              {result.points.descriptions.map((d, i) => (
                <div key={i} style={{
                  color: 'var(--ash-soft)',
                  fontSize: '0.85rem',
                  marginTop: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <span style={{ color: 'var(--parchment)' }}>+</span>
                  {d}
                </div>
              ))}
            </div>

            {result.badge.newBadge && (
              <div style={{
                color: 'var(--parchment)',
                fontSize: '0.9rem',
                marginBottom: 16,
                fontStyle: 'italic',
                fontFamily: 'var(--font-display)',
              }}>
                🎉 You've reached {result.badge.newBadge.emoji} {result.badge.newBadge.name}!
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn-gold" onClick={reset} style={{ padding: '11px 24px' }}>
                Register another
              </button>
              <button className="btn-ghost" onClick={() => navigate('/dashboard')} style={{ padding: '11px 24px' }}>
                Back to home
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-fade-up delay-100">
            {/* Selected book preview */}
            {selected ? (
              <div className="card" style={{ padding: 20, marginBottom: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{
                  width: 48,
                  height: 68,
                  borderRadius: 6,
                  overflow: 'hidden',
                  flexShrink: 0,
                  background: 'var(--ink-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {selected.coverUrl
                    ? <img src={selected.coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: '1.4rem' }}>📖</span>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'var(--white)', fontWeight: 600, fontSize: '0.95rem' }}>{selected.title}</div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.825rem', marginTop: 3 }}>{selected.author}</div>
                  {selected.pageCount && (
                    <div style={{ color: 'var(--parchment-dim)', fontSize: '0.775rem', marginTop: 3 }}>
                      {selected.pageCount} pages
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSelected(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    padding: 4,
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className="card"
                style={{
                  width: '100%',
                  padding: 24,
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  cursor: 'pointer',
                  border: '1px dashed var(--border)',
                  background: 'none',
                  color: 'var(--text-dim)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9rem',
                  transition: 'all var(--transition)',
                }}
                onMouseEnter={e => {
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--parchment)'
                  ;(e.currentTarget as HTMLElement).style.color = 'var(--parchment)'
                }}
                onMouseLeave={e => {
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
                  ;(e.currentTarget as HTMLElement).style.color = 'var(--text-dim)'
                }}
              >
                <span style={{ fontSize: '1.4rem' }}>🔍</span>
                <span>Search for a book...</span>
              </button>
            )}

            {selected && (
              <button
                onClick={() => setShowSearch(true)}
                className="btn-ghost"
                style={{ width: '100%', padding: '10px', marginBottom: 16, fontSize: '0.85rem' }}
              >
                Search for a different book
              </button>
            )}

            {error && (
              <div style={{
                padding: '10px 14px',
                background: 'rgba(229,115,115,0.1)',
                border: '1px solid rgba(229,115,115,0.3)',
                borderRadius: 'var(--radius-sm)',
                color: '#e57373',
                fontSize: '0.85rem',
                marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            <button
              className="btn-gold"
              onClick={handleSubmit}
              disabled={!selected || loading}
              style={{ width: '100%', padding: '13px', opacity: (!selected || loading) ? 0.5 : 1 }}
            >
              {loading ? 'Registering...' : 'Register Book'}
            </button>
          </div>
        )}
      </div>

      {showSearch && (
        <BookSearchModal onSelect={handleSelect} onClose={() => setShowSearch(false)} />
      )}
    </div>
  )
}
