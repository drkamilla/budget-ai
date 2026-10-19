// BudgetVault — Arc Mainnet (chain 5042)
// Explorer: https://explorer.arc.io/address/0x0C386F449238D0A40f86dC93a2c2D6194ad2AECe
export const BUDGET_VAULT_ADDRESS = '0x0C386F449238D0A40f86dC93a2c2D6194ad2AECe' as `0x${string}`

export const BUDGET_VAULT_ABI = [
  // Write functions
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'createCategory',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'limit', type: 'uint256' },
    ],
    outputs: [{ name: 'categoryId', type: 'uint256' }],
  },
  {
    name: 'createGoal',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'target', type: 'uint256' },
    ],
    outputs: [{ name: 'goalId', type: 'uint256' }],
  },
  {
    name: 'fundGoal',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'goalId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'withdrawGoal',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'goalId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'spend',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'categoryId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'emergencyWithdrawAll',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  // View functions
  {
    name: 'vaultBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getCategoryCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getGoalCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getCategory',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'id', type: 'uint256' },
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'name', type: 'string' },
          { name: 'limit', type: 'uint256' },
          { name: 'spent', type: 'uint256' },
          { name: 'active', type: 'bool' },
        ],
      },
    ],
  },
  {
    name: 'getGoal',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'id', type: 'uint256' },
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'name', type: 'string' },
          { name: 'target', type: 'uint256' },
          { name: 'saved', type: 'uint256' },
          { name: 'completed', type: 'bool' },
        ],
      },
    ],
  },
] as const
