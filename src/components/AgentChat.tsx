import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Loader2, Sparkles, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { TokenUSDC } from '@web3icons/react'
import {
  handleMessage, forceAdvance, makeIntroMessage,
  initialConversationState, suggestBudgets,
  type ChatMessage, type AIAction, type ConversationState,
  type PlanSummary, type AdvanceChoice,
} from '@/utils/ai'
import { BudgetPlanCard } from '@/components/BudgetPlanCard'
import { BudgetPieChart } from '@/components/BudgetPieChart'
import { parseAmount } from '@/onchain-money'
import { t, type Lang } from '@/i18n'
import type { Category, Goal } from '@/hooks/useVaultData'

// ─── Style constants ──────────────────────────────────────────────────────────

const glass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.82)',
  backdropFilter: 'blur(28px) saturate(180%)',
  WebkitBackdropFilter: 'blur(28px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.72)',
  boxShadow: '0 8px 40px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6)',
}
const innerGlass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.6)',
  border: '1px solid rgba(255,255,255,0.72)',
}
const blackBtn: React.CSSProperties = { background: '#111111', color: 'white' }
const softBtn: React.CSSProperties = { ...innerGlass, color: 'var(--ink-2)' }

// ─── Reusable button atoms ────────────────────────────────────────────────────

function Btn({ label, onClick, primary, full, emoji }: {
  label: string; onClick: () => void
  primary?: boolean; full?: boolean; emoji?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.98] ${full ? 'w-full' : ''}`}
      style={primary ? blackBtn : softBtn}
    >
      {emoji && <span>{emoji}</span>}{label}
    </button>
  )
}

// ─── Deposit card ─────────────────────────────────────────────────────────────

function DepositCard({ onDeposit, lang }: { onDeposit: (amount: string) => void; lang: Lang }) {
  const [value, setValue] = useState('')
  const s = t(lang)
  const presets = ['25', '50', '100', '200']
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{ ...innerGlass, borderRadius: 16, padding: '14px 16px', marginTop: 8, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: 'linear-gradient(90deg,#f9a8d4,#f472b6,#ec4899,#f9a8d4)', borderRadius: '16px 16px 0 0' }} />
      <div className="flex items-center gap-2 mb-3 pt-1">
        <TokenUSDC variant="branded" size={18} />
        <span className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>{s.depositTitle}</span>
      </div>
      <div className="flex gap-2 mb-3 flex-wrap">
        {presets.map(p => (
          <button key={p} onClick={() => setValue(p)}
            className="rounded-full px-3 py-1 text-xs font-semibold transition-all"
            style={{ background: value === p ? '#111111' : 'rgba(0,0,0,0.06)', color: value === p ? 'white' : 'var(--ink-2)' }}>
            ${p}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: 'var(--muted)' }}>$</span>
          <input type="number" min="1" step="1" placeholder="0.00" value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && value) onDeposit(value) }}
            className="w-full rounded-xl pl-7 pr-3 py-2 text-sm font-semibold tabular-nums outline-none"
            style={{ ...innerGlass, color: 'var(--ink)' }} />
        </div>
        <button onClick={() => { if (value) onDeposit(value) }}
          disabled={!value || parseFloat(value) <= 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
          style={blackBtn}>
          {s.depositBtn} <ChevronRight size={13} />
        </button>
      </div>
    </motion.div>
  )
}

// ─── Budget plan editor (own component — hooks must not be conditional) ───────

function BudgetPlanButtons({ convState, lang, onAdvance }: {
  convState: ConversationState; lang: Lang; onAdvance: (c: AdvanceChoice) => void
}) {
  const income = parseFloat(convState.monthlyIncome ?? '0')
  const cats = convState.pendingCategories.length > 0
    ? [...convState.pendingCategories]
    : suggestBudgets(income, lang)

  const [editAmounts, setEditAmounts] = useState<Record<string, string>>({})
  const [editing, setEditing] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatAmt, setNewCatAmt] = useState('')
  const [addingCat, setAddingCat] = useState(false)

  const acceptLabel = lang === 'ru' ? '✅ Принять план' : lang === 'es' ? '✅ Aceptar plan' : lang === 'pt' ? '✅ Aceitar plano' : '✅ Accept plan'
  const editLabel   = lang === 'ru' ? '✏️ Изменить суммы' : lang === 'es' ? '✏️ Cambiar montos' : lang === 'pt' ? '✏️ Alterar valores' : '✏️ Edit amounts'
  const addLabel    = lang === 'ru' ? '➕ Добавить категорию' : lang === 'es' ? '➕ Añadir categoría' : lang === 'pt' ? '➕ Adicionar categoria' : '➕ Add category'
  const doneLabel   = lang === 'ru' ? 'Готово' : lang === 'es' ? 'Listo' : lang === 'pt' ? 'Pronto' : 'Done'

  const handleAccept = () => {
    if (editing) cats.forEach(c => { if (editAmounts[c.name]) c.limit = editAmounts[c.name] })
    onAdvance({ type: 'accept_plan' })
  }

  return (
    <div className="px-4 pb-4 space-y-2">
      <div className="rounded-2xl p-3 space-y-1.5 mb-1" style={innerGlass}>
        {cats.map(c => (
          <div key={c.name} className="flex items-center gap-2">
            <span className="text-xs font-medium flex-1" style={{ color: 'var(--ink)' }}>{c.name}</span>
            {editing
              ? <input type="number" value={editAmounts[c.name] ?? c.limit}
                  onChange={e => setEditAmounts(prev => ({ ...prev, [c.name]: e.target.value }))}
                  className="w-20 rounded-lg px-2 py-0.5 text-xs font-semibold tabular-nums outline-none text-right"
                  style={{ ...innerGlass, color: 'var(--ink)' }} />
              : <span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--ink-2)' }}>${c.limit}/mo</span>
            }
          </div>
        ))}
        {addingCat && (
          <div className="flex gap-2 mt-2">
            <input placeholder={lang === 'ru' ? 'Название' : lang === 'es' ? 'Nombre' : lang === 'pt' ? 'Nome' : 'Name'}
              value={newCatName} onChange={e => setNewCatName(e.target.value)}
              className="flex-1 rounded-lg px-2 py-1 text-xs outline-none" style={{ ...innerGlass, color: 'var(--ink)' }} />
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--muted)' }}>$</span>
              <input type="number" placeholder="0" value={newCatAmt}
                onChange={e => setNewCatAmt(e.target.value)}
                className="w-16 rounded-lg pl-5 pr-2 py-1 text-xs outline-none" style={{ ...innerGlass, color: 'var(--ink)' }} />
            </div>
            <button onClick={() => {
              if (newCatName && newCatAmt) {
                cats.push({ name: newCatName, limit: newCatAmt })
                setNewCatName(''); setNewCatAmt(''); setAddingCat(false)
              }
            }} className="rounded-lg px-2 py-1 text-xs font-semibold" style={blackBtn}>+</button>
          </div>
        )}
      </div>
      <Btn label={acceptLabel} primary full onClick={handleAccept} />
      <div className="grid grid-cols-2 gap-2">
        <Btn label={editLabel} onClick={() => setEditing(v => !v)} />
        <Btn label={addLabel} onClick={() => setAddingCat(v => !v)} />
      </div>
      {(editing || addingCat) && (
        <Btn label={doneLabel} primary full onClick={() => {
          if (editing) cats.forEach(c => { if (editAmounts[c.name]) c.limit = editAmounts[c.name] })
          setEditing(false); setAddingCat(false)
          onAdvance({ type: 'accept_plan' })
        }} />
      )}
    </div>
  )
}

// ─── Stage-specific action button bars ───────────────────────────────────────

function StageButtons({ convState, lang, onAdvance }: {
  convState: ConversationState
  lang: Lang
  onAdvance: (c: AdvanceChoice) => void
}) {
  const goalPresets = {
    en: [
      { emoji: '✈️', name: 'Vacation',       target: '2000' },
      { emoji: '📱', name: 'Gadget',         target: '1000' },
      { emoji: '🏥', name: 'Emergency fund', target: '3000' },
      { emoji: '🏠', name: 'Big purchase',   target: '5000' },
    ],
    es: [
      { emoji: '✈️', name: 'Vacaciones',       target: '2000' },
      { emoji: '📱', name: 'Gadget',            target: '1000' },
      { emoji: '🏥', name: 'Fondo emergencia', target: '3000' },
      { emoji: '🏠', name: 'Compra grande',    target: '5000' },
    ],
    ru: [
      { emoji: '✈️', name: 'Путешествие',      target: '2000' },
      { emoji: '📱', name: 'Гаджет',           target: '1000' },
      { emoji: '🏥', name: 'Резервный фонд',   target: '3000' },
      { emoji: '🏠', name: 'Крупная покупка',  target: '5000' },
    ],
    pt: [
      { emoji: '✈️', name: 'Férias',           target: '2000' },
      { emoji: '📱', name: 'Gadget',            target: '1000' },
      { emoji: '🏥', name: 'Fundo emergência', target: '3000' },
      { emoji: '🏠', name: 'Compra grande',    target: '5000' },
    ],
  }

  const incomePresets = [
    { label: '~$1,000', value: '1000' },
    { label: '~$2,000', value: '2000' },
    { label: '~$3,500', value: '3500' },
    { label: '~$5,000', value: '5000' },
    { label: '~$8,000+', value: '8000' },
  ]

  const [customIncome, setCustomIncome] = useState('')
  const [customGoalName, setCustomGoalName] = useState('')
  const [customGoalAmt, setCustomGoalAmt] = useState('')
  const [showCustomIncome, setShowCustomIncome] = useState(false)
  const [showCustomGoal, setShowCustomGoal] = useState(false)

  const stage = convState.stage

  if (stage === 'intro') {
    const label = lang === 'ru' ? '👋 Привет, Фин!' : lang === 'es' ? '👋 ¡Hola, Fin!' : lang === 'pt' ? '👋 Oi, Fin!' : '👋 Hey Fin!'
    return (
      <div className="px-4 pb-4">
        <Btn label={label} onClick={() => onAdvance({ type: 'greet' })} primary full />
      </div>
    )
  }

  if (stage === 'ask_why') {
    const reasons: Array<{ emoji: string; label: string; reason: 'overspend'|'saving'|'debt'|'family' }> = lang === 'ru' ? [
      { emoji: '💸', label: 'Контролировать расходы', reason: 'overspend' },
      { emoji: '🎯', label: 'Копить на цель',         reason: 'saving'   },
      { emoji: '😰', label: 'Постоянно в минусе',     reason: 'debt'     },
      { emoji: '👨‍👩‍👧', label: 'Семейный бюджет',      reason: 'family'   },
    ] : lang === 'es' ? [
      { emoji: '💸', label: 'Controlar gastos',   reason: 'overspend' },
      { emoji: '🎯', label: 'Ahorrar para algo',  reason: 'saving'   },
      { emoji: '😰', label: 'Siempre en números rojos', reason: 'debt' },
      { emoji: '👨‍👩‍👧', label: 'Presupuesto familiar', reason: 'family' },
    ] : lang === 'pt' ? [
      { emoji: '💸', label: 'Controlar gastos',    reason: 'overspend' },
      { emoji: '🎯', label: 'Economizar para algo', reason: 'saving'  },
      { emoji: '😰', label: 'Sempre no vermelho',   reason: 'debt'    },
      { emoji: '👨‍👩‍👧', label: 'Orçamento familiar', reason: 'family'   },
    ] : [
      { emoji: '💸', label: 'Control my spending',  reason: 'overspend' },
      { emoji: '🎯', label: 'Save for a goal',       reason: 'saving'   },
      { emoji: '😰', label: "Always running short",  reason: 'debt'     },
      { emoji: '👨‍👩‍👧', label: 'Family budget',         reason: 'family'   },
    ]
    return (
      <div className="px-4 pb-4 grid grid-cols-2 gap-2">
        {reasons.map(r => (
          <Btn key={r.reason} emoji={r.emoji} label={r.label}
            onClick={() => onAdvance({ type: 'why', reason: r.reason })} />
        ))}
      </div>
    )
  }

  if (stage === 'ask_income') {
    const otherLabel = lang === 'ru' ? '✍️ Другая сумма' : lang === 'es' ? '✍️ Otra cantidad' : lang === 'pt' ? '✍️ Outro valor' : '✍️ Other amount'
    return (
      <div className="px-4 pb-4 space-y-2">
        <div className="grid grid-cols-3 gap-2">
          {incomePresets.map(p => (
            <Btn key={p.value} label={p.label} onClick={() => onAdvance({ type: 'income', amount: p.value })} />
          ))}
          <Btn label={otherLabel} onClick={() => setShowCustomIncome(v => !v)} />
        </div>
        {showCustomIncome && (
          <div className="flex gap-2 mt-1">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--muted)' }}>$</span>
              <input type="number" min="0" placeholder="3500"
                value={customIncome} onChange={e => setCustomIncome(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && customIncome) onAdvance({ type: 'income', amount: customIncome }) }}
                className="w-full rounded-xl pl-7 pr-3 py-2 text-sm font-semibold outline-none"
                style={{ ...innerGlass, color: 'var(--ink)' }} />
            </div>
            <button onClick={() => { if (customIncome) onAdvance({ type: 'income', amount: customIncome }) }}
              className="px-4 py-2 rounded-xl text-sm font-semibold" style={blackBtn}>
              {lang === 'ru' ? 'Ввести' : lang === 'es' ? 'Ingresar' : lang === 'pt' ? 'Entrar' : 'Enter'}
            </button>
          </div>
        )}
      </div>
    )
  }

  if (stage === 'budget_plan') {
    return <BudgetPlanButtons convState={convState} lang={lang} onAdvance={onAdvance} />
  }

  if (stage === 'ask_goal') {
    const presets = goalPresets[lang]
    const skipLabel = lang === 'ru' ? '⏭️ Пропустить' : lang === 'es' ? '⏭️ Saltar' : lang === 'pt' ? '⏭️ Pular' : '⏭️ Skip for now'
    const ownLabel  = lang === 'ru' ? '✍️ Своя цель' : lang === 'es' ? '✍️ Mi propia meta' : lang === 'pt' ? '✍️ Minha meta' : '✍️ Custom goal'
    const namePh    = lang === 'ru' ? 'Название цели' : lang === 'es' ? 'Nombre de la meta' : lang === 'pt' ? 'Nome da meta' : 'Goal name'

    return (
      <div className="px-4 pb-4 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {presets.map(p => (
            <Btn key={p.name} emoji={p.emoji} label={`${p.name} $${parseInt(p.target).toLocaleString()}`}
              onClick={() => onAdvance({ type: 'goal_preset', name: p.name, target: p.target })} />
          ))}
        </div>
        <Btn label={ownLabel} full onClick={() => setShowCustomGoal(v => !v)} />
        {showCustomGoal && (
          <div className="flex gap-2">
            <input placeholder={namePh} value={customGoalName} onChange={e => setCustomGoalName(e.target.value)}
              className="flex-1 rounded-xl px-3 py-2 text-sm outline-none" style={{ ...innerGlass, color: 'var(--ink)' }} />
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--muted)' }}>$</span>
              <input type="number" placeholder="1000" value={customGoalAmt} onChange={e => setCustomGoalAmt(e.target.value)}
                className="w-24 rounded-xl pl-6 pr-2 py-2 text-sm outline-none" style={{ ...innerGlass, color: 'var(--ink)' }} />
            </div>
            <button onClick={() => {
              if (customGoalName && customGoalAmt)
                onAdvance({ type: 'goal_preset', name: customGoalName, target: customGoalAmt })
            }} className="px-3 py-2 rounded-xl text-sm font-semibold" style={blackBtn}>
              {lang === 'ru' ? 'Ок' : 'OK'}
            </button>
          </div>
        )}
        <Btn label={skipLabel} full onClick={() => onAdvance({ type: 'skip_goal' })} />
      </div>
    )
  }

  if (stage === 'plan_review') {
    const fundLabel   = lang === 'ru' ? '🚀 Пополнить хранилище' : lang === 'es' ? '🚀 Financiar mi bóveda' : lang === 'pt' ? '🚀 Financiar meu cofre' : '🚀 Fund my vault'
    const editLabel   = lang === 'ru' ? '✏️ Изменить что-то' : lang === 'es' ? '✏️ Cambiar algo' : lang === 'pt' ? '✏️ Alterar algo' : '✏️ Adjust something'
    const laterLabel  = lang === 'ru' ? '⏰ Позже' : lang === 'es' ? '⏰ Más tarde' : lang === 'pt' ? '⏰ Depois' : '⏰ Later'
    return (
      <div className="px-4 pb-4 space-y-2">
        <Btn label={fundLabel} primary full onClick={() => onAdvance({ type: 'ready' })} />
        <div className="grid grid-cols-2 gap-2">
          <Btn label={editLabel} onClick={() => onAdvance({ type: 'accept_plan' })} />
          <Btn label={laterLabel} onClick={() => onAdvance({ type: 'later' })} />
        </div>
      </div>
    )
  }

  if (stage === 'ask_deposit') {
    const laterLabel = lang === 'ru' ? 'Позже' : lang === 'es' ? 'Más tarde' : lang === 'pt' ? 'Depois' : 'Later'
    return (
      <div className="px-4 pb-4">
        <Btn label={laterLabel} full onClick={() => onAdvance({ type: 'later' })} />
      </div>
    )
  }

  if (stage === 'coaching') {
    const btns = lang === 'ru' ? [
      { emoji: '💡', label: 'Ещё совет',              choice: { type: 'coaching_tip' } as AdvanceChoice },
      { emoji: '❓', label: 'Как работают конверты?', choice: { type: 'coaching_envelope' } as AdvanceChoice },
      { emoji: '📊', label: 'Показать мой план',      choice: { type: 'coaching_show_plan' } as AdvanceChoice },
      { emoji: '✅', label: 'Готов пополнить',         choice: { type: 'ready' } as AdvanceChoice },
    ] : lang === 'es' ? [
      { emoji: '💡', label: 'Otro consejo',            choice: { type: 'coaching_tip' } as AdvanceChoice },
      { emoji: '❓', label: '¿Cómo funcionan los sobres?', choice: { type: 'coaching_envelope' } as AdvanceChoice },
      { emoji: '📊', label: 'Ver mi plan',             choice: { type: 'coaching_show_plan' } as AdvanceChoice },
      { emoji: '✅', label: 'Listo para financiar',    choice: { type: 'ready' } as AdvanceChoice },
    ] : lang === 'pt' ? [
      { emoji: '💡', label: 'Outra dica',             choice: { type: 'coaching_tip' } as AdvanceChoice },
      { emoji: '❓', label: 'Como funcionam os envelopes?', choice: { type: 'coaching_envelope' } as AdvanceChoice },
      { emoji: '📊', label: 'Ver meu plano',          choice: { type: 'coaching_show_plan' } as AdvanceChoice },
      { emoji: '✅', label: 'Pronto para financiar',  choice: { type: 'ready' } as AdvanceChoice },
    ] : [
      { emoji: '💡', label: 'Give me a tip',          choice: { type: 'coaching_tip' } as AdvanceChoice },
      { emoji: '❓', label: 'How do envelopes work?', choice: { type: 'coaching_envelope' } as AdvanceChoice },
      { emoji: '📊', label: 'Show my plan',           choice: { type: 'coaching_show_plan' } as AdvanceChoice },
      { emoji: '✅', label: "I'm ready to fund",      choice: { type: 'ready' } as AdvanceChoice },
    ]
    return (
      <div className="px-4 pb-4 grid grid-cols-2 gap-2">
        {btns.map(b => (
          <Btn key={b.label} emoji={b.emoji} label={b.label} onClick={() => onAdvance(b.choice)} />
        ))}
      </div>
    )
  }

  if (stage === 'free') {
    const btns = lang === 'ru' ? [
      { emoji: '💰', label: 'Мой баланс' },
      { emoji: '📋', label: 'Бюджеты' },
      { emoji: '🎯', label: 'Цели' },
      { emoji: '💸', label: 'Внести ещё' },
    ] : lang === 'es' ? [
      { emoji: '💰', label: 'Mi saldo' },
      { emoji: '📋', label: 'Presupuestos' },
      { emoji: '🎯', label: 'Metas' },
      { emoji: '💸', label: 'Depositar más' },
    ] : lang === 'pt' ? [
      { emoji: '💰', label: 'Meu saldo' },
      { emoji: '📋', label: 'Orçamentos' },
      { emoji: '🎯', label: 'Metas' },
      { emoji: '💸', label: 'Depositar mais' },
    ] : [
      { emoji: '💰', label: 'My balance' },
      { emoji: '📋', label: 'Budgets' },
      { emoji: '🎯', label: 'Goals' },
      { emoji: '💸', label: 'Deposit more' },
    ]
    return (
      <div className="px-4 pb-4 grid grid-cols-2 gap-2">
        {btns.map(b => (
          <Btn key={b.label} emoji={b.emoji} label={b.label} onClick={() => {}} />
        ))}
      </div>
    )
  }

  return null
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  isConnected: boolean
  isDeployed: boolean
  vaultBalanceUsd: string
  categories: Category[]
  goals: Goal[]
  isPending: boolean
  isConfirming: boolean
  isSuccess: boolean
  lang: Lang
  onAction: (action: AIAction) => void
}

interface RichMessage extends ChatMessage {
  planSnapshot?: PlanSummary
}

export function AgentChat({
  isConnected, isDeployed, vaultBalanceUsd, categories, goals,
  isPending, isConfirming, isSuccess, lang, onAction,
}: Props) {
  const [messages, setMessages] = useState<RichMessage[]>(() => [makeIntroMessage(lang)])
  const [convState, setConvState] = useState<ConversationState>(() => ({
    ...initialConversationState(), lang,
  }))
  const [input, setInput] = useState('')
  const [hasTx, setHasTx] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevLang = useRef<Lang>(lang)
  const depositInFlight = useRef(false)

  const s = t(lang)

  // Reset on lang change
  useEffect(() => {
    if (prevLang.current !== lang) {
      prevLang.current = lang
      setMessages([makeIntroMessage(lang)])
      setConvState({ ...initialConversationState(), lang })
      setInput('')
      depositInFlight.current = false
    }
  }, [lang])

  // Reset deposit lock on success so user can deposit again
  useEffect(() => {
    if (isSuccess) depositInFlight.current = false
  }, [isSuccess])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSuccess, isTyping])

  // Derived display messages: append success confirmation
  const displayMessages: RichMessage[] = isSuccess && hasTx
    ? [...messages, { role: 'agent' as const, text: s.txDone, timestamp: 0 }]
    : messages

  const pushResult = useCallback((result: ReturnType<typeof forceAdvance>, userText?: string) => {
    const richReply: RichMessage = { ...result.reply, planSnapshot: result.planSummary }
    setMessages(prev => {
      const next = userText
        ? [...prev, { role: 'user' as const, text: userText, timestamp: performance.now() }, richReply]
        : [...prev, richReply]
      return next
    })
    setConvState(result.nextState)
    if (result.actions.length > 0) {
      setHasTx(true)
      result.actions.forEach(a => onAction(a))
    }
  }, [onAction])

  const handleAdvance = useCallback((choice: AdvanceChoice) => {
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      const result = forceAdvance(choice, convState)
      pushResult(result)
    }, 500)
  }, [convState, pushResult])

  const handleDeposit = useCallback((amount: string) => {
    if (depositInFlight.current) return   // prevent double-fire
    try { parseAmount(5042, amount) } catch { return }
    depositInFlight.current = true
    const action: AIAction = { type: 'deposit', amount }
    const msg = lang === 'ru' ? `Пополняю $${amount} USDC — подтверди в кошельке!`
      : lang === 'es' ? `¡Depositando $${amount} USDC! Confirma en tu billetera.`
      : lang === 'pt' ? `Depositando $${amount} USDC! Confirme na carteira.`
      : `Depositing $${amount} USDC — confirm in your wallet!`
    setMessages(prev => [...prev, { role: 'agent', text: msg, action, timestamp: 0 }])
    setHasTx(true)
    onAction(action)
    // Reset after 5s so user can deposit again later
    setTimeout(() => { depositInFlight.current = false }, 5000)
  }, [lang, onAction])

  const sendText = useCallback((text: string) => {
    if (!text.trim()) return
    setInput('')
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      const catData = categories.map(c => ({ name: c.name, spentUsd: c.spentUsd, limitUsd: c.limitUsd, pct: c.pct }))
      const goalData = goals.map(g => ({ name: g.name, savedUsd: g.savedUsd, targetUsd: g.targetUsd, pct: g.pct, completed: g.completed }))
      const result = handleMessage(text, convState, catData, goalData, vaultBalanceUsd, isConnected, isDeployed, lang)
      pushResult(result, text)
    }, 600)
  }, [convState, categories, goals, vaultBalanceUsd, isConnected, isDeployed, lang, pushResult])

  const placeholder = convState.stage === 'free' ? s.inputPlaceholderFree
    : convState.stage === 'coaching' ? s.inputPlaceholderCoaching
    : s.inputPlaceholderGuided

  const isLastAgent = displayMessages.length > 0 && displayMessages[displayMessages.length - 1].role === 'agent'

  const handlePlanReady = useCallback(() => handleAdvance({ type: 'ready' }), [handleAdvance])

  return (
    <div style={{ ...glass, minHeight: 480 }} className="rounded-3xl overflow-hidden flex flex-col">

      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b flex-shrink-0"
        style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.55)' }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#f9a8d4 0%,#f472b6 50%,#ec4899 100%)' }}>
          <Sparkles size={14} color="white" />
        </div>
        <div>
          <p className="brand text-base leading-none" style={{ color: 'var(--ink)' }}>
            {lang === 'ru' ? 'Фин' : 'Fin'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--subtle)' }}>{s.agentSubtitle}</p>
        </div>
        {(isPending || isConfirming) && (
          <div className="ml-auto flex items-center gap-1.5">
            <Loader2 size={13} className="animate-spin" style={{ color: '#111111' }} />
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              {isPending ? s.waitingForWallet : s.confirming2}
            </span>
          </div>
        )}
        {convState.stage === 'coaching' && !isPending && !isConfirming && (
          <div className="ml-auto text-xs px-2.5 py-1 rounded-full font-medium"
            style={{ background: 'rgba(244,114,182,0.12)', color: '#ec4899' }}>
            {s.coachingMode}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ minHeight: 240 }}>
        <AnimatePresence initial={false}>
          {displayMessages.map((msg, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {msg.role === 'agent' && (
                <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-1"
                  style={{ background: 'linear-gradient(135deg,#f9a8d4 0%,#ec4899 100%)' }}>
                  <Sparkles size={10} color="white" />
                </div>
              )}
              <div className="flex flex-col gap-2 max-w-2xl w-full">
                <div className="rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line"
                  style={msg.role === 'agent'
                    ? { background: 'rgba(255,255,255,0.95)', color: 'var(--ink)', border: '1px solid rgba(255,255,255,0.78)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderRadius: '4px 18px 18px 18px' }
                    : { background: '#111111', color: 'white', borderRadius: '18px 4px 18px 18px' }
                  }>
                  {msg.text}
                </div>
                {msg.showPieChart && msg.planSnapshot && (
                  <BudgetPieChart categories={msg.planSnapshot.categories}
                    monthlyIncome={msg.planSnapshot.monthlyIncome} lang={lang} onReady={handlePlanReady} />
                )}
                {msg.showPlanCard && !msg.showPieChart && msg.planSnapshot && (
                  <BudgetPlanCard plan={msg.planSnapshot} onReady={handlePlanReady} />
                )}
                {msg.showDepositCard && (
                  <DepositCard onDeposit={handleDeposit} lang={lang} />
                )}
              </div>
            </motion.div>
          ))}

          {isTyping && (
            <motion.div key="typing" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex gap-2.5">
              <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-1"
                style={{ background: 'linear-gradient(135deg,#f9a8d4 0%,#ec4899 100%)' }}>
                <Sparkles size={10} color="white" />
              </div>
              <div className="rounded-2xl px-4 py-3 flex gap-1 items-center"
                style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(255,255,255,0.78)', borderRadius: '4px 18px 18px 18px' }}>
                {[0, 1, 2].map(j => (
                  <motion.div key={j} className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--subtle)' }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: j * 0.2 }} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Stage action buttons — shown after last agent message */}
      {!isPending && !isConfirming && !isTyping && isLastAgent && (
        <StageButtons
          convState={convState}
          lang={lang}
          onAdvance={handleAdvance}
        />
      )}

      {/* Text input */}
      <div className="px-4 py-3 flex gap-2 border-t flex-shrink-0"
        style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.55)' }}>
        <input
          className="flex-1 rounded-xl px-3.5 py-2.5 text-sm outline-none"
          style={{ ...innerGlass, color: 'var(--ink)' }}
          placeholder={placeholder}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText(input) } }}
          disabled={isPending || isConfirming || isTyping}
        />
        <button onClick={() => sendText(input)}
          disabled={!input.trim() || isPending || isConfirming || isTyping}
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-35 active:scale-95"
          style={blackBtn}>
          <Send size={15} color="white" />
        </button>
      </div>
    </div>
  )
}
