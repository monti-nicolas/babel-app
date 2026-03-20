import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import Navbar from '../components/Navbar'
import api from '../services/api'

interface Book {
  id: string
  title: string
  author: string
  coverUrl: string | null
  pageCount: number | null
  genre: string | null
  registeredAt: string
  pointsEarned: number
}

function getMonthlyData(books: Book[]) {
  const map = new Map<string, number>()

  books.forEach(b => {
    const d = new Date(b.registeredAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    map.set(key, (map.get(key) || 0) + 1)
  })

  // Get last 6 months
  const months: { month: string; books: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleString('default', { month: 'short' })
    months.push({ month: label, books: map.get(key) || 0 })
  }

  return months
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--ink-soft)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: '8px 14px',
        fontSize: '0.85rem',
        color: 'var(--white)',
      }}>
        <span style={{ color: 'var(--parchment)', fontWeight: 600 }}>{payload[0].value} books</span>
        <span style={{ color: 'var(--text-dim)', marginLeft: 6 }}>{label}</span>
      </div>
    )
  }
  return null
}

export default function ReadingHistory() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)

  useEffect(() => {
    api.get('/books')
      .then(res => setBooks(res.data.books))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleRemove = async (id: string) => {
    try {
      await api.delete(`/books/${id}`)
      setBooks(prev => prev.filter(b => b.id !== id))
      setConfirmRemoveId(null)
    } catch (err) {
      console.error('Failed to remove book', err)
    }
  }

  const chartData = getMonthlyData(books)

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px' }}>
        <div className="animate-fade-up" style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--white)', marginBottom: 6 }}>
            Reading History
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>
            {books.length} book{books.length !== 1 ? 's' : ''} registered total
          </p>
        </div>

        {/* Chart */}
        {books.length > 0 && (
          <div className="card animate-fade-up delay-100" style={{ padding: '24px', marginBottom: 32 }}>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1rem',
              color: 'var(--white)',
              marginBottom: 20,
            }}>
              Books per month
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barSize={28}>
                <XAxis
                  dataKey="month"
                  tick={{ fill: 'var(--ash)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--ash)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={24}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(201,169,110,0.06)' }} />
                <Bar dataKey="books" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={_ .books > 0 ? 'var(--parchment)' : 'var(--ink-muted)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Book list */}
        {loading && (
          <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: 40 }}>Loading...</div>
        )}

        {!loading && books.length === 0 && (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📚</div>
            <p style={{ color: 'var(--text-dim)' }}>No books registered yet.</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {books.map((book, i) => (
            <div
              key={book.id}
              className="card animate-fade-up"
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                animationDelay: `${i * 50}ms`,
              }}
            >
              {/* Cover */}
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
                {book.coverUrl
                  ? <img src={book.coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span>📖</span>
                }
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'var(--white)', fontWeight: 500, fontSize: '0.9rem' }}>{book.title}</div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginTop: 2 }}>{book.author}</div>
                {book.genre && (
                  <div style={{
                    display: 'inline-block',
                    marginTop: 5,
                    padding: '2px 8px',
                    background: 'var(--ink-muted)',
                    border: '1px solid var(--border-soft)',
                    borderRadius: 20,
                    color: 'var(--parchment-dim)',
                    fontSize: '0.7rem',
                  }}>
                    {book.genre}
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ color: 'var(--parchment)', fontSize: '0.85rem', fontWeight: 600 }}>
                  +{book.pointsEarned}pts
                </div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: 2 }}>
                  {new Date(book.registeredAt).toLocaleDateString('en-AU', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </div>
                {confirmRemoveId === book.id ? (
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleRemove(book.id)}
                      style={{
                        background: 'rgba(229,115,115,0.15)',
                        border: '1px solid rgba(229,115,115,0.4)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#e57373',
                        fontSize: '0.72rem',
                        padding: '3px 10px',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmRemoveId(null)}
                      style={{
                        background: 'none',
                        border: '1px solid var(--border-soft)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-dim)',
                        fontSize: '0.72rem',
                        padding: '3px 10px',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmRemoveId(book.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-dim)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      marginTop: 6,
                      padding: 0,
                      fontFamily: 'var(--font-body)',
                      transition: 'color var(--transition)',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#e57373'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-dim)'}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
