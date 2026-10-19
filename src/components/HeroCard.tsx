import { useState } from 'react'
import { TokenUSDC } from '@web3icons/react'
import { ConnectKitButton } from 'connectkit'
import { TrendingUp, AlertTriangle, X, ArrowDownLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { t, type Lang } from '@/i18n'

const glass = {
  background: 'rgba(255,255,255,0.82)',
  backdropFilter: 'blur(28px) saturate(180%)',
  WebkitBackdropFilter: 'blur(28px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.72)',
  boxShadow: '0 8px 40px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6)',
} as React.CSSProperties

const innerGlass = {
  background: 'rgba(255,255,255,0.6)',
  border: '1px solid rgba(255,255,255,0.72)',
} as React.CSSProperties

interface Props {
  vaultBalanceUsd: string
  walletUsdcUsd: string
  isConnected: boolean
  isDeployed: boolean
  lang: Lang
  onEmergencyWithdraw: () => void
  onWithdraw: (amount: string) => void
  isPending: boolean
}

export function HeroCard({
  vaultBalanceUsd, walletUsdcUsd, isConnected, isDeployed, lang,
  onEmergencyWithdraw, onWithdraw, isPending,
}: Props) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawAmt, setWithdrawAmt] = useState('')
  const s = t(lang)
  const hasBalance = parseFloat(vaultBalanceUsd) > 0

  const handleWithdraw = () => {
    const n = parseFloat(withdrawAmt)
    if (!n || n <= 0) return
    onWithdraw(withdrawAmt)
    setWithdrawAmt('')
    setShowWithdraw(false)
  }

  return (
    <div style={glass} className="rounded-3xl p-6 mb-4 relative overflow-hidden">
      {/* pink top strip */}
      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-3xl"
        style={{ background: 'linear-gradient(90deg, #f9a8d4, #f472b6, #ec4899, #f9a8d4)' }} />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TokenUSDC variant="branded" size={20} />
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--muted)' }}>
            {s.vaultBalance}
          </span>
        </div>
        <ConnectKitButton />
      </div>

      {isConnected ? (
        <>
          <div className="display text-5xl font-bold tabular-nums mb-1"
            style={{ color: 'var(--ink)', letterSpacing: '-0.04em' }}>
            ${vaultBalanceUsd}
          </div>
          <div className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
            ${walletUsdcUsd} USDC {s.walletAvailable}
          </div>

          {!isDeployed && (
            <div className="mb-3 rounded-xl px-3 py-2 text-xs"
              style={{ background: 'rgba(244,114,182,0.1)', color: 'var(--ink-2)' }}>
              {s.contractNotDeployed}
            </div>
          )}

          {/* Withdraw button — only when there's a balance */}
          {isDeployed && hasBalance && (
            <div className="flex flex-col gap-2 mb-2">
              {/* Regular withdraw */}
              <AnimatePresence mode="wait">
                {showWithdraw ? (
                  <motion.div
                    key="withdraw-form"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.16 }}
                    className="rounded-2xl p-4"
                    style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.07)' }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                        {s.withdrawLabel ?? 'Вывести USDC'}
                      </span>
                      <button onClick={() => setShowWithdraw(false)}
                        className="rounded-lg p-1" style={{ color: 'var(--muted)' }}>
                        <X size={14} />
                      </button>
                    </div>
                    {/* Quick presets */}
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {['1', '5', '10', '25', vaultBalanceUsd].map(v => (
                        <button key={v}
                          onClick={() => setWithdrawAmt(v)}
                          className="rounded-xl px-3 py-1.5 text-xs font-semibold transition-all"
                          style={{
                            background: withdrawAmt === v ? '#111' : 'rgba(0,0,0,0.06)',
                            color: withdrawAmt === v ? '#fff' : 'var(--ink)',
                          }}>
                          {v === vaultBalanceUsd ? 'Max' : `$${v}`}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2.5"
                        style={{ background: 'white', border: '1px solid rgba(0,0,0,0.1)' }}>
                        <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={withdrawAmt}
                          onChange={e => setWithdrawAmt(e.target.value)}
                          placeholder="0.00"
                          className="flex-1 bg-transparent text-sm font-semibold outline-none"
                          style={{ color: 'var(--ink)' }}
                        />
                      </div>
                      <button
                        onClick={handleWithdraw}
                        disabled={isPending || !withdrawAmt || parseFloat(withdrawAmt) <= 0}
                        className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-40"
                        style={{ background: '#111', color: 'white' }}
                      >
                        {s.withdrawConfirmBtn ?? 'Вывести'}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.button
                    key="withdraw-btn"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    onClick={() => setShowWithdraw(true)}
                    disabled={isPending}
                    className="flex items-center gap-2 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.99] disabled:opacity-40"
                    style={{
                      background: 'rgba(0,0,0,0.05)',
                      border: '1px solid rgba(0,0,0,0.09)',
                      color: 'var(--ink)',
                    }}
                  >
                    <ArrowDownLeft size={15} />
                    {s.withdrawLabel ?? 'Вывести USDC'}
                    <span className="ml-auto text-xs font-normal opacity-50">
                      max ${vaultBalanceUsd}
                    </span>
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Emergency withdraw */}
              <div className="relative">
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={isPending}
                  className="flex items-center gap-2 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.99] disabled:opacity-40"
                  style={{
                    background: 'rgba(239,68,68,0.06)',
                    border: '1px solid rgba(239,68,68,0.18)',
                    color: '#dc2626',
                  }}
                >
                  <AlertTriangle size={15} />
                  {s.emergencyWithdrawLabel}
                  <span className="ml-auto text-xs font-normal opacity-70">100% · {s.vaultBalance}</span>
                </button>

                <AnimatePresence>
                  {showConfirm && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: -4 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="absolute inset-x-0 top-0 z-20 rounded-xl p-4"
                      style={{
                        background: 'rgba(255,255,255,0.98)',
                        border: '1px solid rgba(239,68,68,0.22)',
                        boxShadow: '0 8px 32px rgba(220,38,38,0.10)',
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={16} color="#dc2626" />
                          <span className="font-semibold text-sm" style={{ color: '#dc2626' }}>
                            {s.emergencyWithdrawConfirmTitle}
                          </span>
                        </div>
                        <button onClick={() => setShowConfirm(false)}
                          className="rounded-lg p-1 transition-colors"
                          style={{ color: 'var(--muted)' }}>
                          <X size={14} />
                        </button>
                      </div>
                      <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--ink-2)' }}>
                        {s.emergencyWithdrawConfirmDesc}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setShowConfirm(false); onEmergencyWithdraw() }}
                          className="flex-1 rounded-xl py-2 text-sm font-semibold transition-all active:scale-[0.98]"
                          style={{ background: '#dc2626', color: 'white' }}
                        >
                          {s.emergencyWithdrawConfirmBtn}
                        </button>
                        <button
                          onClick={() => setShowConfirm(false)}
                          className="flex-1 rounded-xl py-2 text-sm font-semibold transition-all"
                          style={{ ...innerGlass, color: 'var(--ink-2)' }}
                        >
                          {s.emergencyWithdrawCancelBtn}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="mt-2">
          <div className="brand text-3xl mb-1" style={{ color: 'var(--ink)' }}>
            {s.heroTagline1}
          </div>
          <div className="brand text-3xl mb-3" style={{ color: '#f472b6' }}>
            {s.heroTagline2}
          </div>
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted)' }}>
            <TrendingUp size={14} />
            <span>{s.heroSubline}</span>
          </div>
        </div>
      )}
    </div>
  )
}
