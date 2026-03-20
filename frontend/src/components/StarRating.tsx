import { useState } from 'react'

interface Props {
  value: number
  onChange?: (rating: number) => void
  readonly?: boolean
  size?: number
}

export default function StarRating({ value, onChange, readonly = false, size = 24 }: Props) {
  const [hovered, setHovered] = useState(0)

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(star => {
        const filled = star <= (hovered || value)
        return (
          <button
            key={star}
            onClick={() => !readonly && onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            style={{
              background: 'none',
              border: 'none',
              cursor: readonly ? 'default' : 'pointer',
              padding: 0,
              fontSize: size,
              lineHeight: 1,
              transition: 'transform 150ms ease',
              transform: !readonly && hovered >= star ? 'scale(1.2)' : 'scale(1)',
              color: filled ? 'var(--parchment)' : 'var(--ink-muted)',
              filter: filled ? 'none' : 'none',
            }}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
          >
            {filled ? '★' : '☆'}
          </button>
        )
      })}
    </div>
  )
}
