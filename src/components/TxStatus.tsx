import { CheckCircle2, Loader2, XCircle, ExternalLink } from 'lucide-react'
import { buildTxExplorerUrl } from '@/onchain-facts'
import { ARC_CHAIN_ID } from '@/hooks/useVaultData'

interface Props {
  isPending: boolean
  isConfirming: boolean
  isSuccess: boolean
  error: Error | null
  hash?: `0x${string}`
  label?: string
}

export function TxStatus({ isPending, isConfirming, isSuccess, error, hash, label = 'Transaction' }: Props) {
  if (!isPending && !isConfirming && !isSuccess && !error) return null

  return (
    <div
      className="rounded-2xl px-4 py-3 flex items-center gap-3"
      style={{
        background: isSuccess
          ? 'rgba(26,128,71,0.07)'
          : error
          ? 'rgba(186,43,76,0.07)'
          : 'rgba(255,255,255,0.82)',
        border: isSuccess
          ? '1px solid rgba(26,128,71,0.18)'
          : error
          ? '1px solid rgba(186,43,76,0.18)'
          : '1px solid rgba(255,255,255,0.72)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      }}
    >
      {isPending && <Loader2 size={16} className="animate-spin" style={{ color: '#111111' }} />}
      {isConfirming && <Loader2 size={16} className="animate-spin" style={{ color: '#111111' }} />}
      {isSuccess && <CheckCircle2 size={16} color="var(--success)" />}
      {error && <XCircle size={16} color="var(--danger)" />}

      <div className="flex-1 min-w-0">
        {isPending && (
          <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
            Confirm in wallet…
          </p>
        )}
        {isConfirming && (
          <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
            {label} confirming onchain…
          </p>
        )}
        {isSuccess && hash && (
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium" style={{ color: 'var(--success)' }}>
              {label} confirmed
            </p>
            <a
              href={buildTxExplorerUrl(ARC_CHAIN_ID, hash)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs"
              style={{ color: '#111111' }}
            >
              Explorer <ExternalLink size={11} />
            </a>
          </div>
        )}
        {error && (
          <p className="text-sm" style={{ color: 'var(--danger)' }}>
            {error.message?.includes('user rejected')
              ? 'Cancelled.'
              : error.message?.includes('insufficient')
              ? 'Insufficient balance.'
              : error.message?.includes('CategoryLimitExceeded')
              ? 'Category limit would be exceeded.'
              : 'Transaction failed. Please try again.'}
          </p>
        )}
      </div>
    </div>
  )
}
