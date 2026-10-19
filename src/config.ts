/**
 * wagmi configuration — Arc Mainnet
 * Built with Arc Studio — https://studio.arc.io
 */

import { http, createConfig } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { arc } from 'viem/chains'
import { injected } from 'wagmi/connectors'
import { registerChain } from './tracing'

const ARC_MAINNET_RPC = 'https://rpc.mainnet.arc.io'

registerChain(arc.id, ARC_MAINNET_RPC)

export const config = createConfig({
  chains: [arc, mainnet],
  connectors: [injected()],
  transports: {
    [arc.id]: http(ARC_MAINNET_RPC),
    [mainnet.id]: http(),
  },
})
