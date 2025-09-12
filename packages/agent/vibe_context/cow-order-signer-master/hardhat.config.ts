import '@nomicfoundation/hardhat-toolbox'
import 'hardhat-deploy'
import 'hardhat-gas-reporter'

import { config } from 'dotenv'
import { HardhatUserConfig, HttpNetworkUserConfig } from 'hardhat/types'

config()
const { INFURA_KEY, MNEMONIC, ETHERSCAN_API_KEY } = process.env
const DEFAULT_MNEMONIC =
  'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat'

const sharedNetworkConfig: HttpNetworkUserConfig = {}

sharedNetworkConfig.accounts = {
  mnemonic: MNEMONIC || DEFAULT_MNEMONIC,
}

export default {
  solidity: {
    compilers: [
      {
        version: '0.8.12',
        settings: {
          optimizer: {
            enabled: true,
          },
        },
      },
    ],
  },
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      forking: {
        url: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
        blockNumber: 16883800,
      },
    },
    mainnet: {
      ...sharedNetworkConfig,
      url: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
    },
    sepolia: {
      ...sharedNetworkConfig,
      url: `https://sepolia.infura.io/v3/${INFURA_KEY}`,
    },
    gnosis: {
      ...sharedNetworkConfig,
      url: 'https://rpc.gnosischain.com/',
    },
    arbitrumOne: {
      ...sharedNetworkConfig,
      url: `https://arbitrum.llamarpc.com`,
    },
    base: {
      ...sharedNetworkConfig,
      url: `https://base.llamarpc.com`,
    },
    avalanche: {
      ...sharedNetworkConfig,
      chainId: 43114,
      url: 'https://avalanche-c-chain-rpc.publicnode.com',
    },
    polygon: {
      ...sharedNetworkConfig,
      chainId: 137,
      url: 'https://polygon-rpc.com',
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
    customChains: [
      {
        network: 'gnosis',
        chainId: 100,
        urls: {
          apiURL: 'https://api.gnosisscan.io/api',
          browserURL: 'https://www.gnosisscan.io',
        },
      },
      {
        network: 'matic',
        chainId: 137,
        urls: {
          apiURL: 'https://api.polygonscan.com/api',
          browserURL: 'https://www.polygonscan.com',
        },
      },
      {
        network: 'mumbai',
        chainId: 80001,
        urls: {
          apiURL: 'https://api-testnet.polygonscan.com/api',
          browserURL: 'https://mumbai.polygonscan.com',
        },
      },
      {
        network: 'arbitrumOne',
        chainId: 42161,
        urls: {
          apiURL: 'https://api.arbiscan.io/api',
          browserURL: 'https://arbiscan.io',
        },
      },
      {
        network: 'base',
        chainId: 8453,
        urls: {
          apiURL: 'https://api.basescan.org/api',
          browserURL: 'https://basescan.org',
        },
      },
      {
        network: 'avalanche',
        chainId: 43114,
        urls: {
          apiURL: 'https://api.snowtrace.io/api',
          browserURL: 'https://snowtrace.io',
        },
      },
      {
        network: 'polygon',
        chainId: 137,
        urls: {
          apiURL: 'https://api.polygonscan.com/api',
          browserURL: 'https://polygonscan.com',
        },
      },
    ],
  },
  verify: {
    etherscan: {
      apiKey: ETHERSCAN_API_KEY,
    },
  },
  gasReporter: {
    enabled: true,
  },
} satisfies HardhatUserConfig
