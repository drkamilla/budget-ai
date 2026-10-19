/**
 * Fin — 8-stage conversational budget buddy.
 * Each stage has guaranteed-advance buttons; text input uses fuzzy matching.
 * Supports EN, ES, RU, PT with auto-detection from first message.
 */

import type { Lang } from '@/i18n'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AIAction =
  | { type: 'deposit'; amount: string }
  | { type: 'withdraw'; amount: string }
  | { type: 'create_category'; name: string; limit: string }
  | { type: 'create_goal'; name: string; target: string }
  | { type: 'fund_goal'; goalName: string; amount: string }
  | { type: 'withdraw_goal'; goalName: string; amount: string }
  | { type: 'spend'; recipient: string; categoryName: string; amount: string }
  | { type: 'show_budgets' }
  | { type: 'show_goals' }
  | { type: 'show_balance' }
  | { type: 'help' }
  | { type: 'noop' }
  | { type: 'unknown'; message: string }

export interface ChatMessage {
  role: 'user' | 'agent'
  text: string
  action?: AIAction
  showDepositCard?: boolean
  showPlanCard?: boolean
  showPieChart?: boolean
  timestamp: number
}

/**
 * The 8 stages of the guided onboarding conversation.
 * 'free' = post-deposit, open mode.
 */
export type ConversationStage =
  | 'intro'        // stage 0 — greeting, one big button
  | 'ask_why'      // stage 1 — why are you here
  | 'ask_income'   // stage 2 — income preset buttons
  | 'budget_plan'  // stage 3 — 50/30/20 plan + edit
  | 'ask_goal'     // stage 4 — savings goal presets
  | 'plan_review'  // stage 5 — pie + plan card
  | 'ask_deposit'  // stage 6 — deposit amount
  | 'coaching'     // stage 7 — no-pressure coaching
  | 'free'         // stage 8 — post-deposit free mode

export interface ConversationState {
  stage: ConversationStage
  monthlyIncome: string | null
  pendingCategories: Array<{ name: string; limit: string }>
  pendingGoal: { name: string; target: string } | null
  firstName: string | null
  lang: Lang
}

export const initialConversationState = (): ConversationState => ({
  stage: 'intro',
  monthlyIncome: null,
  pendingCategories: [],
  pendingGoal: null,
  firstName: null,
  lang: 'en',
})

export interface PlanSummary {
  monthlyIncome: string
  categories: Array<{ name: string; limit: string }>
  goal: { name: string; target: string } | null
}

// ─── Fuzzy matching ───────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^\wа-яёА-ЯЁ\s]/g, '').trim()
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
  return dp[m][n]
}

function fuzzyScore(input: string, variant: string): number {
  const a = normalize(input), b = normalize(variant)
  if (a === b) return 1.0
  if (a.includes(b) || b.includes(a)) return 0.85
  const dist = levenshtein(a, b)
  return 1 - dist / Math.max(a.length, b.length, 1)
}

function fuzzyMatch(input: string, variants: string[], threshold = 0.72): boolean {
  return variants.some(v => fuzzyScore(input, v) >= threshold)
}

// ─── Intent dictionaries ──────────────────────────────────────────────────────

const YES_VARIANTS = [
  'yes', 'yeah', 'yep', 'yup', 'sure', 'ok', 'okay', 'alright', 'sounds good',
  'let\'s go', 'go ahead', 'definitely', 'absolutely', 'of course', 'ready',
  'looks good', 'perfect', 'great', 'love it', 'i\'m in', 'do it', 'proceed',
  'si', 'sí', 'claro', 'dale', 'perfecto', 'listo', 'vamos', 'bueno',
  'да', 'давай', 'конечно', 'хорошо', 'ладно', 'поехали', 'готов', 'готова',
  'отлично', 'ок', 'окей', 'согласен', 'согласна', 'выглядит хорошо',
  'sim', 'claro', 'vamos', 'perfeito', 'ótimo', 'tudo bem',
]

const LATER_VARIANTS = [
  'later', 'not now', 'not yet', 'maybe later', 'skip', 'not ready', 'another time',
  'i\'ll think', 'need to think', 'maybe', 'hold on', 'wait',
  'más tarde', 'ahora no', 'luego', 'después', 'no estoy listo', 'saltar',
  'потом', 'позже', 'не сейчас', 'не готов', 'не готова', 'пока нет',
  'давай позже', 'подумаю', 'подожди', 'может быть',
  'depois', 'agora não', 'mais tarde', 'não estou pronto', 'pular',
]

const NO_VARIANTS = [
  'no', 'nope', 'nah', 'skip', 'that\'s all', 'done', 'enough', 'move on',
  'no', 'saltar', 'listo', 'eso es todo',
  'нет', 'всё', 'хватит', 'пропустить', 'это всё', 'дальше',
  'não', 'pular', 'isso é tudo', 'pronto',
]

const ENVELOPE_VARIANTS = [
  'envelope', 'how does', 'how do', 'explain', 'what is', 'what are', 'how it works',
  'конверт', 'как работ', 'что такое', 'объясни',
  'sobre', 'como funciona', 'que es',
  'envelope', 'como funciona', 'o que é',
]

const ADVICE_VARIANTS = [
  'advice', 'tip', 'suggest', 'coach', 'help me', 'idea',
  'совет', 'подсказка', 'помоги', 'идея',
  'consejo', 'ayuda', 'sugerencia',
  'dica', 'ajuda', 'sugestão',
]

const SHOW_PLAN_VARIANTS = [
  'show plan', 'my plan', 'overview', 'summary', 'show budget', 'show my',
  'показать план', 'мой план', 'покажи', 'план',
  'mi plan', 'ver plan', 'mostrar',
  'meu plano', 'ver plano', 'mostrar',
]

// ─── Auto-detect language ─────────────────────────────────────────────────────

export function detectLang(text: string): Lang | null {
  const t = text.toLowerCase()
  if (/[а-яё]/i.test(t)) return 'ru'
  if (/\b(hola|gracias|qué|cómo|también|más|está|estoy|bueno|sí|quiero|pero|para)\b/.test(t)) return 'es'
  if (/\b(olá|obrigado|você|também|está|quero|mas|para|sim|não)\b/.test(t)) return 'pt'
  return null
}

// ─── Budget calculation helpers ───────────────────────────────────────────────

export function suggestBudgets(income: number, lang: Lang): Array<{ name: string; limit: string }> {
  const names: Record<Lang, string[]> = {
    en: ['Rent', 'Groceries', 'Transport', 'Entertainment'],
    es: ['Renta', 'Comida', 'Transporte', 'Entretenimiento'],
    ru: ['Аренда', 'Продукты', 'Транспорт', 'Развлечения'],
    pt: ['Aluguel', 'Alimentação', 'Transporte', 'Entretenimento'],
  }
  const pcts = [0.30, 0.12, 0.08, 0.06]
  return names[lang].map((name, i) => ({
    name,
    limit: String(Math.round(income * pcts[i])),
  }))
}

export function buildPlanSummary(state: ConversationState): PlanSummary {
  return {
    monthlyIncome: state.monthlyIncome ?? '0',
    categories: state.pendingCategories,
    goal: state.pendingGoal,
  }
}

// ─── Localized copy ───────────────────────────────────────────────────────────

const L = {
  intro: {
    en: `Hey! I'm Fin — your personal money buddy. 👋\n\nMost people overspend because money just slips away. This app locks your USDC into onchain spending envelopes — your Food money literally can't be spent on something else.\n\nReady to build your first budget?`,
    es: `¡Hola! Soy Fin — tu asistente financiero personal. 👋\n\nLa mayoría gasta de más porque el dinero simplemente se escapa. Esta app bloquea tu USDC en sobres digitales — tu dinero de Comida literalmente no puede gastarse en otra cosa.\n\n¿Listo para crear tu primer presupuesto?`,
    ru: `Привет! Я Фин — твой личный финансовый помощник. 👋\n\nБольшинство людей тратят слишком много, потому что деньги просто утекают. Это приложение блокирует твои USDC в цифровых конвертах — деньги на еду буквально не могут уйти на что-то другое.\n\nГотов создать свой первый бюджет?`,
    pt: `Oi! Sou o Fin — seu assistente financeiro pessoal. 👋\n\nA maioria gasta demais porque o dinheiro simplesmente escorrega. Este app trava seu USDC em envelopes digitais — seu dinheiro de Comida literalmente não pode ser gasto em outra coisa.\n\nPronto para criar seu primeiro orçamento?`,
  },
  askWhy: {
    en: `What brought you here today? Pick the one that fits best:`,
    es: `¿Qué te trajo aquí hoy? Elige la que mejor te describa:`,
    ru: `Что привело тебя сюда? Выбери подходящий вариант:`,
    pt: `O que te trouxe aqui hoje? Escolha a que melhor se aplica:`,
  },
  whyResponse: {
    overspend: {
      en: `I hear you — money slips away before you even notice. Let's fix that together.\n\nFirst: roughly what's your monthly take-home pay?`,
      es: `Te entiendo — el dinero se escapa sin darte cuenta. Vamos a arreglarlo juntos.\n\nPrimero: ¿cuánto es tu ingreso mensual aproximado?`,
      ru: `Понимаю — деньги уходят незаметно. Давай разберёмся вместе.\n\nДля начала: примерно какой у тебя ежемесячный доход?`,
      pt: `Entendo — o dinheiro escorrega sem você perceber. Vamos resolver isso juntos.\n\nPrimeiro: qual é a sua renda mensal aproximada?`,
    },
    saving: {
      en: `A goal is a great motivator — nothing makes saving feel real like a destination. 🎯\n\nTo build a plan that gets you there: what's your monthly take-home pay?`,
      es: `¡Una meta es gran motivación! Nada hace que ahorrar se sienta más real que un destino. 🎯\n\nPara crear un plan que te lleve ahí: ¿cuánto ganas al mes?`,
      ru: `Цель — отличная мотивация. Ничто так не делает накопления реальными, как конкретный ориентир. 🎯\n\nЧтобы составить план: примерно какой у тебя доход в месяц?`,
      pt: `Uma meta é uma ótima motivação! Nada torna a poupança mais real do que um destino. 🎯\n\nPara criar um plano: qual é a sua renda mensal?`,
    },
    debt: {
      en: `Smart move thinking about this now. A clear budget is step one to getting ahead.\n\nWhat's your approximate monthly take-home pay?`,
      es: `Inteligente pensar en esto ahora. Un presupuesto claro es el primer paso.\n\n¿Cuánto es tu ingreso mensual aproximado?`,
      ru: `Умно думать об этом сейчас. Чёткий бюджет — первый шаг вперёд.\n\nКакой у тебя примерный ежемесячный доход?`,
      pt: `Inteligente pensar nisso agora. Um orçamento claro é o primeiro passo.\n\nQual é a sua renda mensal aproximada?`,
    },
    family: {
      en: `Family finances hit differently — there's so much more at stake. I'll help you get it sorted.\n\nFirst things first: what's the household monthly take-home?`,
      es: `Las finanzas familiares son otra cosa — hay mucho más en juego. Te ayudaré.\n\nPrimero: ¿cuánto es el ingreso mensual del hogar?`,
      ru: `Семейные финансы — другой уровень. Помогу разобраться.\n\nДля начала: какой общий доход семьи в месяц?`,
      pt: `Finanças familiares são outro nível — há muito mais em jogo. Vou te ajudar.\n\nPrimeiro: qual é a renda mensal familiar?`,
    },
  },
  askIncomeCustom: {
    en: `Type your monthly income and press Enter:`,
    es: `Escribe tu ingreso mensual y presiona Enter:`,
    ru: `Введи свой ежемесячный доход и нажми Enter:`,
    pt: `Digite sua renda mensal e pressione Enter:`,
  },
  budgetPlanIntro: {
    en: (income: number, lines: string) => `Based on $${income.toLocaleString()}/mo, here's your starter plan using the 50/30/20 rule:\n\n${lines}\n\nAccept this plan, tweak the amounts, or add a category?`,
    es: (income: number, lines: string) => `Con $${income.toLocaleString()}/mes, aquí tienes tu plan inicial con la regla 50/30/20:\n\n${lines}\n\n¿Aceptas el plan, ajustas los montos o añades una categoría?`,
    ru: (income: number, lines: string) => `При доходе $${income.toLocaleString()}/мес, вот стартовый план по правилу 50/30/20:\n\n${lines}\n\nПринять план, изменить суммы или добавить категорию?`,
    pt: (income: number, lines: string) => `Com $${income.toLocaleString()}/mês, aqui está seu plano inicial com a regra 50/30/20:\n\n${lines}\n\nAceitar o plano, ajustar os valores ou adicionar uma categoria?`,
  },
  goalIntro: {
    en: `Is there something you're saving toward? Pick a goal or create your own:`,
    es: `¿Hay algo para lo que estés ahorrando? Elige una meta o crea la tuya:`,
    ru: `Есть ли что-то, ради чего ты копишь? Выбери цель или создай свою:`,
    pt: `Há algo pelo qual você está economizando? Escolha uma meta ou crie a sua:`,
  },
  goalPresets: {
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
  },
  planReview: {
    en: `Here's your complete budget breakdown! How does it look?`,
    es: `¡Aquí está tu plan completo! ¿Qué te parece?`,
    ru: `Вот твой полный план бюджета! Как выглядит?`,
    pt: `Aqui está o seu plano completo! O que você acha?`,
  },
  depositIntro: {
    en: `Let's go! 🎉 How much USDC do you want to start with? Even $25 is enough to see the whole system in action.`,
    es: `¡Vamos! 🎉 ¿Cuánto USDC quieres depositar? Incluso $25 es suficiente para ver el sistema en acción.`,
    ru: `Поехали! 🎉 Сколько USDC хочешь внести? Даже $25 достаточно, чтобы увидеть всё в действии.`,
    pt: `Vamos lá! 🎉 Quanto USDC você quer depositar? Até $25 é suficiente para ver o sistema funcionando.`,
  },
  laterReply: {
    en: (tip: string) => `No problem at all — take your time! 😊\n\n${tip}\n\nFeel free to ask how the envelopes work, get savings tips, or say "show my plan" anytime.`,
    es: (tip: string) => `¡Sin problema — tómate tu tiempo! 😊\n\n${tip}\n\nPuedes preguntarme cómo funcionan los sobres, pedir consejos o decir "ver mi plan".`,
    ru: (tip: string) => `Не торопись, всё хорошо! 😊\n\n${tip}\n\nМожешь спросить, как работают конверты, попросить советы или сказать «показать мой план».`,
    pt: (tip: string) => `Sem problema — tome seu tempo! 😊\n\n${tip}\n\nPode me perguntar como os envelopes funcionam, pedir dicas ou dizer "ver meu plano".`,
  },
  coachFallback: {
    en: `I'm here! Ask how the envelopes work, want savings tips, or say "show my plan". No rush on funding. 😊`,
    es: `¡Aquí estoy! Pregúntame cómo funcionan los sobres, pide consejos o di "ver mi plan". Sin prisa. 😊`,
    ru: `Я здесь! Спроси, как работают конверты, попроси совет или скажи «показать мой план». Не торопись. 😊`,
    pt: `Estou aqui! Pergunte como os envelopes funcionam, peça dicas ou diga "ver meu plano". Sem pressa. 😊`,
  },
  envelopeExplain: {
    en: `Think of onchain envelopes like sealed digital jars. Each jar has a label — "Rent", "Groceries", "Vacation fund".\n\nOnce money goes in, the smart contract ensures it can only leave for its intended purpose. A spreadsheet trusts you. An onchain envelope enforces you. Your rent money stays safe even on a midnight impulse-buy scroll. 🔒`,
    es: `Piensa en los sobres digitales como jarras selladas. Cada una tiene una etiqueta — "Renta", "Comida", "Vacaciones".\n\nUna vez que el dinero entra, el contrato inteligente garantiza que solo puede salir para su propósito. Una hoja de cálculo confía en ti. Un sobre digital te impone disciplina. 🔒`,
    ru: `Представь цифровые конверты как запечатанные банки. У каждой — этикетка: «Аренда», «Продукты», «Отпуск».\n\nКогда деньги туда попадают, смарт-контракт гарантирует, что они могут уйти только по назначению. Таблица доверяет тебе. Конверт заставляет тебя соблюдать правила. 🔒`,
    pt: `Pense nos envelopes digitais como potes lacrados. Cada um tem um rótulo — "Aluguel", "Comida", "Férias".\n\nUma vez que o dinheiro entra, o contrato inteligente garante que só pode sair para o propósito certo. Uma planilha confia em você. Um envelope digital te disciplina. 🔒`,
  },
  freeWelcome: {
    en: `Your envelopes are live! 🎉 What would you like to do?`,
    es: `¡Tus sobres están activos! 🎉 ¿Qué quieres hacer?`,
    ru: `Твои конверты активны! 🎉 Что сделаем?`,
    pt: `Seus envelopes estão ativos! 🎉 O que você gostaria de fazer?`,
  },
  depositConfirm: {
    en: (amt: string) => `Depositing $${amt} USDC — your wallet will ask for approval first, then the deposit. Two quick taps.`,
    es: (amt: string) => `¡Depositando $${amt} USDC! Tu billetera pedirá aprobación primero. Dos toques rápidos.`,
    ru: (amt: string) => `Пополняю $${amt} USDC — сначала кошелёк попросит одобрить, затем депозит. Два подтверждения.`,
    pt: (amt: string) => `Depositando $${amt} USDC! Sua carteira pedirá aprovação primeiro. Duas confirmações rápidas.`,
  },
  noConnect: {
    en: `Before we dive in, connect your wallet — hit the button up top and I'll be right here! 👆`,
    es: `Antes de empezar, conecta tu billetera — ¡pulsa el botón de conectar arriba! 👆`,
    ru: `Сначала подключи кошелёк — нажми кнопку вверху! 👆`,
    pt: `Antes de começar, conecte sua carteira — clique no botão acima! 👆`,
  },
}

function buildCoachingTip(state: ConversationState): string {
  const lang = state.lang
  const cats = state.pendingCategories
  const goal = state.pendingGoal
  const goalName = goal?.name ?? (
    lang === 'ru' ? 'твоей цели' :
    lang === 'es' ? 'tu meta' :
    lang === 'pt' ? 'sua meta' : 'your goal'
  )

  const fun = cats.find(c => /coffee|cafe|dining|entertainment|кофе|развлечения|café|entretenimiento|alimentação/i.test(c.name))
  if (fun) {
    const half = Math.round(parseFloat(fun.limit) / 2)
    if (lang === 'ru') return `Смотрю на твой план: ты выделил $${fun.limit}/мес на «${fun.name}». Если сократить вдвое — $${half}/мес пойдут прямо на ${goalName}. Это складывается быстро!`
    if (lang === 'es') return `Mirando tu plan: tienes $${fun.limit}/mes para "${fun.name}". Reducirlo a la mitad redirige $${half}/mes directo a ${goalName}. ¡Eso se acumula rápido!`
    if (lang === 'pt') return `Olhando seu plano: você tem $${fun.limit}/mês para "${fun.name}". Reduzir à metade redireciona $${half}/mês para ${goalName}. Isso acumula rápido!`
    return `Looking at your plan: you've budgeted $${fun.limit}/mo for "${fun.name}". Cutting that back by half could redirect $${half}/mo straight into ${goalName} — that adds up fast!`
  }

  const total = cats.reduce((s, c) => s + parseFloat(c.limit || '0'), 0)
  const income = parseFloat(state.monthlyIncome ?? '0')
  const leftover = income > 0 ? Math.max(0, income - total) : 0
  if (income > 0 && leftover > 50) {
    if (lang === 'ru') return `После всех конвертов у тебя остаётся ~$${Math.round(leftover)}/мес. Даже половина этого ускорит ${goalName}!`
    if (lang === 'es') return `Después de todos los sobres, te sobran ~$${Math.round(leftover)}/mes. ¡Incluso la mitad de eso acelera ${goalName}!`
    if (lang === 'pt') return `Depois de todos os envelopes, sobram ~$${Math.round(leftover)}/mês. Até metade disso aceleraria ${goalName}!`
    return `After all your envelopes, you have ~$${Math.round(leftover)} left each month. Even half of that toward ${goalName} would get you there faster!`
  }

  if (lang === 'ru') return `Настоящая магия конвертов: правила зашиты в код. Как только деньги на аренду попадают в конверт — они буквально не могут уйти на импульсивные покупки.`
  if (lang === 'es') return `La verdadera magia de los sobres es que las reglas están en el código. Una vez que el dinero de la renta entra — literalmente no puede salir en compras impulsivas.`
  if (lang === 'pt') return `A verdadeira magia dos envelopes é que as regras estão no código. Uma vez que o dinheiro do aluguel entra — literalmente não pode sair em compras impulsivas.`
  return `The real magic: the rules are baked into code. Once your rent envelope is funded, that money literally cannot leave through any other category — discipline without willpower.`
}

// ─── Intro message ────────────────────────────────────────────────────────────

export function makeIntroMessage(lang: Lang): ChatMessage {
  return { role: 'agent', text: L.intro[lang], timestamp: 0 }
}

// ─── Result types ─────────────────────────────────────────────────────────────

export interface ConversationResult {
  reply: ChatMessage
  actions: AIAction[]
  nextState: ConversationState
  planSummary?: PlanSummary
}

function reply(text: string, actions: AIAction[], nextState: ConversationState): ConversationResult {
  return { reply: { role: 'agent', text, timestamp: 0 }, actions, nextState }
}
function replyPie(text: string, nextState: ConversationState, plan: PlanSummary): ConversationResult {
  return { reply: { role: 'agent', text, showPieChart: true, showPlanCard: true, timestamp: 0 }, actions: [], nextState, planSummary: plan }
}
function replyPlan(text: string, nextState: ConversationState, plan: PlanSummary): ConversationResult {
  return { reply: { role: 'agent', text, showPlanCard: true, timestamp: 0 }, actions: [], nextState, planSummary: plan }
}
function replyDeposit(text: string, nextState: ConversationState): ConversationResult {
  return { reply: { role: 'agent', text, showDepositCard: true, timestamp: 0 }, actions: [], nextState }
}

// ─── Force-advance (button clicks bypass parsing entirely) ────────────────────

export type AdvanceChoice =
  | { type: 'greet' }
  | { type: 'why'; reason: 'overspend' | 'saving' | 'debt' | 'family' }
  | { type: 'income'; amount: string }
  | { type: 'accept_plan' }
  | { type: 'goal_preset'; name: string; target: string }
  | { type: 'skip_goal' }
  | { type: 'ready' }
  | { type: 'later' }
  | { type: 'coaching_tip' }
  | { type: 'coaching_envelope' }
  | { type: 'coaching_show_plan' }

export function forceAdvance(
  choice: AdvanceChoice,
  state: ConversationState,
): ConversationResult {
  const next: ConversationState = { ...state, pendingCategories: [...state.pendingCategories] }
  const lang = state.lang

  switch (choice.type) {
    case 'greet': {
      next.stage = 'ask_why'
      return reply(L.askWhy[lang], [], next)
    }
    case 'why': {
      next.stage = 'ask_income'
      return reply(L.whyResponse[choice.reason][lang], [], next)
    }
    case 'income': {
      const income = parseFloat(choice.amount)
      next.monthlyIncome = String(income)
      next.pendingCategories = suggestBudgets(income, lang)
      next.stage = 'budget_plan'
      const lines = next.pendingCategories.map(c => `• ${c.name} — $${c.limit}/mo`).join('\n')
      return reply(L.budgetPlanIntro[lang](income, lines), [], next)
    }
    case 'accept_plan': {
      next.stage = 'ask_goal'
      return reply(L.goalIntro[lang], [], next)
    }
    case 'goal_preset': {
      next.pendingGoal = { name: choice.name, target: choice.target }
      next.stage = 'plan_review'
      const plan = buildPlanSummary(next)
      return replyPie(L.planReview[lang], next, plan)
    }
    case 'skip_goal': {
      next.stage = 'plan_review'
      const plan = buildPlanSummary(next)
      return replyPie(L.planReview[lang], next, plan)
    }
    case 'ready': {
      next.stage = 'ask_deposit'
      return replyDeposit(L.depositIntro[lang], next)
    }
    case 'later': {
      next.stage = 'coaching'
      const plan = buildPlanSummary(next)
      return replyPlan(L.laterReply[lang](buildCoachingTip(next)), next, plan)
    }
    case 'coaching_tip': {
      return reply(buildCoachingTip(next), [], next)
    }
    case 'coaching_envelope': {
      return reply(L.envelopeExplain[lang], [], next)
    }
    case 'coaching_show_plan': {
      const plan = buildPlanSummary(next)
      return replyPlan(lang === 'ru' ? 'Вот твой план!' : lang === 'es' ? '¡Aquí tu plan!' : lang === 'pt' ? 'Aqui seu plano!' : 'Here\'s your budget plan!', next, plan)
    }
    default:
      return reply('', [], next)
  }
}

// ─── Text input handler (fuzzy-matched fallback) ──────────────────────────────

export function handleMessage(
  userText: string,
  state: ConversationState,
  categories: Array<{ name: string; spentUsd: string; limitUsd: string; pct: number }>,
  goals: Array<{ name: string; savedUsd: string; targetUsd: string; pct: number; completed: boolean }>,
  vaultBalanceUsd: string,
  isConnected: boolean,
  _isDeployed: boolean,
  langOverride: Lang = 'en',
): ConversationResult {
  const text = userText.trim()
  const lower = text.toLowerCase()

  // Auto-detect language from first meaningful message
  const next: ConversationState = { ...state, pendingCategories: [...state.pendingCategories] }
  const detected = detectLang(text)
  if (detected && next.stage === 'intro') next.lang = detected
  const lang = next.lang || langOverride

  if (!isConnected) return reply(L.noConnect[lang], [], next)

  // Extract first name from any message
  if (!next.firstName) {
    const m = text.match(/\b(?:i'?m|name is|меня зовут|я|soy|me llamo|meu nome é)\s+([A-ZА-Яa-zа-яА-Я][a-zа-яА-Я]+)/i)
    if (m) next.firstName = m[1]
  }

  // ── Stage: intro ──────────────────────────────────────────────────────────
  if (state.stage === 'intro') {
    if (detected) next.lang = detected
    next.stage = 'ask_why'
    return reply(L.askWhy[lang], [], next)
  }

  // ── Stage: ask_why ────────────────────────────────────────────────────────
  if (state.stage === 'ask_why') {
    // Fuzzy-match to one of the 4 preset reasons
    if (fuzzyMatch(lower, ['saving', 'goal', 'копить', 'цель', 'ahorro', 'meta', 'poupança'])) return forceAdvance({ type: 'why', reason: 'saving' }, next)
    if (fuzzyMatch(lower, ['debt', 'loan', 'minus', 'долг', 'минус', 'deuda', 'dívida'])) return forceAdvance({ type: 'why', reason: 'debt' }, next)
    if (fuzzyMatch(lower, ['family', 'семья', 'familia', 'família', 'kids', 'дети'])) return forceAdvance({ type: 'why', reason: 'family' }, next)
    // Default → overspend
    return forceAdvance({ type: 'why', reason: 'overspend' }, next)
  }

  // ── Stage: ask_income ─────────────────────────────────────────────────────
  if (state.stage === 'ask_income') {
    const kMatch = text.match(/(\d[\d,]*(?:\.\d+)?)\s*k/i)
    const numMatch = text.match(/\$?\s*(\d[\d,]*(?:\.\d+)?)/)
    const raw = kMatch ? parseFloat(kMatch[1].replace(',', '')) * 1000
      : numMatch ? parseFloat(numMatch[1].replace(',', '')) : null
    if (raw && raw >= 100) return forceAdvance({ type: 'income', amount: String(raw) }, next)
    const badMsg = lang === 'ru' ? 'Не поймал цифру — введи сумму, например $3,500 или 5k.' :
      lang === 'es' ? 'No entendí — escribe una cifra, como $3,500 o 5k.' :
      lang === 'pt' ? 'Não entendi — digite um valor, como $3.500 ou 5k.' :
      'I didn\'t catch a number — try something like $3,500 or 5k.'
    return reply(badMsg, [], next)
  }

  // ── Stage: budget_plan ────────────────────────────────────────────────────
  if (state.stage === 'budget_plan') {
    if (fuzzyMatch(lower, YES_VARIANTS)) return forceAdvance({ type: 'accept_plan' }, next)
    if (fuzzyMatch(lower, NO_VARIANTS)) return forceAdvance({ type: 'accept_plan' }, next)
    return forceAdvance({ type: 'accept_plan' }, next) // catch-all
  }

  // ── Stage: ask_goal ───────────────────────────────────────────────────────
  if (state.stage === 'ask_goal') {
    if (fuzzyMatch(lower, LATER_VARIANTS) || fuzzyMatch(lower, NO_VARIANTS)) return forceAdvance({ type: 'skip_goal' }, next)
    // Try to parse "Name, $amount"
    const amtMatch = text.match(/\$?\s*(\d[\d,]*(?:\.\d+)?)/)
    const nameMatch = text.match(/^([^,$\d]{2,40?}?)[\s,]+\$?[\d]/)
    if (amtMatch && nameMatch) {
      const gname = nameMatch[1].trim()
      return forceAdvance({ type: 'goal_preset', name: gname, target: amtMatch[1].replace(',', '') }, next)
    }
    // preset keyword fallback
    const presets = L.goalPresets[lang]
    const matched = presets.find(p => fuzzyMatch(lower, [p.name.toLowerCase()]))
    if (matched) return forceAdvance({ type: 'goal_preset', name: matched.name, target: matched.target }, next)
    return forceAdvance({ type: 'skip_goal' }, next)
  }

  // ── Stage: plan_review ────────────────────────────────────────────────────
  if (state.stage === 'plan_review') {
    if (fuzzyMatch(lower, LATER_VARIANTS)) return forceAdvance({ type: 'later' }, next)
    if (fuzzyMatch(lower, YES_VARIANTS)) return forceAdvance({ type: 'ready' }, next)
    return replyPie(L.planReview[lang], next, buildPlanSummary(next))
  }

  // ── Stage: ask_deposit ────────────────────────────────────────────────────
  if (state.stage === 'ask_deposit') {
    const kMatch = text.match(/(\d[\d,]*(?:\.\d+)?)\s*k/i)
    const numMatch = text.match(/\$?\s*(\d[\d,]*(?:\.\d+)?)/)
    const raw = kMatch ? parseFloat(kMatch[1]) * 1000 : numMatch ? parseFloat(numMatch[1].replace(',', '')) : null
    if (raw && raw > 0) {
      const amount = String(raw)
      next.stage = 'free'
      return {
        reply: { role: 'agent', text: L.depositConfirm[lang](amount), action: { type: 'deposit', amount }, timestamp: 0 },
        actions: [{ type: 'deposit', amount }],
        nextState: next,
      }
    }
    if (fuzzyMatch(lower, LATER_VARIANTS)) return forceAdvance({ type: 'later' }, next)
    return replyDeposit(L.depositIntro[lang], next)
  }

  // ── Stage: coaching ───────────────────────────────────────────────────────
  if (state.stage === 'coaching') {
    if (fuzzyMatch(lower, YES_VARIANTS)) return forceAdvance({ type: 'ready' }, next)
    if (fuzzyMatch(lower, ENVELOPE_VARIANTS)) return forceAdvance({ type: 'coaching_envelope' }, next)
    if (fuzzyMatch(lower, ADVICE_VARIANTS)) return forceAdvance({ type: 'coaching_tip' }, next)
    if (fuzzyMatch(lower, SHOW_PLAN_VARIANTS)) return forceAdvance({ type: 'coaching_show_plan' }, next)
    return reply(L.coachFallback[lang], [], next)
  }

  // ── Stage: free ───────────────────────────────────────────────────────────
  const action = parseCommand(text)
  return {
    reply: buildFreeReply(action, categories, goals, vaultBalanceUsd, next.firstName, lang),
    actions: isTransactional(action) ? [action] : [],
    nextState: next,
  }
}

// ─── Free-mode command parser ─────────────────────────────────────────────────

const AMOUNT_RE = /\$?\s*([\d,]+(?:\.\d{1,2})?)\s*[kK]?\b/
const K_RE = /\$?\s*([\d,]+(?:\.\d{1,2})?)\s*[kK]\b/

function extractAmount(text: string): string | null {
  const kMatch = text.match(K_RE)
  if (kMatch) return String(parseFloat(kMatch[1].replace(',', '')) * 1000)
  const m = text.match(AMOUNT_RE)
  return m ? m[1].replace(',', '') : null
}

const CATEGORY_KEYWORDS = [
  'food','rent','groceries','transport','travel','entertainment','health',
  'utilities','shopping','dining','coffee','gym','subscriptions','bills',
  'clothing','mortgage','insurance',
  'comida','alquiler','transporte','entretenimiento','salud','café','ropa',
  'еда','аренда','транспорт','развлечения','здоровье','кофе','одежда','продукты',
  'alimentação','aluguel','academia',
]

function inferCategory(text: string): string | null {
  const lower = text.toLowerCase()
  return CATEGORY_KEYWORDS.find(k => lower.includes(k)) ?? null
}

function extractQuoted(text: string): string | null {
  const m = text.match(/["']([^"']+)["']/)
  return m ? m[1] : null
}

export function parseCommand(input: string): AIAction {
  const text = input.trim()
  const lower = text.toLowerCase()

  if (/\b(deposit|add|put in|top up|пополнить|добавить|depositar|adicionar)\b/.test(lower)) {
    const amount = extractAmount(text)
    if (amount) return { type: 'deposit', amount }
  }
  if (/\b(withdraw|take out|cash out|вывести|снять|retirar|sacar)\b/.test(lower)) {
    const amount = extractAmount(text)
    if (amount) return { type: 'withdraw', amount }
  }
  if (/\b(set|create|add|make|crear|создать|définir|estabelecer)\b.*(budget|category|limit|presupuesto|категори|orçamento|бюджет)\b/.test(lower)) {
    const amount = extractAmount(text)
    const cat = extractQuoted(text) ?? inferCategory(lower)
    if (amount && cat) return { type: 'create_category', name: cat, limit: amount }
  }
  if (/\b(save|saving|goal|set aside|копить|накопить|ahorrar|meta|economizar)\b/.test(lower)) {
    const amount = extractAmount(text)
    const goalName = extractQuoted(text) ?? 'Savings'
    if (amount) return { type: 'create_goal', name: goalName, target: amount }
  }
  if (/\b(fund|add to|contribute|пополнить цель|financiar)\b/.test(lower)) {
    const amount = extractAmount(text)
    const goalName = extractQuoted(text) ?? 'Savings'
    if (amount) return { type: 'fund_goal', goalName, amount }
  }
  if (/\b(spend|send|pay|transfer|потратить|отправить|gastar|enviar)\b/.test(lower)) {
    const amount = extractAmount(text)
    const addrMatch = text.match(/0x[a-fA-F0-9]{40}/)
    const cat = inferCategory(lower) ?? extractQuoted(text)
    if (amount && addrMatch) return { type: 'spend', recipient: addrMatch[0], categoryName: cat ?? 'General', amount }
  }
  if (/\b(show|view|list|budgets|categories|бюджет|presupuesto|orçamento)\b/.test(lower)) return { type: 'show_budgets' }
  if (/\b(goals|savings|цели|metas|poupança)\b/.test(lower)) return { type: 'show_goals' }
  if (/\b(balance|how much|wallet|vault|баланс|сколько|saldo|quanto)\b/.test(lower)) return { type: 'show_balance' }
  if (/\b(help|ayuda|помощь|ajuda)\b/.test(lower)) return { type: 'help' }
  return { type: 'unknown', message: text }
}

function isTransactional(a: AIAction): boolean {
  return a.type !== 'unknown' && a.type !== 'help' && a.type !== 'noop' &&
    a.type !== 'show_balance' && a.type !== 'show_budgets' && a.type !== 'show_goals'
}

function buildFreeReply(
  action: AIAction,
  categories: Array<{ name: string; spentUsd: string; limitUsd: string; pct: number }>,
  goals: Array<{ name: string; savedUsd: string; targetUsd: string; pct: number; completed: boolean }>,
  vaultBalanceUsd: string,
  firstName: string | null,
  lang: Lang,
): ChatMessage {
  const n = firstName ? `, ${firstName}` : ''
  let text = ''
  switch (action.type) {
    case 'deposit':
      text = lang === 'ru' ? `Пополняю $${action.amount} USDC — сначала одобри в кошельке.`
        : lang === 'es' ? `¡Depositando $${action.amount} USDC! Confirma en tu billetera.`
        : lang === 'pt' ? `Depositando $${action.amount} USDC! Confirme na carteira.`
        : `Depositing $${action.amount} USDC${n} — confirm in your wallet.`; break
    case 'withdraw':
      text = lang === 'ru' ? `Вывожу $${action.amount} в кошелёк.`
        : lang === 'es' ? `Retirando $${action.amount} a tu billetera.`
        : lang === 'pt' ? `Retirando $${action.amount} para sua carteira.`
        : `Withdrawing $${action.amount} to your wallet.`; break
    case 'create_category':
      text = lang === 'ru' ? `Создаю конверт «${action.name}» — $${action.limit}/мес.`
        : lang === 'es' ? `Creando sobre "${action.name}" — $${action.limit}/mes.`
        : lang === 'pt' ? `Criando envelope "${action.name}" — $${action.limit}/mês.`
        : `Creating a "${action.name}" envelope — $${action.limit}/mo.`; break
    case 'create_goal':
      text = lang === 'ru' ? `Цель «${action.name}» — $${action.target}. Создаю!`
        : lang === 'es' ? `Meta "${action.name}" — objetivo $${action.target}. ¡Creando!`
        : lang === 'pt' ? `Meta "${action.name}" — alvo $${action.target}. Criando!`
        : `"${action.name}" goal — target $${action.target}. Creating!`; break
    case 'show_balance':
      text = lang === 'ru' ? `Баланс хранилища: $${vaultBalanceUsd} USDC.`
        : lang === 'es' ? `Saldo en bóveda: $${vaultBalanceUsd} USDC.`
        : lang === 'pt' ? `Saldo no cofre: $${vaultBalanceUsd} USDC.`
        : `Your vault balance is $${vaultBalanceUsd} USDC${n}.`; break
    case 'show_budgets':
      text = categories.length === 0
        ? (lang === 'ru' ? 'Конвертов ещё нет.' : lang === 'es' ? 'Aún no hay sobres.' : lang === 'pt' ? 'Ainda não há envelopes.' : 'No envelopes yet.')
        : categories.map(c => `${c.pct >= 90 ? '🔴' : c.pct >= 70 ? '🟡' : '🟢'} ${c.name}: $${c.spentUsd}/$${c.limitUsd} (${c.pct}%)`).join('\n')
      break
    case 'show_goals':
      text = goals.length === 0
        ? (lang === 'ru' ? 'Целей пока нет.' : lang === 'es' ? 'Aún no hay metas.' : lang === 'pt' ? 'Ainda não há metas.' : 'No goals yet.')
        : goals.map(g => `${g.completed ? '✅' : '🎯'} ${g.name}: $${g.savedUsd}/$${g.targetUsd} (${g.pct}%)`).join('\n')
      break
    case 'help':
      text = lang === 'ru'
        ? `Что я умею:\n• Пополнить — «Пополнить $100»\n• Вывести — «Вывести $50»\n• Конверт — «Бюджет на еду $200»\n• Цель — «Накопить $1,000 на отпуск»\n• Баланс — «Каков мой баланс?»`
        : lang === 'es' ? `Puedo:\n• Depositar — "Depositar $100"\n• Retirar — "Retirar $50"\n• Crear sobre — "$200 comida"\n• Crear meta — "Ahorrar $1,000 vacaciones"\n• Saldo — "¿Mi saldo?"`
        : lang === 'pt' ? `Posso:\n• Depositar — "Depositar $100"\n• Retirar — "Retirar $50"\n• Criar envelope — "$200 alimentação"\n• Criar meta — "Economizar $1.000 férias"\n• Saldo — "Meu saldo?"`
        : `I can:\n• Deposit — "Deposit $100"\n• Withdraw — "Withdraw $50"\n• Create envelope — "Set a $200 food budget"\n• Create goal — "Save $1,000 for vacation"\n• Balance — "What's my balance?"`
      break
    default:
      text = lang === 'ru' ? `Не совсем понял${n}. Скажи «помощь» чтобы увидеть, что я умею.`
        : lang === 'es' ? `No entendí${n}. Di "ayuda" para ver lo que puedo hacer.`
        : lang === 'pt' ? `Não entendi${n}. Diga "ajuda" para ver o que posso fazer.`
        : `I'm not sure what you mean${n}. Say "help" to see what I can do.`
  }
  return { role: 'agent', text, action, timestamp: 0 }
}
