import { useEffect } from 'react'
import confetti from 'canvas-confetti'

interface Props {
  trigger: boolean
  onDone?: () => void
}

export default function ConfettiOverlay({ trigger, onDone }: Props) {
  useEffect(() => {
    if (!trigger) return

    const duration = 3000
    const end = Date.now() + duration

    const colors = ['#c9a96e', '#e8c98a', '#f0ede8', '#7a6240', '#ffffff']

    const frame = () => {
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      })
      confetti({
        particleCount: 6,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      } else {
        onDone?.()
      }
    }

    frame()
  }, [trigger])

  return null
}
