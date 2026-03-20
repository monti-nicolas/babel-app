import { useEffect, useState, useRef } from 'react'
import Navbar from '../components/Navbar'
import api from '../services/api'
import mapBg from '../assets/badge-map.png'

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

// ─── Circle positions measured by computer vision on the 2000×1090 source image
// x = % of image width, y = % of image height
const BADGE_POSITIONS: Record<number, { x: number; y: number }> = {
   1: { x: 21.7, y: 72.0 },  // The Awakening    — bottom left
   2: { x: 26.3, y: 46.6 },  // Hidden Cove      — mid left
   3: { x: 37.1, y: 33.0 },  // Whispering Woods — nudged right (+4.3)
   4: { x: 33.8, y: 60.7 },  // Mount Doom       — nudged left  (-4.3)
   5: { x: 44.8, y: 60.0 },  // Skull Rock       — lower centre
   6: { x: 57.4, y: 36.4 },  // Forbidden Swamp  — upper centre-right
   7: { x: 69.9, y: 27.6 },  // Ogre's Den       — nudged right (+4.3)
   8: { x: 66.0, y: 62.2 },  // Serpent's Ridge  — lower right
   9: { x: 75.3, y: 44.5 },  // Ruined Temple    — nudged left  (-4.3)
  10: { x: 80.9, y: 73.5 },  // The Crown Chamber— bottom right
}

// Radius of each badge circle as % of image width
const CIRCLE_RADIUS_PCT = 4.3

// ─── Types ────────────────────────────────────────────────────────────────────
interface BadgeJourneyItem {
  id: string
  level: number
  name: string
  animal: string
  emoji: string
  pointsRequired: number
  description: string
  tagline: string
  earned: boolean
  earnedAt: string | null
  isCurrent: boolean
  booksNeeded: number
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────
function BadgeTooltip({
  badge,
  anchorX,
  anchorY,
  containerW,
  containerH,
}: {
  badge: BadgeJourneyItem
  anchorX: number   // % of container width
  anchorY: number   // % of container height
  containerW: number
  containerH: number
}) {
  const TIP_W = 230
  const TIP_H = 210

  const anchorPxX = (anchorX / 100) * containerW
  const anchorPxY = (anchorY / 100) * containerH

  const showAbove = anchorPxY > TIP_H + 20

  const left = Math.max(8, Math.min(anchorPxX - TIP_W / 2, containerW - TIP_W - 8))
  const top  = showAbove ? anchorPxY - TIP_H - 12 : anchorPxY + 12

  return (
    <div style={{
      position: 'absolute',
      left,
      top,
      width: TIP_W,
      background: 'rgba(12, 9, 4, 0.96)',
      border: '1px solid rgba(201,169,110,0.45)',
      borderRadius: 10,
      padding: '14px 16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.8), 0 0 0 1px rgba(201,169,110,0.1)',
      animation: 'fadeIn 0.12s ease both',
      pointerEvents: 'none',
      zIndex: 300,
      userSelect: 'none',
    }}>
      {/* Badge image + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <img
          src={BADGE_IMAGES[badge.level]}
          alt={badge.name}
          style={{
            width: 40,
            height: 40,
            objectFit: 'contain',
            flexShrink: 0,
            filter: badge.earned ? 'none' : 'grayscale(1) opacity(0.4)',
          }}
        />
        <div>
          <div style={{
            color: badge.isCurrent
              ? 'rgba(201,169,110,1)'
              : badge.earned
                ? 'rgba(220,200,160,0.95)'
                : 'rgba(160,145,120,0.7)',
            fontWeight: 700,
            fontSize: '0.9rem',
            lineHeight: 1.2,
          }}>
            {badge.name}
          </div>
          <div style={{ color: 'rgba(150,135,110,0.6)', fontSize: '0.7rem', marginTop: 2 }}>
            Level {badge.level}
          </div>
        </div>
      </div>

      {/* Description */}
      <div style={{
        color: 'rgba(190,175,150,0.75)',
        fontSize: '0.75rem',
        lineHeight: 1.5,
        marginBottom: 9,
      }}>
        {badge.description}
      </div>

      {/* Tagline */}
      <div style={{
        fontStyle: 'italic',
        color: 'rgba(201,169,110,0.55)',
        fontSize: '0.72rem',
        fontFamily: 'var(--font-display)',
        borderTop: '1px solid rgba(201,169,110,0.15)',
        paddingTop: 8,
        marginBottom: 9,
        lineHeight: 1.45,
      }}>
        "{badge.tagline}"
      </div>

      {/* Status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        color: badge.earned ? 'rgba(130,190,130,0.8)' : 'rgba(160,145,120,0.6)',
        fontSize: '0.7rem',
      }}>
        <span>{badge.earned ? '✓' : '○'}</span>
        <span>
          {badge.earned
            ? `Earned${badge.earnedAt
                ? ` · ${new Date(badge.earnedAt).toLocaleDateString('en-AU')}`
                : ''}`
            : `${badge.pointsRequired} pts required · ~${badge.booksNeeded} books`}
        </span>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function BadgeJourney() {
  const [journey, setJourney]           = useState<BadgeJourneyItem[]>([])
  const [totalPoints, setTotalPoints]   = useState(0)
  const [loading, setLoading]           = useState(true)
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ w: 800, h: 436 })

  // Track rendered size for accurate tooltip clamping
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setContainerSize({ w: width, h: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    api.get('/users/badges')
      .then(res => {
        setJourney(res.data.journey)
        setTotalPoints(res.data.totalPoints)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const hoveredBadge = hoveredLevel !== null
    ? journey.find(b => b.level === hoveredLevel) ?? null
    : null

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '36px 24px 80px' }}>

        {/* Header */}
        <div className="animate-fade-up" style={{ marginBottom: 24 }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2rem',
            color: 'var(--white)',
            marginBottom: 6,
          }}>
            Badge Journey
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>
            {totalPoints} points accumulated · Hover over a badge to see details
          </p>
        </div>

        {loading && (
          <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: 60 }}>
            Loading...
          </div>
        )}

        {!loading && journey.length > 0 && (
          <div
            className="animate-fade-up delay-100"
            ref={containerRef}
            style={{
              position: 'relative',
              width: '100%',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
              userSelect: 'none',
            }}
          >
            {/* ── Map background image ───────────────────────────────── */}
            <img
              src={mapBg}
              alt="Badge Journey Map"
              draggable={false}
              style={{
                display: 'block',
                width: '100%',
                height: 'auto',
                pointerEvents: 'none',
              }}
            />

            {/* ── Badge overlays ─────────────────────────────────────── */}
            {journey.map(badge => {
              const pos = BADGE_POSITIONS[badge.level]
              if (!pos) return null

              const isHovered     = hoveredLevel === badge.level
              const circleSizePct = CIRCLE_RADIUS_PCT * 2
              const offsetPct     = CIRCLE_RADIUS_PCT

              return (
                <div
                  key={badge.id}
                  onMouseEnter={() => setHoveredLevel(badge.level)}
                  onMouseLeave={() => setHoveredLevel(null)}
                  style={{
                    position: 'absolute',
                    left:      `${pos.x - offsetPct}%`,
                    top:       `${pos.y}%`,
                    width:     `${circleSizePct}%`,
                    aspectRatio: '1 / 1',
                    // Centre vertically — height equals width (square), so translateY(-50%)
                    // corrects for the fact that `top` % is relative to container height
                    // while width % is relative to container width.
                    transform: 'translateY(-50%)',
                    cursor:    'pointer',
                    zIndex:    isHovered ? 200 : badge.isCurrent ? 100 : 10,
                  }}
                >
                  {/* Badge PNG fills the black circle on the map */}
                  <img
                    src={BADGE_IMAGES[badge.level]}
                    alt={badge.name}
                    draggable={false}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      borderRadius: '50%',
                      display: 'block',
                      filter: badge.earned
                        ? isHovered
                          ? 'brightness(1.3) drop-shadow(0 0 10px rgba(201,169,110,0.9))'
                          : badge.isCurrent
                            ? 'brightness(1.1) drop-shadow(0 0 6px rgba(201,169,110,0.55))'
                            : 'brightness(1.0)'
                        : 'grayscale(1) brightness(0.3)',
                      transition: 'filter 200ms ease, transform 200ms ease',
                      transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                    }}
                  />

                  {/* Pulsing ring — current badge */}
                  {badge.isCurrent && (
                    <div style={{
                      position: 'absolute',
                      inset: '-8%',
                      borderRadius: '50%',
                      border: '2px solid rgba(201,169,110,0.6)',
                      animation: 'pulse-ring 2.2s ease-in-out infinite',
                      pointerEvents: 'none',
                    }} />
                  )}

                  {/* Hover ring */}
                  {isHovered && (
                    <div style={{
                      position: 'absolute',
                      inset: '-5%',
                      borderRadius: '50%',
                      border: '2px solid rgba(201,169,110,0.85)',
                      pointerEvents: 'none',
                    }} />
                  )}

                  {/* "You are here" pill */}
                  {badge.isCurrent && (
                    <div style={{
                      position: 'absolute',
                      bottom: '110%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      whiteSpace: 'nowrap',
                      background: 'rgba(10,7,3,0.9)',
                      border: '1px solid rgba(201,169,110,0.55)',
                      borderRadius: 20,
                      padding: '3px 10px',
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      color: 'rgba(201,169,110,0.95)',
                      letterSpacing: '0.05em',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.7)',
                      pointerEvents: 'none',
                    }}>
                      ✦ You are here
                    </div>
                  )}
                </div>
              )
            })}

            {/* ── Tooltip ────────────────────────────────────────────── */}
            {hoveredBadge && hoveredLevel !== null && BADGE_POSITIONS[hoveredLevel] && (
              <BadgeTooltip
                badge={hoveredBadge}
                anchorX={BADGE_POSITIONS[hoveredLevel].x}
                anchorY={BADGE_POSITIONS[hoveredLevel].y}
                containerW={containerSize.w}
                containerH={containerSize.h}
              />
            )}
          </div>
        )}

        {/* Legend */}
        {!loading && journey.length > 0 && (
          <div className="animate-fade-up delay-200" style={{
            display: 'flex',
            gap: 24,
            marginTop: 20,
            flexWrap: 'wrap',
          }}>
            {[
              { color: 'rgba(201,169,110,0.9)', label: 'Current badge' },
              { color: 'rgba(201,169,110,0.4)', label: 'Earned' },
              { color: 'rgba(100,90,75,0.4)',   label: 'Not yet earned' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{
                  width: 9, height: 9, borderRadius: '50%',
                  background: item.color,
                  border: '1px solid rgba(201,169,110,0.2)',
                }} />
                <span style={{ color: 'rgba(180,165,140,0.55)', fontSize: '0.75rem' }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Keyframe for pulsing ring */}
      <style>{`
        @keyframes pulse-ring {
          0%   { opacity: 0.7; transform: scale(1); }
          50%  { opacity: 0.25; transform: scale(1.1); }
          100% { opacity: 0.7; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
