import { motion } from 'framer-motion'
import type { Lang } from '@/i18n'

interface Slice {
  label: string
  value: number   // 0–100 percentage
  color: string
}

interface Props {
  categories: Array<{ name: string; limit: string }>
  monthlyIncome: string
  lang: Lang
  onReady: () => void
}

// Map a category name to needs / wants / savings bucket
function classify(name: string): 'needs' | 'wants' | 'savings' {
  const n = name.toLowerCase()
  if (/rent|mortgage|groceries|food|transport|utilities|insurance|health|bills|medical/.test(n)) return 'needs'
  if (/goal|saving|emerg|invest|vacation|holiday/.test(n)) return 'savings'
  return 'wants'
}

const BUCKET_COLORS: Record<string, string> = {
  Needs:   '#111111',
  Wants:   '#f472b6',
  Savings: '#a855f7',
  Other:   '#d1d5db',
}

const READY_BTN: Record<Lang, string> = {
  en: 'Ready to fund my envelopes?',
  es: '¿Listo para financiar mis sobres?',
  ru: 'Готов пополнить конверты?',
  pt: 'Pronto para financiar meus envelopes?',
}
const CHART_TITLE: Record<Lang, string> = {
  en: "Here's what your budget will look like!",
  es: '¡Así quedará tu presupuesto!',
  ru: 'Вот как будет выглядеть твой бюджет!',
  pt: 'Veja como ficará o seu orçamento!',
}
const LEFTOVER_LABEL: Record<Lang, string> = {
  en: 'Unallocated',
  es: 'Sin asignar',
  ru: 'Нераспределено',
  pt: 'Não alocado',
}

/** Build an SVG arc path for a pie slice */
function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const toRad = (d: number) => ((d - 90) * Math.PI) / 180
  const x1 = cx + r * Math.cos(toRad(startDeg))
  const y1 = cy + r * Math.sin(toRad(startDeg))
  const x2 = cx + r * Math.cos(toRad(endDeg))
  const y2 = cy + r * Math.sin(toRad(endDeg))
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
}

export function BudgetPieChart({ categories, monthlyIncome, lang, onReady }: Props) {
  const income = parseFloat(monthlyIncome) || 0

  // Aggregate into buckets
  const buckets: Record<string, number> = {}
  for (const c of categories) {
    const bucket = classify(c.name)
    const label = bucket === 'needs' ? 'Needs' : bucket === 'savings' ? 'Savings' : 'Wants'
    buckets[label] = (buckets[label] ?? 0) + parseFloat(c.limit || '0')
  }

  const total = Object.values(buckets).reduce((s, v) => s + v, 0)
  const leftover = income > 0 ? Math.max(0, income - total) : 0
  if (leftover > 0) buckets['Unallocated'] = leftover

  const slices: Slice[] = Object.entries(buckets).map(([label, value]) => ({
    label,
    value: income > 0 ? Math.round((value / income) * 100) : Math.round((value / (total || 1)) * 100),
    color: BUCKET_COLORS[label] ?? '#d1d5db',
  }))

  // Build SVG paths
  const cx = 80, cy = 80, r = 68, innerR = 44
  let cursor = 0
  const paths = slices.map(s => {
    const start = cursor
    const sweep = (s.value / 100) * 360
    cursor += sweep
    return { ...s, start, end: cursor }
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{
        background: 'rgba(255,255,255,0.95)',
        border: '1px solid rgba(255,255,255,0.82)',
        borderRadius: 18,
        padding: '16px',
        marginTop: 10,
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* pink top strip */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: 'linear-gradient(90deg, #f9a8d4, #f472b6, #a855f7, #f9a8d4)',
        borderRadius: '18px 18px 0 0',
      }} />

      <p className="text-sm font-semibold text-center mt-1 mb-4" style={{ color: '#111111' }}>
        {CHART_TITLE[lang]}
      </p>

      <div className="flex items-center gap-5">
        {/* SVG donut */}
        <div className="flex-shrink-0">
          <svg width={160} height={160} viewBox="0 0 160 160">
            {paths.map((s, i) => (
              <motion.path
                key={s.label}
                d={arcPath(cx, cy, r, s.start, s.end)}
                fill={s.color}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: i * 0.08, ease: 'easeOut' }}
                style={{ transformOrigin: `${cx}px ${cy}px` }}
              />
            ))}
            {/* Inner hole */}
            <circle cx={cx} cy={cy} r={innerR} fill="white" />
            {/* Center text */}
            {income > 0 && (
              <>
                <text x={cx} y={cy - 5} textAnchor="middle" fontSize="11" fontWeight="700" fill="#111111">
                  ${Math.round(income).toLocaleString()}
                </text>
                <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill="#888888">
                  /mo
                </text>
              </>
            )}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          {paths.map(s => (
            <div key={s.label} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: s.color }}
              />
              <span className="text-xs font-medium flex-1 truncate" style={{ color: '#333' }}>
                {s.label}
              </span>
              <span className="text-xs font-bold tabular-nums" style={{ color: '#111' }}>
                {s.value}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onReady}
        className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
        style={{ background: '#111111', color: 'white' }}
      >
        {READY_BTN[lang]}
      </button>

      <p className="text-xs text-center mt-2" style={{ color: '#aaa' }}>
        {LEFTOVER_LABEL[lang]}: ${leftover > 0 ? Math.round(leftover).toLocaleString() : '0'} / mo
      </p>
    </motion.div>
  )
}
