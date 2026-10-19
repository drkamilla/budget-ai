import { motion } from 'framer-motion'
import { Target, LayoutGrid, TrendingUp } from 'lucide-react'
import type { PlanSummary } from '@/utils/ai'

interface Props {
  plan: PlanSummary
  onReady: () => void
}

const innerGlass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.72)',
  border: '1px solid rgba(255,255,255,0.82)',
  borderRadius: 14,
}

export function BudgetPlanCard({ plan, onReady }: Props) {
  const income = parseFloat(plan.monthlyIncome)
  const totalBudgeted = plan.categories.reduce((s, c) => s + parseFloat(c.limit || '0'), 0)
  const leftover = income > 0 ? income - totalBudgeted : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        background: 'rgba(255,255,255,0.92)',
        border: '1px solid rgba(255,255,255,0.82)',
        borderRadius: 18,
        padding: '16px',
        marginTop: 10,
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Pink top accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: 'linear-gradient(90deg, #f9a8d4, #f472b6, #ec4899, #f9a8d4)',
        borderRadius: '18px 18px 0 0',
      }} />

      {/* Income row */}
      {income > 0 && (
        <div className="flex items-center gap-2 mb-3 pt-1">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(0,0,0,0.07)' }}
          >
            <TrendingUp size={12} color="#111111" />
          </div>
          <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>Monthly income</span>
          <span className="ml-auto font-bold text-sm tabular-nums" style={{ color: 'var(--ink)' }}>
            ${income.toLocaleString()}
          </span>
        </div>
      )}

      {/* Budget categories */}
      {plan.categories.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <LayoutGrid size={12} color="#111111" />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Envelopes
            </span>
          </div>
          <div className="space-y-1.5">
            {plan.categories.map(c => {
              const pct = income > 0 ? Math.round((parseFloat(c.limit) / income) * 100) : 0
              return (
                <div key={c.name} style={innerGlass} className="flex items-center gap-3 px-3 py-2">
                  <span className="text-sm font-medium flex-1" style={{ color: 'var(--ink)' }}>{c.name}</span>
                  <span className="mono text-xs tabular-nums" style={{ color: 'var(--muted)' }}>
                    ${parseFloat(c.limit).toLocaleString()}/mo
                  </span>
                  {income > 0 && (
                    <span
                      className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--ink-2)', minWidth: 36, textAlign: 'center' }}
                    >
                      {pct}%
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Savings goal */}
      {plan.goal && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Target size={12} color="#ec4899" />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Savings goal
            </span>
          </div>
          <div style={{ ...innerGlass, borderColor: 'rgba(244,114,182,0.25)' }} className="flex items-center gap-3 px-3 py-2">
            <span className="text-sm font-medium flex-1" style={{ color: 'var(--ink)' }}>{plan.goal.name}</span>
            <span className="mono text-xs tabular-nums font-semibold" style={{ color: '#ec4899' }}>
              ${parseFloat(plan.goal.target).toLocaleString()} target
            </span>
          </div>
        </div>
      )}

      {/* Leftover row */}
      {leftover !== null && leftover >= 0 && (
        <div
          className="flex items-center justify-between px-3 py-2 rounded-xl mb-3"
          style={{ background: 'rgba(0,0,0,0.04)' }}
        >
          <span className="text-xs" style={{ color: 'var(--muted)' }}>Leftover / savings buffer</span>
          <span className="font-bold text-sm tabular-nums" style={{ color: leftover > 0 ? '#1a8047' : 'var(--danger)' }}>
            ${leftover.toLocaleString()}
          </span>
        </div>
      )}

      {/* CTA */}
      <div className="flex gap-2 mt-1">
        <button
          onClick={onReady}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
          style={{ background: '#111111', color: 'white' }}
        >
          I'm ready to fund my vault
        </button>
      </div>
      <p className="text-xs text-center mt-2" style={{ color: 'var(--subtle)' }}>
        Or just say "later" — no rush at all 😊
      </p>
    </motion.div>
  )
}
