import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import StarRating from '../components/StarRating'
import api from '../services/api'

interface Review {
  id: string
  bookId: string
  bookTitle: string
  bookAuthor: string
  bookCoverUrl: string | null
  content: string
  rating: number
  createdAt: string
  updatedAt: string
}

interface Book {
  id: string
  title: string
  author: string
}

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // New review form
  const [selectedBookId, setSelectedBookId] = useState('')
  const [content, setContent] = useState('')
  const [rating, setRating] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Edit form
  const [editContent, setEditContent] = useState('')
  const [editRating, setEditRating] = useState(0)

  useEffect(() => {
    Promise.all([api.get('/reviews'), api.get('/books')])
      .then(([r, b]) => {
        setReviews(r.data.reviews)
        // Filter to books that don't have a review yet
        const reviewedIds = new Set(r.data.reviews.map((rv: Review) => rv.bookId))
        setBooks(b.data.books.filter((bk: Book) => !reviewedIds.has(bk.id)))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    if (!selectedBookId || !content || !rating) { setError('Please fill in all fields and choose a rating'); return }
    setSaving(true); setError('')
    try {
      await api.post('/reviews', { bookId: selectedBookId, content, rating })
      // Refresh
      const [r, b] = await Promise.all([api.get('/reviews'), api.get('/books')])
      setReviews(r.data.reviews)
      const reviewedIds = new Set(r.data.reviews.map((rv: Review) => rv.bookId))
      setBooks(b.data.books.filter((bk: Book) => !reviewedIds.has(bk.id)))
      setShowNew(false); setSelectedBookId(''); setContent(''); setRating(0)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save review')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (id: string) => {
    if (!editContent || !editRating) return
    setSaving(true)
    try {
      await api.put(`/reviews/${id}`, { content: editContent, rating: editRating })
      setReviews(prev => prev.map(r => r.id === id ? { ...r, content: editContent, rating: editRating } : r))
      setEditId(null)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update review')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (review: Review) => {
    setEditId(review.id)
    setEditContent(review.content)
    setEditRating(review.rating)
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/reviews/${id}`)
      setReviews(prev => prev.filter(r => r.id !== id))
      // Make the book available to review again
      const b = await api.get('/books')
      const reviewedIds = new Set(reviews.filter(r => r.id !== id).map(r => r.bookId))
      setBooks(b.data.books.filter((bk: Book) => !reviewedIds.has(bk.id)))
      setConfirmDeleteId(null)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete review')
    }
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px' }}>
        <div className="animate-fade-up" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 32,
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--white)', marginBottom: 6 }}>
              Reviews
            </h1>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>
              {reviews.length} review{reviews.length !== 1 ? 's' : ''}
            </p>
          </div>
          {books.length > 0 && (
            <button
              className="btn-gold"
              onClick={() => setShowNew(v => !v)}
              style={{ padding: '10px 20px' }}
            >
              ✍️ Write a review
            </button>
          )}
        </div>

        {/* New review form */}
        {showNew && (
          <div className="card animate-fade-up" style={{ padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--white)', marginBottom: 16 }}>
              New Review
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <select
                className="input"
                value={selectedBookId}
                onChange={e => setSelectedBookId(e.target.value)}
                style={{ padding: '11px 14px', background: 'var(--ink-muted)', color: selectedBookId ? 'var(--white)' : 'var(--text-dim)' }}
              >
                <option value="">Select a book...</option>
                {books.map(b => (
                  <option key={b.id} value={b.id}>{b.title} — {b.author}</option>
                ))}
              </select>

              <div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginBottom: 8 }}>Rating</div>
                <StarRating value={rating} onChange={setRating} size={28} />
              </div>

              <textarea
                className="input"
                placeholder="Write your review..."
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={4}
                style={{ padding: '12px 14px', resize: 'vertical', lineHeight: 1.6 }}
              />

              {error && (
                <div style={{
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

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn-gold"
                  onClick={handleCreate}
                  disabled={saving}
                  style={{ padding: '10px 24px', opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? 'Saving...' : 'Save Review'}
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => { setShowNew(false); setError('') }}
                  style={{ padding: '10px 20px' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: 60 }}>Loading...</div>
        )}

        {!loading && reviews.length === 0 && !showNew && (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✍️</div>
            <p style={{ color: 'var(--text-dim)' }}>
              {books.length === 0
                ? 'Register some books first before writing reviews.'
                : 'No reviews yet. Write your first one!'}
            </p>
          </div>
        )}

        {/* Reviews list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {reviews.map((review, i) => (
            <div
              key={review.id}
              className="card animate-fade-up"
              style={{ padding: 22, animationDelay: `${i * 50}ms` }}
            >
              {/* Header */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{
                  width: 40,
                  height: 56,
                  borderRadius: 4,
                  overflow: 'hidden',
                  flexShrink: 0,
                  background: 'var(--ink-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {review.bookCoverUrl
                    ? <img src={review.bookCoverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span>📖</span>
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'var(--white)', fontWeight: 600, fontSize: '0.95rem' }}>{review.bookTitle}</div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginTop: 2 }}>{review.bookAuthor}</div>
                  <div style={{ marginTop: 6 }}>
                    <StarRating value={review.rating} readonly size={16} />
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                    {new Date(review.updatedAt).toLocaleDateString('en-AU', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 6 }}>
                    <button
                      onClick={() => startEdit(review)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--parchment-dim)',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        padding: 0,
                        fontFamily: 'var(--font-body)',
                        transition: 'color var(--transition)',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--parchment)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--parchment-dim)'}
                    >
                      Edit
                    </button>
                    {confirmDeleteId === review.id ? (
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button
                          onClick={() => handleDelete(review.id)}
                          style={{
                            background: 'rgba(229,115,115,0.15)',
                            border: '1px solid rgba(229,115,115,0.4)',
                            borderRadius: 'var(--radius-sm)',
                            color: '#e57373',
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-body)',
                          }}
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          style={{
                            background: 'none',
                            border: '1px solid var(--border-soft)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--text-dim)',
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-body)',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(review.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-dim)',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          padding: 0,
                          fontFamily: 'var(--font-body)',
                          transition: 'color var(--transition)',
                        }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#e57373'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-dim)'}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Edit mode */}
              {editId === review.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginBottom: 8 }}>Rating</div>
                    <StarRating value={editRating} onChange={setEditRating} size={24} />
                  </div>
                  <textarea
                    className="input"
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    rows={4}
                    style={{ padding: '12px 14px', resize: 'vertical', lineHeight: 1.6 }}
                  />
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      className="btn-gold"
                      onClick={() => handleEdit(review.id)}
                      disabled={saving}
                      style={{ padding: '9px 20px', fontSize: '0.875rem', opacity: saving ? 0.7 : 1 }}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      className="btn-ghost"
                      onClick={() => setEditId(null)}
                      style={{ padding: '9px 16px', fontSize: '0.875rem' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{
                  color: 'var(--ash-soft)',
                  fontSize: '0.875rem',
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                }}>
                  {review.content}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
