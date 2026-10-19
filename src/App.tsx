import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { LayoutGrid, Target, MessageCircle } from 'lucide-react'
import { useAccount } from 'wagmi'
import { motion, AnimatePresence } from 'framer-motion'
import { HeroCard } from '@/components/HeroCard'
import { BudgetList } from '@/components/BudgetList'
import { GoalList } from '@/components/GoalList'
import { AgentChat } from '@/components/AgentChat'
import { TxStatus } from '@/components/TxStatus'
import { FloatingBubbles } from '@/components/FloatingBubbles'
import { IntroAnimation } from '@/components/IntroAnimation'
import { LanguageSelector } from '@/components/LanguageSelector'
import { useVaultData } from '@/hooks/useVaultData'
import { useVaultWrite } from '@/hooks/useVaultWrite'
import { parseAmount } from '@/onchain-money'
import { t, type Lang } from '@/i18n'
import type { AIAction } from '@/utils/ai'

type Tab = 'budgets' | 'goals' | 'chat'
const LANG_KEY = 'budgetai_lang'

export default function App() {
  const [tab, setTab] = useState<Tab>('chat')
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem(LANG_KEY) as Lang) ?? 'en')

  // Show intro every time the page loads — no sessionStorage gate.
  const [showIntro, setShowIntro] = useState(true)
  const [appVisible, setAppVisible] = useState(false)

  const { chainId } = useAccount()
  // Stores the amount waiting for approve→deposit sequencing
  const pendingDepositRef = useRef<string | null>(null)

  const {
    isConnected, isDeployed, vaultBalanceUsd, walletUsdcUsd,
    usdcAllowance, categories, goals, usdcAddress, refetchAll,
  } = useVaultData()

  const {
    approve, deposit, withdraw, createCategory, createGoal,
    fundGoal, withdrawGoal, spend, emergencyWithdrawAll,
    hash, isPending, isConfirming, isSuccess, error, reset,
  } = useVaultWrite(chainId, usdcAddress)

  // After any successful tx, refetch. If an approval just finished and we have
  // a pending deposit queued, fire the deposit now.
  useEffect(() => {
    if (!isSuccess) return
    refetchAll()
    if (pendingDepositRef.current) {
      const amount = pendingDepositRef.current
      pendingDepositRef.current = null
      // Small delay so wagmi resets its write state before the next call
      setTimeout(() => deposit(amount), 300)
    }
  }, [isSuccess]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (error) {
      const msg = error.message?.toLowerCase() ?? ''
      if (!msg.includes('user rejected')) {
        toast.error('Transaction failed', { description: error.message?.slice(0, 80) })
      }
      // Cancel any queued deposit if the approve failed/was rejected
      pendingDepositRef.current = null
      reset()
    }
  }, [error]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleIntroDone = useCallback(() => {
    setShowIntro(false)
    setAppVisible(true)
  }, [])

  const handleLangChange = useCallback((l: Lang) => {
    setLang(l)
    localStorage.setItem(LANG_KEY, l)
  }, [])

  const handleAction = useCallback((action: AIAction) => {
    if (!isDeployed) return
    switch (action.type) {
      case 'deposit': {
        const parsed = parseAmount(5042, action.amount)
        if (usdcAllowance < parsed.raw) {
          toast.info('Approving USDC first…')
          pendingDepositRef.current = action.amount
          approve(action.amount)
        } else {
          deposit(action.amount)
        }
        break
      }
      case 'withdraw': withdraw(action.amount); break
      case 'create_category': createCategory(action.name, action.limit); break
      case 'create_goal': createGoal(action.name, action.target); break
      case 'fund_goal': {
        const goal = goals.find(g => g.name.toLowerCase().includes(action.goalName.toLowerCase()))
        if (goal) fundGoal(goal.id, action.amount)
        break
      }
      case 'withdraw_goal': {
        const goal = goals.find(g => g.name.toLowerCase().includes(action.goalName.toLowerCase()))
        if (goal) withdrawGoal(goal.id, action.amount)
        break
      }
      case 'spend': {
        const cat = categories.find(c => c.name.toLowerCase().includes(action.categoryName.toLowerCase())) ?? categories[0]
        if (cat && /^0x[a-fA-F0-9]{40}$/.test(action.recipient)) {
          spend(action.recipient as `0x${string}`, cat.id, action.amount)
        } else {
          toast.error('Could not find category or invalid address.')
        }
        break
      }
    }
  }, [isDeployed, usdcAllowance, goals, categories, approve, deposit, withdraw, createCategory, createGoal, fundGoal, withdrawGoal, spend])

  const s = t(lang)

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'chat',    label: s.tabChat,    icon: <MessageCircle size={15} /> },
    { id: 'budgets', label: s.tabBudgets, icon: <LayoutGrid size={15} /> },
    { id: 'goals',   label: s.tabGoals,   icon: <Target size={15} /> },
  ]

  return (
    <>
      {/* Background */}
      <div className="fixed inset-0" style={{ background: 'var(--bg-gradient)', zIndex: -1 }} />
      <FloatingBubbles count={14} />

      {/* Intro splash — mounts immediately, unmounts itself after sequence */}
      {showIntro && <IntroAnimation onDone={handleIntroDone} />}

      {/* App shell — fades in after intro */}
      <AnimatePresence>
        {appVisible && (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="relative min-h-dvh"
            style={{ zIndex: 1 }}
          >
            <div className="mx-auto max-w-4xl px-6 pb-10 pt-6">

              {/* Header */}
              <div className="mb-5 flex items-center justify-between">
                <span className="brand text-2xl" style={{ color: '#111111' }}>
                  {s.appName}
                </span>
                <div className="flex items-center gap-2">
                  <LanguageSelector lang={lang} onChange={handleLangChange} />
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--muted)' }}>
                    {s.networkBadge}
                  </span>
                </div>
              </div>

              {/* Hero balance */}
              <HeroCard
                vaultBalanceUsd={vaultBalanceUsd}
                walletUsdcUsd={walletUsdcUsd}
                isConnected={isConnected}
                isDeployed={isDeployed}
                lang={lang}
                onEmergencyWithdraw={emergencyWithdrawAll}
                onWithdraw={withdraw}
                isPending={isPending}
              />

              {/* Tx status */}
              {isSuccess && hash && (
                <div className="mb-3">
                  <TxStatus isPending={false} isConfirming={false} isSuccess={true} error={null} hash={hash} label={s.txConfirmed} />
                </div>
              )}
              {(isPending || isConfirming || error) && (
                <div className="mb-3">
                  <TxStatus isPending={isPending} isConfirming={isConfirming} isSuccess={false} error={error} hash={hash} />
                </div>
              )}

              {/* Tab bar */}
              <div className="flex rounded-2xl p-1 mb-4 gap-1"
                style={{ background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.78)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                {tabs.map(tb => (
                  <button key={tb.id} onClick={() => setTab(tb.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all"
                    style={{ background: tab === tb.id ? '#111111' : 'transparent', color: tab === tb.id ? 'white' : 'var(--muted)' }}
                  >
                    {tb.icon}{tb.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <AnimatePresence mode="wait">
                {tab === 'chat' && (
                  <motion.div key="chat"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.22 }}
                  >
                    <AgentChat
                      isConnected={isConnected} isDeployed={isDeployed}
                      vaultBalanceUsd={vaultBalanceUsd} categories={categories} goals={goals}
                      isPending={isPending} isConfirming={isConfirming} isSuccess={isSuccess}
                      lang={lang} onAction={handleAction}
                    />
                  </motion.div>
                )}

                {tab === 'budgets' && (
                  <motion.div key="budgets"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.22 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="display text-base" style={{ color: 'var(--ink)' }}>{s.budgetCategories}</h2>
                      <span className="text-xs" style={{ color: 'var(--subtle)' }}>
                        {categories.length} {categories.length === 1 ? s.category : s.categories}
                      </span>
                    </div>
                    <BudgetList categories={categories} />
                    {!isConnected && (
                      <p className="text-center text-sm mt-4" style={{ color: 'var(--subtle)' }}>{s.connectPrompt}</p>
                    )}
                  </motion.div>
                )}

                {tab === 'goals' && (
                  <motion.div key="goals"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.22 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="display text-base" style={{ color: 'var(--ink)' }}>{s.savingsGoals}</h2>
                      <span className="text-xs" style={{ color: 'var(--subtle)' }}>
                        {goals.filter(g => g.completed).length}/{goals.length} {s.complete}
                      </span>
                    </div>
                    <GoalList goals={goals} />
                    {!isConnected && (
                      <p className="text-center text-sm mt-4" style={{ color: 'var(--subtle)' }}>{s.connectPrompt}</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Empty state nudge */}
              {isConnected && isDeployed && categories.length === 0 && goals.length === 0 && tab !== 'chat' && (
                <div className="mt-4 rounded-2xl px-4 py-3 text-sm text-center"
                  style={{ background: 'rgba(244,114,182,0.08)', color: 'var(--ink-2)' }}>
                  {s.emptyNudge}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
