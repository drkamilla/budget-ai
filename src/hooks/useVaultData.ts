import { useAccount, useReadContract } from 'wagmi'
import { readContracts } from '@wagmi/core'
import { useQuery } from '@tanstack/react-query'
import { BUDGET_VAULT_ADDRESS, BUDGET_VAULT_ABI } from '@/contract'
import { getUsdc } from '@/onchain-facts'
import { Amount, usdcDecimalsFor } from '@/onchain-money'
import { erc20Abi } from 'viem'
import { config as wagmiConfig } from '@/config'

export const ARC_CHAIN_ID = 5042 as const

export interface Category {
  id: number
  name: string
  limit: bigint
  spent: bigint
  active: boolean
  limitUsd: string
  spentUsd: string
  pct: number
}

export interface Goal {
  id: number
  name: string
  target: bigint
  saved: bigint
  completed: boolean
  targetUsd: string
  savedUsd: string
  pct: number
}

interface CatResult {
  id: bigint
  name: string
  limit: bigint
  spent: bigint
  active: boolean
}

interface GoalResult {
  id: bigint
  name: string
  target: bigint
  saved: bigint
  completed: boolean
}

const isDeployedAddress = (addr: string): addr is `0x${string}` =>
  addr.startsWith('0x') && addr.length === 42

export function useVaultData() {
  const { address, isConnected } = useAccount()
  const usdcFact = getUsdc(ARC_CHAIN_ID)

  const isDeployed = isDeployedAddress(BUDGET_VAULT_ADDRESS)

  const { data: vaultBalanceRaw, refetch: refetchBalance } = useReadContract({
    address: isDeployed ? BUDGET_VAULT_ADDRESS : undefined,
    abi: BUDGET_VAULT_ABI,
    functionName: 'vaultBalance',
    args: address ? [address] : undefined,
    chainId: ARC_CHAIN_ID,
    query: { enabled: isConnected && !!address && isDeployed },
  })

  const { data: usdcBalanceRaw, refetch: refetchUsdcBalance } = useReadContract({
    address: usdcFact?.address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: ARC_CHAIN_ID,
    query: { enabled: isConnected && !!address && !!usdcFact },
  })

  const { data: usdcAllowanceRaw, refetch: refetchAllowance } = useReadContract({
    address: usdcFact?.address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address && isDeployed ? [address, BUDGET_VAULT_ADDRESS] : undefined,
    chainId: ARC_CHAIN_ID,
    query: { enabled: isConnected && !!address && !!usdcFact && isDeployed },
  })

  const { data: categoryCount, refetch: refetchCatCount } = useReadContract({
    address: isDeployed ? BUDGET_VAULT_ADDRESS : undefined,
    abi: BUDGET_VAULT_ABI,
    functionName: 'getCategoryCount',
    args: address ? [address] : undefined,
    chainId: ARC_CHAIN_ID,
    query: { enabled: isConnected && !!address && isDeployed },
  })

  const { data: goalCount, refetch: refetchGoalCount } = useReadContract({
    address: isDeployed ? BUDGET_VAULT_ADDRESS : undefined,
    abi: BUDGET_VAULT_ABI,
    functionName: 'getGoalCount',
    args: address ? [address] : undefined,
    chainId: ARC_CHAIN_ID,
    query: { enabled: isConnected && !!address && isDeployed },
  })

  const catCount = Number(categoryCount ?? 0)
  const gCount = Number(goalCount ?? 0)
  const decimals = usdcDecimalsFor(ARC_CHAIN_ID)

  const { data: categories = [], refetch: refetchCategories } = useQuery<Category[]>({
    queryKey: ['categories', address, catCount, ARC_CHAIN_ID],
    enabled: isConnected && !!address && isDeployed && catCount > 0,
    queryFn: async (): Promise<Category[]> => {
      if (!address || catCount === 0) return []
      const contracts = Array.from({ length: catCount }, (_, i) => ({
        address: BUDGET_VAULT_ADDRESS,
        abi: BUDGET_VAULT_ABI,
        functionName: 'getCategory' as const,
        args: [address, BigInt(i + 1)] as const,
        chainId: ARC_CHAIN_ID,
      }))
      const results = await readContracts(wagmiConfig, {
        contracts: contracts,
      })
      const fmt = (raw: bigint) => Amount.fromRaw(raw, decimals).toFixed(2)
      return results
        .map(r => r.result)
        .filter((x): x is CatResult => x !== undefined)
        .map((cat) => {
          const pct = cat.limit > 0n
            ? Math.min(100, Math.round((Number(cat.spent) / Number(cat.limit)) * 100))
            : 0
          return {
            id: Number(cat.id),
            name: cat.name,
            limit: cat.limit,
            spent: cat.spent,
            active: cat.active,
            limitUsd: fmt(cat.limit),
            spentUsd: fmt(cat.spent),
            pct,
          }
        })
    },
  })

  const { data: goals = [], refetch: refetchGoals } = useQuery<Goal[]>({
    queryKey: ['goals', address, gCount, ARC_CHAIN_ID],
    enabled: isConnected && !!address && isDeployed && gCount > 0,
    queryFn: async (): Promise<Goal[]> => {
      if (!address || gCount === 0) return []
      const contracts = Array.from({ length: gCount }, (_, i) => ({
        address: BUDGET_VAULT_ADDRESS,
        abi: BUDGET_VAULT_ABI,
        functionName: 'getGoal' as const,
        args: [address, BigInt(i + 1)] as const,
        chainId: ARC_CHAIN_ID,
      }))
      const results = await readContracts(wagmiConfig, {
        contracts: contracts,
      })
      const fmt = (raw: bigint) => Amount.fromRaw(raw, decimals).toFixed(2)
      return results
        .map(r => r.result)
        .filter((x): x is GoalResult => x !== undefined)
        .map((goal) => {
          const pct = goal.target > 0n
            ? Math.min(100, Math.round((Number(goal.saved) / Number(goal.target)) * 100))
            : 0
          return {
            id: Number(goal.id),
            name: goal.name,
            target: goal.target,
            saved: goal.saved,
            completed: goal.completed,
            targetUsd: fmt(goal.target),
            savedUsd: fmt(goal.saved),
            pct,
          }
        })
    },
  })

  const fmt = (raw: bigint) => Amount.fromRaw(raw, decimals).toFixed(2)

  const vaultBalanceUsd = vaultBalanceRaw !== undefined ? fmt(vaultBalanceRaw) : '0.00'
  const walletUsdcUsd = usdcBalanceRaw !== undefined ? fmt(usdcBalanceRaw) : '0.00'
  const usdcAllowance = usdcAllowanceRaw !== undefined ? (usdcAllowanceRaw) : 0n

  const refetchAll = () => {
    void refetchBalance()
    void refetchUsdcBalance()
    void refetchAllowance()
    void refetchCatCount()
    void refetchGoalCount()
    void refetchCategories()
    void refetchGoals()
  }

  return {
    isConnected,
    address,
    isDeployed,
    vaultBalanceRaw: (vaultBalanceRaw ?? 0n),
    vaultBalanceUsd,
    walletUsdcUsd,
    usdcAllowance,
    categories,
    goals,
    decimals,
    usdcAddress: usdcFact?.address as `0x${string}`,
    refetchAll,
  }
}
