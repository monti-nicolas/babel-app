interface Props {
  value: string
  onChange: (id: string) => void
}

export const AVATARS = [
  { id: 'avatar_1',  emoji: '🦊', label: 'Fox' },
  { id: 'avatar_2',  emoji: '🐱', label: 'Cat' },
  { id: 'avatar_3',  emoji: '🐺', label: 'Wolf' },
  { id: 'avatar_4',  emoji: '🦉', label: 'Owl' },
  { id: 'avatar_5',  emoji: '🐉', label: 'Dragon' },
  { id: 'avatar_6',  emoji: '🐝', label: 'Bee' },
  { id: 'avatar_7',  emoji: '🦅', label: 'Falcon' },
  { id: 'avatar_8',  emoji: '🦁', label: 'Lion' },
  { id: 'avatar_9',  emoji: '🐭', label: 'Mouse' },
  { id: 'avatar_10', emoji: '🐣', label: 'Hatchling' },
]

export default function AvatarPicker({ value, onChange }: Props) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      {AVATARS.map(a => (
        <button
          key={a.id}
          onClick={() => onChange(a.id)}
          title={a.label}
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            border: '2px solid',
            borderColor: value === a.id ? 'var(--parchment)' : 'var(--border)',
            background: value === a.id ? 'var(--glow)' : 'var(--ink-muted)',
            fontSize: '1.6rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 150ms ease',
            boxShadow: value === a.id ? '0 0 12px var(--glow)' : 'none',
            transform: value === a.id ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          {a.emoji}
        </button>
      ))}
    </div>
  )
}
