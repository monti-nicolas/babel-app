import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import api from '../services/api'
import { AVATARS } from '../components/AvatarPicker'

// ─── Badge PNG imports ────────────────────────────────────────────────────────
import badge1  from '../assets/badges/badge_1.png'
import badge2  from '../assets/badges/badge_2.png'
import badge3  from '../assets/badges/badge_3.png'
import badge4  from '../assets/badges/badge_4.png'
import badge5  from '../assets/badges/badge_5.png'
import badge6  from '../assets/badges/badge_6.png'
import badge7  from '../assets/badges/badge_7.png'
import badge8  from '../assets/badges/badge_8.png'
import badge9  from '../assets/badges/badge_9.png'
import badge10 from '../assets/badges/badge_10.png'

const BADGE_IMAGES: Record<number, string> = {
  1: badge1,  2: badge2,  3: badge3,  4: badge4,  5: badge5,
  6: badge6,  7: badge7,  8: badge8,  9: badge9,  10: badge10,
}

interface Stats {
  totalBooks: number
  totalPoints: number
  currentBadge: { name: string; emoji: string; level: number }
  nextBadge: { name: string; emoji: string; pointsRequired: number } | null
  pointsToNext: number | null
  recentBooks: { id: string; title: string; author: string; coverUrl: string | null; registeredAt: string }[]
  recentReviews: { id: string; bookTitle: string; bookAuthor: string; content: string; rating: number; bookCoverUrl: string | null }[]
}

const STAR = '★'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const avatar = AVATARS.find(a => a.id === (user?.avatarId || 'avatar_1'))

  useEffect(() => {
    api.get('/users/stats')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>

        {/* Hero greeting */}
        <div className="animate-fade-up" style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--ink-soft)',
              border: '2px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
            }}>
              {avatar?.emoji || '📚'}
            </div>
            <div>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: 2 }}>
                Welcome back
              </p>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2rem',
                fontWeight: 700,
                color: 'var(--white)',
                lineHeight: 1.1,
              }}>
                {user?.username}
              </h1>
            </div>
          </div>
          <p style={{ color: 'var(--parchment)', fontSize: '0.9rem', fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>
            Ready to register another book?
          </p>
        </div>

        {/* Stats row */}
        {stats && (
          <div className="animate-fade-up delay-100" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16,
            marginBottom: 40,
          }}>
            {/* Current badge */}
            <div className="card" style={{ padding: 20, textAlign: 'center' }}>
              <img src={BADGE_IMAGES[stats.currentBadge.level]} alt={stats.currentBadge.name} style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: '50%', marginBottom: 6, display: 'block', margin: '0 auto 6px' }} />
              <div style={{ color: 'var(--parchment)', fontWeight: 600, fontSize: '0.9rem' }}>
                {stats.currentBadge.name}
              </div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: 2 }}>Current Badge</div>
            </div>

            {/* Books read */}
            <div className="card" style={{ padding: 20, textAlign: 'center' }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '5.2rem',
                fontWeight: 700,
                color: 'var(--parchment)',
                lineHeight: 1,
                marginBottom: 6,
              }}>
                {stats.totalBooks}
              </div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Books Registered</div>
            </div>

            {/* Points */}
            <div className="card" style={{ padding: 20, textAlign: 'center' }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '5.2rem',
                fontWeight: 700,
                color: 'var(--parchment)',
                lineHeight: 1,
                marginBottom: 6,
              }}>
                {stats.totalPoints}
              </div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Total Points</div>
              {stats.pointsToNext !== null && (
                <div style={{ color: 'var(--parchment-dim)', fontSize: '0.7rem', marginTop: 4 }}>
                  {stats.pointsToNext} pts to {stats.nextBadge?.emoji} {stats.nextBadge?.name}
                </div>
              )}
            </div>
          </div>
        )}

        {loading && (
          <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: 40 }}>Loading...</div>
        )}

        {/* Recent books */}
        {stats && stats.recentBooks.length > 0 && (
          <div className="animate-fade-up delay-200" style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--white)' }}>
                Recently Read
              </h2>
              <button
                onClick={() => navigate('/history')}
                style={{ background: 'none', border: 'none', color: 'var(--parchment)', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                View all →
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
              {stats.recentBooks.map(book => (
                <div key={book.id} className="card" style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{
                    width: 36,
                    height: 50,
                    borderRadius: 4,
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: 'var(--ink-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {book.coverUrl
                      ? <img src={book.coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span>📖</span>
                    }
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      color: 'var(--white)',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {book.title}
                    </div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.775rem', marginTop: 2 }}>{book.author}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent reviews */}
        {stats && stats.recentReviews.length > 0 && (
          <div className="animate-fade-up delay-300">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--white)' }}>
                Recent Reviews
              </h2>
              <button
                onClick={() => navigate('/reviews')}
                style={{ background: 'none', border: 'none', color: 'var(--parchment)', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                View all →
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stats.recentReviews.map(review => (
                <div key={review.id} className="card" style={{ padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ color: 'var(--white)', fontWeight: 500, fontSize: '0.9rem' }}>{review.bookTitle}</div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.775rem' }}>{review.bookAuthor}</div>
                    </div>
                    <div style={{ color: 'var(--parchment)', fontSize: '0.85rem' }}>
                      {STAR.repeat(review.rating)}
                    </div>
                  </div>
                  <p style={{
                    color: 'var(--ash-soft)',
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {review.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {stats && stats.totalBooks === 0 && (
          <div className="card animate-fade-up delay-200" style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>📖</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--white)', marginBottom: 8 }}>
              Your library is empty
            </h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: 24 }}>
              Register your first book to start your reading journey
            </p>
            <button
              className="btn-gold"
              onClick={() => navigate('/register-book')}
              style={{ padding: '12px 28px' }}
            >
              Register a book
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
