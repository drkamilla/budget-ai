import { Target, CheckCircle2 } from 'lucide-react'
import type { Goal } from '@/hooks/useVaultData'

interface Props {
  goals: Goal[]
}

export function GoalList({ goals }: Props) {
  if (goals.length === 0) {
    return (
      <div
        className="rounded-2xl px-5 py-8 text-center"
        style={{
          background: 'rgba(255,255,255,0.6)',
          border: '1px solid rgba(255,255,255,0.72)',
        }}
      >
        <p className="text-sm" style={{ color: 'var(--subtle)' }}>
          No savings goals yet. Ask Fin to create one.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {goals.map((goal) => (
        <div
          key={goal.id}
          className="rounded-2xl px-5 py-4 relative overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.6)',
            border: goal.completed
              ? '1px solid rgba(244,114,182,0.4)'
              : '1px solid rgba(255,255,255,0.72)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          }}
        >
          {goal.completed && (
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: 'linear-gradient(90deg, #f9a8d4, #f472b6, #ec4899, #f9a8d4)' }}
            />
          )}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {goal.completed ? (
                <CheckCircle2 size={14} color="#ec4899" />
              ) : (
                <Target size={14} color="#111111" />
              )}
              <span className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>
                {goal.name}
              </span>
              {goal.completed && (
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(244,114,182,0.12)', color: '#ec4899' }}
                >
                  Complete
                </span>
              )}
            </div>
            <span className="mono text-xs tabular-nums" style={{ color: 'var(--muted)' }}>
              ${goal.savedUsd} / ${goal.targetUsd}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-muted)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(goal.pct, 100)}%`,
                background: goal.completed
                  ? 'linear-gradient(90deg, #f9a8d4, #ec4899)'
                  : '#111111',
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs" style={{ color: 'var(--subtle)' }}>
              {goal.pct}% saved
            </span>
            <span className="text-xs" style={{ color: 'var(--subtle)' }}>
              ${(parseFloat(goal.targetUsd) - parseFloat(goal.savedUsd)).toFixed(2)} to go
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
