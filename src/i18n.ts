/**
 * i18n — all user-facing strings for EN, ES, RU, PT.
 * Every key is required in every language so TypeScript enforces completeness.
 */

export type Lang = 'en' | 'es' | 'ru' | 'pt'

export const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
  { code: 'en', label: 'English',    flag: '🇺🇸' },
  { code: 'es', label: 'Español',    flag: '🇪🇸' },
  { code: 'ru', label: 'Русский',    flag: '🇷🇺' },
  { code: 'pt', label: 'Português',  flag: '🇧🇷' },
]

export interface Strings {
  // App shell
  appName: string
  networkBadge: string
  tabChat: string
  tabBudgets: string
  tabGoals: string
  connectPrompt: string
  emptyNudge: string

  // Hero card
  vaultBalance: string
  walletAvailable: string
  heroTagline1: string
  heroTagline2: string
  heroSubline: string
  contractNotDeployed: string

  // Budget list
  budgetCategories: string
  category: string
  categories: string
  noBudgets: string
  pctUsed: string
  remaining: string

  // Goal list
  savingsGoals: string
  complete: string
  noGoals: string
  pctSaved: string
  toGo: string
  goalComplete: string

  // Tx status
  confirmInWallet: string
  confirming: string
  txConfirmed: string
  explorer: string
  cancelled: string
  insufficientBalance: string
  categoryLimitExceeded: string
  txFailed: string

  // Agent chat UI
  agentSubtitle: string
  waitingForWallet: string
  confirming2: string
  coachingMode: string
  txDone: string
  inputPlaceholderGuided: string
  inputPlaceholderCoaching: string
  inputPlaceholderFree: string
  depositTitle: string
  depositBtn: string
  planReadyBtn: string
  planNoRush: string
  planIncome: string
  planEnvelopes: string
  planSavingsGoal: string
  planLeftover: string

  // Withdraw
  withdrawLabel: string
  withdrawConfirmBtn: string

  // Emergency withdraw
  emergencyWithdrawLabel: string
  emergencyWithdrawConfirmTitle: string
  emergencyWithdrawConfirmDesc: string
  emergencyWithdrawConfirmBtn: string
  emergencyWithdrawCancelBtn: string
  emergencyWithdrawDone: string

  // Quick replies per stage
  qr_intro: string[]
  qr_ask_why: string[]
  qr_ask_income: string[]
  qr_ask_first_budget: string[]
  qr_ask_more_budgets: string[]
  qr_ask_goal: string[]
  qr_plan_review: string[]
  qr_coaching: string[]
  qr_ask_deposit: string[]
  qr_free: string[]
}

const en: Strings = {
  appName: 'BudgetAI',
  networkBadge: 'Arc Mainnet',
  tabChat: 'Fin',
  tabBudgets: 'Budgets',
  tabGoals: 'Goals',
  connectPrompt: 'Connect your wallet to view this.',
  emptyNudge: 'Switch to the Fin tab and say "Set a $200 Food budget" to get started.',

  vaultBalance: 'Vault Balance',
  walletAvailable: 'available in wallet',
  heroTagline1: 'Smart budgeting,',
  heroTagline2: 'powered by USDC.',
  heroSubline: 'Connect your wallet to get started',
  contractNotDeployed: 'Contract not yet deployed. Deploy to start budgeting onchain.',

  budgetCategories: 'Budget Categories',
  category: 'category',
  categories: 'categories',
  noBudgets: 'No budget categories yet. Ask the agent to set one up.',
  pctUsed: '% used',
  remaining: 'remaining',

  savingsGoals: 'Savings Goals',
  complete: 'complete',
  noGoals: 'No savings goals yet. Ask the agent to create one.',
  pctSaved: '% saved',
  toGo: 'to go',
  goalComplete: 'Complete',

  confirmInWallet: 'Confirm in wallet…',
  confirming: 'confirming onchain…',
  txConfirmed: 'confirmed',
  explorer: 'Explorer',
  cancelled: 'Cancelled.',
  insufficientBalance: 'Insufficient balance.',
  categoryLimitExceeded: 'Category limit would be exceeded.',
  txFailed: 'Transaction failed. Please try again.',

  agentSubtitle: 'Your budget buddy',
  waitingForWallet: 'Waiting for wallet…',
  confirming2: 'Confirming…',
  coachingMode: 'Coaching mode',
  txDone: 'Done! Transaction confirmed onchain. Your balances will update in a moment. 🎉',
  inputPlaceholderGuided: 'Type a reply…',
  inputPlaceholderCoaching: 'Ask me anything…',
  inputPlaceholderFree: 'Say anything…',
  depositTitle: 'Deposit USDC',
  depositBtn: 'Deposit',
  planReadyBtn: "I'm ready to fund my vault",
  planNoRush: 'Or just say "later" — no rush at all 😊',
  planIncome: 'Monthly income',
  planEnvelopes: 'Envelopes',
  planSavingsGoal: 'Savings goal',
  planLeftover: 'Leftover / savings buffer',

  withdrawLabel: 'Withdraw USDC',
  withdrawConfirmBtn: 'Withdraw',
  emergencyWithdrawLabel: 'Emergency Withdraw',
  emergencyWithdrawConfirmTitle: 'Withdraw everything?',
  emergencyWithdrawConfirmDesc: 'This will move 100% of your vault balance and all savings goal funds back to your wallet instantly. No fees, no penalties.',
  emergencyWithdrawConfirmBtn: 'Yes, withdraw everything',
  emergencyWithdrawCancelBtn: 'Cancel',
  emergencyWithdrawDone: 'All funds returned to your wallet. 🔓',

  qr_intro: ["Hey Fin!", "Tell me more", "I'm ready"],
  qr_ask_why: ['Tired of overspending', 'Planning a big purchase', 'Just want a plan'],
  qr_ask_income: ['Around $3,000', 'About $5k', '$4,500'],
  qr_ask_first_budget: ['Use the suggestions', 'Let me customise', 'Looks good to me'],
  qr_ask_more_budgets: ['Coffee, $80', 'Gym, $50', "That's it for now"],
  qr_ask_goal: ['Emergency fund, $1,000', 'Vacation, $2,500', 'Skip for now'],
  qr_plan_review: ['Looks great!', 'I want to adjust something', 'Later'],
  qr_coaching: ['How do envelopes work?', 'Give me a tip', 'Show my plan', "I'm ready now"],
  qr_ask_deposit: ['$50', '$100', '$200', 'Later'],
  qr_free: ["What's my balance?", 'Show my budgets', 'Show my goals'],
}

const es: Strings = {
  appName: 'BudgetAI',
  networkBadge: 'Arc Mainnet',
  tabChat: 'Fin',
  tabBudgets: 'Presupuestos',
  tabGoals: 'Metas',
  connectPrompt: 'Conecta tu billetera para ver esto.',
  emptyNudge: 'Ve a la pestaña Fin y di "Pon $200 para comida" para empezar.',

  vaultBalance: 'Saldo en bóveda',
  walletAvailable: 'disponible en billetera',
  heroTagline1: 'Presupuesto inteligente,',
  heroTagline2: 'impulsado por USDC.',
  heroSubline: 'Conecta tu billetera para comenzar',
  contractNotDeployed: 'Contrato aún no desplegado.',

  budgetCategories: 'Categorías de presupuesto',
  category: 'categoría',
  categories: 'categorías',
  noBudgets: 'Sin categorías aún. Pídele al agente que cree una.',
  pctUsed: '% usado',
  remaining: 'restante',

  savingsGoals: 'Metas de ahorro',
  complete: 'completa',
  noGoals: 'Sin metas de ahorro aún.',
  pctSaved: '% ahorrado',
  toGo: 'restante',
  goalComplete: 'Completada',

  confirmInWallet: 'Confirma en la billetera…',
  confirming: 'confirmando en cadena…',
  txConfirmed: 'confirmada',
  explorer: 'Explorador',
  cancelled: 'Cancelado.',
  insufficientBalance: 'Saldo insuficiente.',
  categoryLimitExceeded: 'Se superaría el límite de la categoría.',
  txFailed: 'Transacción fallida. Inténtalo de nuevo.',

  agentSubtitle: 'Tu asistente financiero',
  waitingForWallet: 'Esperando billetera…',
  confirming2: 'Confirmando…',
  coachingMode: 'Modo coaching',
  txDone: '¡Listo! Transacción confirmada. Los saldos se actualizarán en breve. 🎉',
  inputPlaceholderGuided: 'Escribe una respuesta…',
  inputPlaceholderCoaching: 'Pregúntame lo que quieras…',
  inputPlaceholderFree: 'Di lo que quieras…',
  depositTitle: 'Depositar USDC',
  depositBtn: 'Depositar',
  planReadyBtn: 'Listo para financiar mi bóveda',
  planNoRush: 'O di "más tarde" — sin prisa 😊',
  planIncome: 'Ingreso mensual',
  planEnvelopes: 'Sobres',
  planSavingsGoal: 'Meta de ahorro',
  planLeftover: 'Sobrante / colchón de ahorro',

  withdrawLabel: 'Retirar USDC',
  withdrawConfirmBtn: 'Retirar',
  emergencyWithdrawLabel: 'Retiro de emergencia',
  emergencyWithdrawConfirmTitle: '¿Retirar todo?',
  emergencyWithdrawConfirmDesc: 'Esto moverá el 100% de tu bóveda y todos los fondos de metas de ahorro de vuelta a tu billetera al instante. Sin comisiones ni penalizaciones.',
  emergencyWithdrawConfirmBtn: 'Sí, retirar todo',
  emergencyWithdrawCancelBtn: 'Cancelar',
  emergencyWithdrawDone: 'Todos los fondos devueltos a tu billetera. 🔓',

  qr_intro: ['¡Hola Fin!', 'Cuéntame más', 'Estoy listo'],
  qr_ask_why: ['Gasto demasiado', 'Planeo una compra grande', 'Solo quiero un plan'],
  qr_ask_income: ['Unos $3,000', 'Alrededor de $5k', '$4,500'],
  qr_ask_first_budget: ['Usar las sugerencias', 'Personalizarlo', 'Me parece bien'],
  qr_ask_more_budgets: ['Café, $80', 'Gimnasio, $50', 'Eso es todo'],
  qr_ask_goal: ['Fondo emergencias, $1,000', 'Vacaciones, $2,500', 'Saltar por ahora'],
  qr_plan_review: ['¡Se ve genial!', 'Quiero ajustar algo', 'Más tarde'],
  qr_coaching: ['¿Cómo funcionan los sobres?', 'Dame un consejo', 'Ver mi plan', 'Estoy listo ahora'],
  qr_ask_deposit: ['$50', '$100', '$200', 'Más tarde'],
  qr_free: ['¿Cuál es mi saldo?', 'Ver presupuestos', 'Ver metas'],
}

const ru: Strings = {
  appName: 'BudgetAI',
  networkBadge: 'Arc Mainnet',
  tabChat: 'Фин',
  tabBudgets: 'Бюджеты',
  tabGoals: 'Цели',
  connectPrompt: 'Подключи кошелёк, чтобы увидеть это.',
  emptyNudge: 'Перейди на вкладку Фин и скажи «Бюджет на еду $200», чтобы начать.',

  vaultBalance: 'Баланс хранилища',
  walletAvailable: 'доступно в кошельке',
  heroTagline1: 'Умный бюджет,',
  heroTagline2: 'на USDC.',
  heroSubline: 'Подключи кошелёк, чтобы начать',
  contractNotDeployed: 'Контракт ещё не развёрнут.',

  budgetCategories: 'Категории бюджета',
  category: 'категория',
  categories: 'категорий',
  noBudgets: 'Пока нет категорий. Попроси агента создать их.',
  pctUsed: '% использовано',
  remaining: 'осталось',

  savingsGoals: 'Цели накоплений',
  complete: 'выполнено',
  noGoals: 'Пока нет целей накоплений.',
  pctSaved: '% накоплено',
  toGo: 'осталось',
  goalComplete: 'Выполнено',

  confirmInWallet: 'Подтверди в кошельке…',
  confirming: 'подтверждается в сети…',
  txConfirmed: 'подтверждена',
  explorer: 'Обозреватель',
  cancelled: 'Отменено.',
  insufficientBalance: 'Недостаточно средств.',
  categoryLimitExceeded: 'Лимит категории будет превышен.',
  txFailed: 'Транзакция не удалась. Попробуй снова.',

  agentSubtitle: 'Твой финансовый помощник',
  waitingForWallet: 'Ожидаю кошелёк…',
  confirming2: 'Подтверждается…',
  coachingMode: 'Режим коучинга',
  txDone: 'Готово! Транзакция подтверждена. Баланс обновится через мгновение. 🎉',
  inputPlaceholderGuided: 'Напиши ответ…',
  inputPlaceholderCoaching: 'Спроси меня что угодно…',
  inputPlaceholderFree: 'Говори что хочешь…',
  depositTitle: 'Пополнить USDC',
  depositBtn: 'Пополнить',
  planReadyBtn: 'Готов пополнить хранилище',
  planNoRush: 'Или скажи «потом» — никаких торопливостей 😊',
  planIncome: 'Ежемесячный доход',
  planEnvelopes: 'Конверты',
  planSavingsGoal: 'Цель накоплений',
  planLeftover: 'Остаток / подушка безопасности',

  withdrawLabel: 'Вывести USDC',
  withdrawConfirmBtn: 'Вывести',
  emergencyWithdrawLabel: 'Экстренный вывод',
  emergencyWithdrawConfirmTitle: 'Вывести все средства?',
  emergencyWithdrawConfirmDesc: 'Это мгновенно переведёт 100% баланса хранилища и всех накоплений обратно в твой кошелёк. Без комиссий и штрафов.',
  emergencyWithdrawConfirmBtn: 'Да, вывести всё',
  emergencyWithdrawCancelBtn: 'Отмена',
  emergencyWithdrawDone: 'Все средства возвращены в кошелёк. 🔓',

  qr_intro: ['Привет, Фин!', 'Расскажи подробнее', 'Я готов'],
  qr_ask_why: ['Трачу слишком много', 'Планирую крупную покупку', 'Хочу составить план'],
  qr_ask_income: ['Около $3,000', 'Примерно $5k', '$4,500'],
  qr_ask_first_budget: ['Использовать подсказки', 'Настроить самому', 'Выглядит хорошо'],
  qr_ask_more_budgets: ['Кофе, $80', 'Спортзал, $50', 'Это всё'],
  qr_ask_goal: ['Резервный фонд, $1,000', 'Отпуск, $2,500', 'Пропустить'],
  qr_plan_review: ['Отлично!', 'Хочу что-то изменить', 'Потом'],
  qr_coaching: ['Как работают конверты?', 'Дай совет', 'Показать мой план', 'Я готов сейчас'],
  qr_ask_deposit: ['$50', '$100', '$200', 'Потом'],
  qr_free: ['Каков мой баланс?', 'Показать бюджеты', 'Показать цели'],
}

const pt: Strings = {
  appName: 'BudgetAI',
  networkBadge: 'Arc Mainnet',
  tabChat: 'Fin',
  tabBudgets: 'Orçamentos',
  tabGoals: 'Metas',
  connectPrompt: 'Conecte sua carteira para ver isso.',
  emptyNudge: 'Vá para a aba Fin e diga "Defina $200 para alimentação" para começar.',

  vaultBalance: 'Saldo no cofre',
  walletAvailable: 'disponível na carteira',
  heroTagline1: 'Orçamento inteligente,',
  heroTagline2: 'com USDC.',
  heroSubline: 'Conecte sua carteira para começar',
  contractNotDeployed: 'Contrato ainda não implantado.',

  budgetCategories: 'Categorias de orçamento',
  category: 'categoria',
  categories: 'categorias',
  noBudgets: 'Sem categorias ainda. Peça ao agente para criar uma.',
  pctUsed: '% usado',
  remaining: 'restante',

  savingsGoals: 'Metas de poupança',
  complete: 'concluída',
  noGoals: 'Sem metas de poupança ainda.',
  pctSaved: '% poupado',
  toGo: 'restante',
  goalComplete: 'Concluída',

  confirmInWallet: 'Confirme na carteira…',
  confirming: 'confirmando na rede…',
  txConfirmed: 'confirmada',
  explorer: 'Explorador',
  cancelled: 'Cancelado.',
  insufficientBalance: 'Saldo insuficiente.',
  categoryLimitExceeded: 'O limite da categoria seria excedido.',
  txFailed: 'Transação falhou. Tente novamente.',

  agentSubtitle: 'Seu assistente financeiro',
  waitingForWallet: 'Aguardando carteira…',
  confirming2: 'Confirmando…',
  coachingMode: 'Modo coaching',
  txDone: 'Pronto! Transação confirmada. Os saldos serão atualizados em breve. 🎉',
  inputPlaceholderGuided: 'Digite uma resposta…',
  inputPlaceholderCoaching: 'Pergunte-me qualquer coisa…',
  inputPlaceholderFree: 'Diga qualquer coisa…',
  depositTitle: 'Depositar USDC',
  depositBtn: 'Depositar',
  planReadyBtn: 'Estou pronto para financiar meu cofre',
  planNoRush: 'Ou diga "depois" — sem pressa 😊',
  planIncome: 'Renda mensal',
  planEnvelopes: 'Envelopes',
  planSavingsGoal: 'Meta de poupança',
  planLeftover: 'Sobra / reserva de poupança',

  withdrawLabel: 'Sacar USDC',
  withdrawConfirmBtn: 'Sacar',
  emergencyWithdrawLabel: 'Saque de emergência',
  emergencyWithdrawConfirmTitle: 'Sacar tudo?',
  emergencyWithdrawConfirmDesc: 'Isso moverá 100% do saldo do cofre e de todas as metas de poupança de volta para sua carteira instantaneamente. Sem taxas nem penalidades.',
  emergencyWithdrawConfirmBtn: 'Sim, sacar tudo',
  emergencyWithdrawCancelBtn: 'Cancelar',
  emergencyWithdrawDone: 'Todos os fundos devolvidos à sua carteira. 🔓',

  qr_intro: ['Oi Fin!', 'Conte-me mais', 'Estou pronto'],
  qr_ask_why: ['Gasto demais', 'Planejo uma compra grande', 'Só quero um plano'],
  qr_ask_income: ['Cerca de $3.000', 'Uns $5k', '$4.500'],
  qr_ask_first_budget: ['Usar as sugestões', 'Personalizar', 'Parece bom'],
  qr_ask_more_budgets: ['Café, $80', 'Academia, $50', 'Isso é tudo'],
  qr_ask_goal: ['Fundo emergência, $1.000', 'Férias, $2.500', 'Pular por enquanto'],
  qr_plan_review: ['Ótimo!', 'Quero ajustar algo', 'Depois'],
  qr_coaching: ['Como funcionam os envelopes?', 'Dê-me uma dica', 'Ver meu plano', 'Estou pronto agora'],
  qr_ask_deposit: ['$50', '$100', '$200', 'Depois'],
  qr_free: ['Qual é meu saldo?', 'Ver orçamentos', 'Ver metas'],
}

export const STRINGS: Record<Lang, Strings> = { en, es, ru, pt }
export const t = (lang: Lang): Strings => STRINGS[lang]
