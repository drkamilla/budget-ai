import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LANGUAGES, type Lang } from '@/i18n'

interface Props {
  lang: Lang
  onChange: (l: Lang) => void
}

export function LanguageSelector({ lang, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = LANGUAGES.find(l => l.code === lang)!

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
        style={{
          background: open ? '#111111' : 'rgba(0,0,0,0.07)',
          color: open ? 'white' : '#444444',
          border: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <span>{current.flag}</span>
        <span>{current.label}</span>
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              minWidth: 148,
              background: 'rgba(255,255,255,0.98)',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: 14,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              overflow: 'hidden',
              zIndex: 100,
            }}
          >
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => { onChange(l.code); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-all text-left"
                style={{
                  background: l.code === lang ? 'rgba(0,0,0,0.05)' : 'transparent',
                  color: l.code === lang ? '#111111' : '#444444',
                }}
              >
                <span className="text-base leading-none">{l.flag}</span>
                <span>{l.label}</span>
                {l.code === lang && (
                  <svg className="ml-auto" width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L5 9L10 3" stroke="#111111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
