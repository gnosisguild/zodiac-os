import { getDefaultConfig } from 'connectkit'
import type { Ref } from 'react'
import { createConfig } from 'wagmi'
import {
  arbitrum,
  avalanche,
  base,
  gnosis,
  mainnet,
  optimism,
  polygon,
  sepolia,
} from 'wagmi/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'

const WALLETCONNECT_PROJECT_ID = '0f8a5e2cf60430a26274b421418e8a27'

export const getWagmiConfig = (injectedOnly: boolean) =>
  createConfig(
    getDefaultConfig({
      appName: 'Zodiac Pilot',
      ssr: true,
      walletConnectProjectId: WALLETCONNECT_PROJECT_ID,
      chains: [
        mainnet,
        optimism,
        gnosis,
        polygon,
        sepolia,
        base,
        arbitrum,
        avalanche,
      ],
      connectors: getConnectors(injectedOnly),
    }),
  )

const getConnectors = (injectedOnly: boolean) => {
  if (injectedOnly) {
    return [injected()]
  }

  return [injected(), metaMask(), getWalletConnectConnector()]
}

const walletConnectConnectorRef: Ref<ReturnType<typeof walletConnect>> = {
  current: null,
}

const getWalletConnectConnector = () => {
  if (walletConnectConnectorRef.current) {
    return walletConnectConnectorRef.current
  }

  walletConnectConnectorRef.current = walletConnect({
    projectId: WALLETCONNECT_PROJECT_ID,
    showQrModal: false,
  })

  return walletConnectConnectorRef.current
}
