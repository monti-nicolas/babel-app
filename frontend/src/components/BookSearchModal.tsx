import { useState, useEffect, useRef } from 'react'
import api from '../services/api'

export interface BookResult {
  key: string
  title: string
  author: string
  coverUrl: string | null
  pageCount: number | null
  genre: string | null
}

interface Props {
  onSelect: (book: BookResult) => void
  onClose: () => void
}

export default function BookSearchModal({ onSelect, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<BookResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.trim().length < 2) {
      setResults([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const res = await api.get(`/books/search?q=${encodeURIComponent(query)}`)
        setResults(res.data.books)
      } catch {
        setError('Search failed. Please try again.')
      } finally {
        setLoading(false)
      }
    }, 400)
  }, [query])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--ink-soft)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: 560,
          maxHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeUp 0.2s ease both',
        }}
      >
        {/* Search input */}
        <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid var(--border-soft)' }}>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '1rem',
              pointerEvents: 'none',
            }}>🔍</span>
            <input
              ref={inputRef}
              className="input"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by title..."
              style={{ paddingLeft: 40, paddingRight: 16, paddingTop: 12, paddingBottom: 12 }}
            />
          </div>
        </div>

        {/* Results */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-dim)' }}>
              Searching...
            </div>
          )}

          {error && (
            <div style={{ padding: 32, textAlign: 'center', color: '#e57373' }}>{error}</div>
          )}

          {!loading && !error && results.length === 0 && query.length >= 2 && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-dim)' }}>
              No books found for "{query}"
            </div>
          )}

          {!loading && results.map(book => (
            <button
              key={book.key}
              onClick={() => onSelect(book)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 20px',
                width: '100%',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid var(--border-soft)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background var(--transition)',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--glow)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
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
                  : <span style={{ fontSize: '1.2rem' }}>📖</span>
                }
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{
                  color: 'var(--white)',
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {book.title}
                </div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginTop: 2 }}>
                  {book.author}
                  {book.pageCount && <span style={{ marginLeft: 8, opacity: 0.6 }}>{book.pageCount} pages</span>}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-soft)' }}>
          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ width: '100%', padding: '10px' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
