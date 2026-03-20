interface Props {
  value: string
  onChange: (id: string) => void
}

export const BACKGROUNDS = [
  { id: 'bg_library', label: 'The Library', colors: ['transparent', 'transparent'] },
  { id: 'bg_dark',   label: 'Midnight',  colors: ['#0d0f14', '#161921'] },
  { id: 'bg_ocean',  label: 'Deep Ocean',colors: ['#091420', '#0d2035'] },
  { id: 'bg_forest', label: 'Forest',    colors: ['#0a1410', '#0f1f18'] },
  { id: 'bg_sunset', label: 'Ember',     colors: ['#1a0f0a', '#2a1510'] },
  { id: 'bg_space',  label: 'Cosmos',    colors: ['#08080f', '#10101a'] },
  { id: 'bg_wine',   label: 'Velvet',    colors: ['#14080f', '#1e0c18'] },
]

export default function BackgroundPicker({ value, onChange }: Props) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      {BACKGROUNDS.map(bg => (
        <button
          key={bg.id}
          onClick={() => onChange(bg.id)}
          title={bg.label}
          style={{
            width: 64,
            height: 40,
            borderRadius: 'var(--radius-sm)',
            border: '2px solid',
            borderColor: value === bg.id ? 'var(--parchment)' : 'var(--border)',
            background: `linear-gradient(135deg, ${bg.colors[0]}, ${bg.colors[1]})`,
            cursor: 'pointer',
            position: 'relative',
            transition: 'all 150ms ease',
            boxShadow: value === bg.id ? '0 0 12px var(--glow)' : 'none',
            overflow: 'hidden',
          }}
        >
          {value === bg.id && (
            <span style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem',
              color: 'var(--parchment)',
            }}>✓</span>
          )}
          <span style={{
            position: 'absolute',
            bottom: 2,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: '0.55rem',
            color: 'rgba(240,237,232,0.6)',
            fontFamily: 'var(--font-body)',
          }}>
            {bg.label}
          </span>
        </button>
      ))}
    </div>
  )
}
