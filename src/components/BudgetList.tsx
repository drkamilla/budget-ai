import { AlertCircle, CheckCircle } from 'lucide-react'
import type { Category } from '@/hooks/useVaultData'

interface Props {
  categories: Category[]
}

export function BudgetList({ categories }: Props) {
  if (categories.length === 0) {
    return (
      <div
        className="rounded-2xl px-5 py-8 text-center"
        style={{
          background: 'rgba(255,255,255,0.6)',
          border: '1px solid rgba(255,255,255,0.72)',
        }}
      >
        <p className="text-sm" style={{ color: 'var(--subtle)' }}>
          No budget categories yet. Ask Fin to set one up.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {categories.map((cat) => {
        const over = cat.pct >= 100
        const warning = cat.pct >= 80 && !over
        const barColor = over ? 'var(--danger)' : warning ? '#f59e0b' : '#111111'

        return (
          <div
            key={cat.id}
            className="rounded-2xl px-5 py-4"
            style={{
              background: 'rgba(255,255,255,0.6)',
              border: `1px solid ${over ? 'rgba(186,43,76,0.2)' : 'rgba(255,255,255,0.72)'}`,
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {over ? (
                  <AlertCircle size={14} color="var(--danger)" />
                ) : (
                  <CheckCircle size={14} color="#111111" />
                )}
                <span className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>
                  {cat.name}
                </span>
              </div>
              <span className="mono text-xs tabular-nums" style={{ color: over ? 'var(--danger)' : 'var(--muted)' }}>
                ${cat.spentUsd} / ${cat.limitUsd}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-muted)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(cat.pct, 100)}%`, background: barColor }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs" style={{ color: 'var(--subtle)' }}>
                {cat.pct}% used
              </span>
              <span className="text-xs" style={{ color: 'var(--subtle)' }}>
                ${(parseFloat(cat.limitUsd) - parseFloat(cat.spentUsd)).toFixed(2)} remaining
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
