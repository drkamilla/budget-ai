import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

/**
 * Cinematic pink splash intro — pure CSS for the background so there are no
 * Framer Motion gradient-interpolation issues.
 *
 * Timeline:
 *  0 ms      — deep-pink screen (CSS, instant)
 *  80 ms     — logo bounces in
 *  900 ms    — tagline fades in
 *  1700 ms   — overlay transitions to white via CSS (700 ms)
 *  2400 ms   — onDone() fires → app becomes visible behind
 *  2700 ms   — overlay unmounts
 */

interface Props { onDone: () => void }

export function IntroAnimation({ onDone }: Props) {
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 80)
    const t2 = setTimeout(() => setPhase(2), 900)
    const t3 = setTimeout(() => setPhase(3), 1700)
    const t4 = setTimeout(() => { onDone() }, 2400)
    const t5 = setTimeout(() => setGone(true), 2800)
    return () => {
      clearTimeout(t1); clearTimeout(t2)
      clearTimeout(t3); clearTimeout(t4); clearTimeout(t5)
    }
  }, [onDone])

  if (gone) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: phase >= 3 ? 'none' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        // CSS transition handles the colour fade — no gradient interpolation needed
        background: phase >= 3 ? '#ffffff' : '#ec4899',
        opacity: phase >= 3 ? 0 : 1,
        transition: 'background 0.7s ease-in-out, opacity 0.7s ease-in-out',
      }}
    >
      {/* Logo block */}
      <motion.div
        className="flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.8, y: 16 }}
        animate={{
          opacity: phase >= 1 ? 1 : 0,
          scale:   phase >= 1 ? 1 : 0.8,
          y:       phase >= 1 ? 0 : 16,
        }}
        transition={{ duration: 0.55, ease: [0.34, 1.36, 0.64, 1] }}
      >
        {/* Icon ring */}
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            border: '2px solid rgba(255,255,255,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            boxShadow: '0 8px 40px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.35)',
          }}
        >
          <Sparkles size={34} color="white" strokeWidth={1.5} />
        </div>

        {/* Wordmark */}
        <p
          className="brand"
          style={{
            fontSize: 48,
            lineHeight: 1,
            color: 'white',
            textShadow: '0 2px 24px rgba(0,0,0,0.12)',
            letterSpacing: '0.01em',
          }}
        >
          BudgetAI
        </p>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : 8 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{
            marginTop: 12,
            fontSize: 13,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.80)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Smart budgeting · Powered by USDC
        </motion.p>
      </motion.div>
    </div>
  )
}
