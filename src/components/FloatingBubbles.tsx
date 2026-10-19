import { useMemo } from 'react'
import { motion } from 'framer-motion'

interface Bubble {
  id: number
  size: number
  x: number        // vw
  startY: number   // vh start (below screen)
  endY: number     // vh end (above screen)
  duration: number
  delay: number
  opacity: number
}

// Seeded pseudo-random so bubbles are stable across renders
function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

function makeBubbles(count: number): Bubble[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    size: 18 + seededRand(i * 7) * 48,         // 18–66 px
    x: 4 + seededRand(i * 13) * 92,            // 4–96 vw
    startY: 108 + seededRand(i * 3) * 30,      // start off-screen bottom
    endY: -20 - seededRand(i * 5) * 30,        // end off-screen top
    duration: 14 + seededRand(i * 11) * 22,    // 14–36 s
    delay: seededRand(i * 17) * -30,            // stagger
    opacity: 0.08 + seededRand(i * 19) * 0.18, // 0.08–0.26
  }))
}

interface Props {
  count?: number
  /** Extra bubbles that burst in during the intro (controlled externally) */
  burstActive?: boolean
}

export function FloatingBubbles({ count = 14, burstActive = false }: Props) {
  const bubbles = useMemo(() => makeBubbles(count), [count])
  const burst = useMemo(() => makeBubbles(10).map((b, i) => ({
    ...b,
    id: i + 100,
    size: 24 + seededRand(i * 31) * 56,
    x: 5 + seededRand(i * 23) * 90,
    duration: 2.4 + seededRand(i * 7) * 1.6,
    delay: seededRand(i * 41) * 0.6,
    opacity: 0.22 + seededRand(i * 11) * 0.22,
  })), [])

  const bubbleStyle = (b: Bubble): React.CSSProperties => ({
    position: 'absolute',
    left: `${b.x}vw`,
    width: b.size,
    height: b.size,
    borderRadius: '50%',
    // soap-bubble look: transparent fill, iridescent rim
    background: `radial-gradient(
      circle at 35% 35%,
      rgba(255,255,255,0.55) 0%,
      rgba(244,114,182,${b.opacity * 0.6}) 30%,
      rgba(244,114,182,${b.opacity}) 60%,
      rgba(255,255,255,0.08) 100%
    )`,
    boxShadow: `inset 0 1px 6px rgba(255,255,255,0.7),
                inset 0 -1px 4px rgba(244,114,182,${b.opacity * 1.5}),
                0 0 ${b.size * 0.4}px rgba(244,114,182,${b.opacity * 0.4})`,
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)',
    pointerEvents: 'none',
  })

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {bubbles.map(b => (
        <motion.div
          key={b.id}
          style={{ ...bubbleStyle(b), bottom: 'auto', top: 'auto' }}
          initial={{ y: `${b.startY}vh`, x: 0 }}
          animate={{
            y: [`${b.startY}vh`, `${b.endY}vh`],
            x: [0, 12, -8, 6, 0],
          }}
          transition={{
            y: {
              duration: b.duration,
              repeat: Infinity,
              ease: 'linear',
              delay: b.delay,
            },
            x: {
              duration: b.duration * 0.6,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: b.delay,
            },
          }}
        />
      ))}

      {/* Burst bubbles — appear on intro */}
      {burstActive && burst.map(b => (
        <motion.div
          key={b.id}
          style={{ ...bubbleStyle(b), top: `${20 + seededRand(b.id) * 60}vh` }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.15, 1], opacity: [0, b.opacity * 2.5, b.opacity] }}
          transition={{ duration: b.duration, delay: b.delay, ease: 'backOut' }}
        />
      ))}
    </div>
  )
}
