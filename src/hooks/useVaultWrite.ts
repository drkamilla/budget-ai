import { useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { erc20Abi } from 'viem'
import { BUDGET_VAULT_ADDRESS, BUDGET_VAULT_ABI } from '@/contract'
import { parseAmount } from '@/onchain-money'
import { ARC_CHAIN_ID } from './useVaultData'

export function useVaultWrite(chainId: number | undefined, usdcAddress: `0x${string}`) {
  const { switchChainAsync } = useSwitchChain()
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  /** Switch to Arc Testnet first if needed, then run the callback. */
  const withChain = async (fn: () => void) => {
    if (chainId !== ARC_CHAIN_ID) {
      try {
        await switchChainAsync({ chainId: ARC_CHAIN_ID })
      } catch {
        // user rejected the switch — abort silently
        return
      }
    }
    fn()
  }

  const approve = (amountUsdc: string) => {
    void withChain(() => {
      const parsed = parseAmount(ARC_CHAIN_ID, amountUsdc)
      writeContract({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [BUDGET_VAULT_ADDRESS, parsed.raw],
        chainId: ARC_CHAIN_ID,
      })
    })
  }

  const deposit = (amountUsdc: string) => {
    void withChain(() => {
      const parsed = parseAmount(ARC_CHAIN_ID, amountUsdc)
      writeContract({
        address: BUDGET_VAULT_ADDRESS,
        abi: BUDGET_VAULT_ABI,
        functionName: 'deposit',
        args: [parsed.raw],
        chainId: ARC_CHAIN_ID,
      })
    })
  }

  const withdraw = (amountUsdc: string) => {
    void withChain(() => {
      const parsed = parseAmount(ARC_CHAIN_ID, amountUsdc)
      writeContract({
        address: BUDGET_VAULT_ADDRESS,
        abi: BUDGET_VAULT_ABI,
        functionName: 'withdraw',
        args: [parsed.raw],
        chainId: ARC_CHAIN_ID,
      })
    })
  }

  const createCategory = (name: string, limitUsdc: string) => {
    void withChain(() => {
      const parsed = parseAmount(ARC_CHAIN_ID, limitUsdc)
      writeContract({
        address: BUDGET_VAULT_ADDRESS,
        abi: BUDGET_VAULT_ABI,
        functionName: 'createCategory',
        args: [name, parsed.raw],
        chainId: ARC_CHAIN_ID,
      })
    })
  }

  const createGoal = (name: string, targetUsdc: string) => {
    void withChain(() => {
      const parsed = parseAmount(ARC_CHAIN_ID, targetUsdc)
      writeContract({
        address: BUDGET_VAULT_ADDRESS,
        abi: BUDGET_VAULT_ABI,
        functionName: 'createGoal',
        args: [name, parsed.raw],
        chainId: ARC_CHAIN_ID,
      })
    })
  }

  const fundGoal = (goalId: number, amountUsdc: string) => {
    void withChain(() => {
      const parsed = parseAmount(ARC_CHAIN_ID, amountUsdc)
      writeContract({
        address: BUDGET_VAULT_ADDRESS,
        abi: BUDGET_VAULT_ABI,
        functionName: 'fundGoal',
        args: [BigInt(goalId), parsed.raw],
        chainId: ARC_CHAIN_ID,
      })
    })
  }

  const withdrawGoal = (goalId: number, amountUsdc: string) => {
    void withChain(() => {
      const parsed = parseAmount(ARC_CHAIN_ID, amountUsdc)
      writeContract({
        address: BUDGET_VAULT_ADDRESS,
        abi: BUDGET_VAULT_ABI,
        functionName: 'withdrawGoal',
        args: [BigInt(goalId), parsed.raw],
        chainId: ARC_CHAIN_ID,
      })
    })
  }

  const spend = (recipient: `0x${string}`, categoryId: number, amountUsdc: string) => {
    void withChain(() => {
      const parsed = parseAmount(ARC_CHAIN_ID, amountUsdc)
      writeContract({
        address: BUDGET_VAULT_ADDRESS,
        abi: BUDGET_VAULT_ABI,
        functionName: 'spend',
        args: [recipient, BigInt(categoryId), parsed.raw],
        chainId: ARC_CHAIN_ID,
      })
    })
  }

  const emergencyWithdrawAll = () => {
    void withChain(() => {
      writeContract({
        address: BUDGET_VAULT_ADDRESS,
        abi: BUDGET_VAULT_ABI,
        functionName: 'emergencyWithdrawAll',
        args: [],
        chainId: ARC_CHAIN_ID,
      })
    })
  }

  return {
    approve, deposit, withdraw,
    createCategory, createGoal, fundGoal, withdrawGoal,
    spend, emergencyWithdrawAll,
    hash, isPending, isConfirming, isSuccess, error, reset,
  }
}
