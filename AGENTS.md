# BudgetAI — Smart Budgeting on Arc

> Built with Arc Studio - money-powered apps in minutes

This is the **project memory** - what Arc Studio remembers about building this app. It helps future agents (or humans) understand and extend the project.

---

## What This App Does

AI-driven personal budgeting app on Arc Mainnet. Users deposit USDC into a personal vault, create named budget categories with onchain spending limits, create savings goals with USDC targets, allocate USDC to goals, and send USDC to external addresses with category enforcement — all driven through a conversational AI agent.

## Deployed Contracts

| Contract | Chain | Address | Explorer |
|---|---|---|---|
| BudgetVault v2 | Arc Testnet | 0xce5cc74827b700d30360b809583a91a65b7d214d | https://explorer.testnet.arc.io/address/0xce5cc74827b700d30360b809583a91a65b7d214d |
| BudgetVault v2 | Arc Mainnet | 0x0C386F449238D0A40f86dC93a2c2D6194ad2AECe | https://explorer.arc.io/address/0x0C386F449238D0A40f86dC93a2c2D6194ad2AECe |

**Active:** Arc Mainnet (`BUDGET_VAULT_ADDRESS = 0x0C386F449238D0A40f86dC93a2c2D6194ad2AECe`)
Constructor args: `usdc_ = 0x3600000000000000000000000000000000000000` (Arc Mainnet USDC)
Added in v2: `emergencyWithdrawAll()` — sweeps 100% of vault balance + all goal savings to msg.sender in one tx.

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS
- Web3: wagmi v2, viem v2, ConnectKit
- Contracts: Solidity 0.8.28 + Foundry. Sources in `contracts/`, unit tests in `contracts/test/*.t.sol`. Build with `bun run contracts:build` (`forge build`), test with `bun run contracts:test` (`forge test`).
- Wallet: injected (MetaMask, etc.)
- Chain: Arc Mainnet (Chain ID: 5042, imported from `viem/chains` as `arc`)
- Token: USDC (6 decimals) (Address: 0x3600000000000000000000000000000000000000, Chain: Arc Testnet)
- Toasts: Sonner

## Key Files

- `src/App.tsx` - Main application logic
- `src/components/` - UI components
- `src/config.ts` - wagmi config (chains, connectors, transports)

## To Run

```bash
bun install
bun run dev
```
