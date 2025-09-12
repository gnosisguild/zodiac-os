import { ActionType, Chain, ParameterSchema, ProtocolConfig } from './types'

// Helper function to create parameter schemas
const param = (
  type: 'string' | 'string[]' | 'number' | 'boolean' | 'address',
  required: boolean = false,
  description: string = '',
  constraints?: any,
): ParameterSchema => ({
  type,
  required,
  description,
  constraints,
})

// Protocol configurations based on DeFi Kit documentation analysis
export const PROTOCOL_CONFIGS: Record<string, ProtocolConfig> = {
  // CowSwap - Swap protocol with TWAP support
  cowswap: {
    name: 'CowSwap',
    description: 'Decentralized exchange with MEV protection and TWAP orders',
    actions: ['swap'],
    parameters: {
      swap: {
        sell: param(
          'string[]',
          true,
          'Tokens to sell (ETH or token addresses)',
        ),
        buy: param(
          'string[]',
          false,
          'Tokens to buy (optional, unrestricted if undefined)',
        ),
        feeAmountBp: param(
          'number',
          false,
          'Fee amount in basis points (0-10000)',
          { min: 0, max: 10000 },
        ),
        twap: param(
          'boolean',
          false,
          'TWAP order flag (false=Market Order, true=TWAP Order)',
        ),
        receiver: param(
          'address',
          false,
          'Receiver address (required for TWAP orders)',
        ),
      },
      deposit: {},
      borrow: {},
      stake: {},
      lock: {},
    },
    deployments: {
      eth: {
        supported: true,
        contracts: {
          GPv2VaultRelayer: '0xC92E8bdf79f0507f65a392b0ab4667716BFE0110',
          OrderSigner: '0x23dA9AdE38E4477b23770DeD512fD37b12381FAB',
          ComposableCow: '0xfdaFc9d1902f4e0b84f65F49f244b32b31013b74',
        },
      },
      arb: { supported: true, contracts: {} },
      opt: { supported: false, contracts: {} },
      base: { supported: true, contracts: {} },
      gno: { supported: true, contracts: {} },
    },
    // Normalize: keep ETH literal, resolve symbols to addresses for sell/buy
    tokenPolicy: {
      nativeSymbol: 'ETH',
      keepNativeLiteral: true,
      resolveSymbolsToAddresses: true,
      resolveFields: ['sell', 'buy'],
    },
  },

  // Aave v3 - Lending protocol with multiple markets
  aave_v3: {
    name: 'Aave v3',
    description: 'Decentralized lending protocol with isolated markets',
    actions: ['deposit', 'borrow'],
    parameters: {
      deposit: {
        targets: param('string[]', true, 'ETH or token symbols/addresses'),
        market: param(
          'string',
          false,
          'Market selection (Core, Prime, EtherFi)',
          { enum: ['Core', 'Prime', 'EtherFi'] },
        ),
      },
      borrow: {
        targets: param('string[]', true, 'ETH or token symbols/addresses'),
        market: param(
          'string',
          false,
          'Market selection (Core, Prime, EtherFi)',
          { enum: ['Core', 'Prime', 'EtherFi'] },
        ),
      },
      swap: {},
      stake: {},
      lock: {},
    },
    deployments: {
      eth: {
        supported: true,
        contracts: {
          PoolCoreV3: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
          PoolPrimeV3: '0x4e033931ad43597d96D6bcc25c280717730B58B1',
          PoolEtherFiV3: '0x0AA97c284e98396202b6A04024F5E2c65026F3c0',
        },
        markets: {
          Core: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
          Prime: '0x4e033931ad43597d96D6bcc25c280717730B58B1',
          EtherFi: '0x0AA97c284e98396202b6A04024F5E2c65026F3c0',
        },
      },
      arb: { supported: true, contracts: {} },
      opt: { supported: true, contracts: {} },
      base: { supported: true, contracts: {} },
      gno: { supported: true, contracts: {} },
    },
    parameterMappings: [
      { from: 'tokens', to: 'targets', condition: { protocol: 'aave_v3' } },
    ],
    actionAliases: {
      supply: 'deposit',
    },
    tokenPolicy: {
      nativeSymbol: 'ETH',
      keepNativeLiteral: true,
      resolveSymbolsToAddresses: false,
    },
  },

  // Lido - ETH staking protocol
  lido: {
    name: 'Lido',
    description: 'Liquid staking protocol for Ethereum',
    actions: ['deposit'],
    parameters: {
      deposit: {
        // No parameters needed for Lido deposit (ETH staking)
      },
      borrow: {},
      swap: {},
      stake: {},
      lock: {},
    },
    deployments: {
      eth: {
        supported: true,
        contracts: { stETH: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84' },
      },
      arb: { supported: false, contracts: {} },
      opt: { supported: false, contracts: {} },
      base: { supported: false, contracts: {} },
      gno: { supported: false, contracts: {} },
    },
    actionAliases: {
      stake: 'deposit',
    },
    tokenPolicy: {
      nativeSymbol: 'ETH',
      keepNativeLiteral: true,
      resolveSymbolsToAddresses: false,
    },
  },

  // Uniswap v3 - DEX with concentrated liquidity
  uniswap_v3: {
    name: 'Uniswap v3',
    description: 'Decentralized exchange with concentrated liquidity',
    actions: ['deposit'],
    parameters: {
      deposit: {
        targets: param(
          'string[]',
          false,
          'NFT position IDs for existing positions',
        ),
        tokens: param(
          'string[]',
          false,
          'Token symbols/addresses for new positions',
        ),
        fees: param('string[]', false, 'Fee tiers (0.01%, 0.05%, 0.3%, 1%)', {
          enum: ['0.01%', '0.05%', '0.3%', '1%'],
        }),
      },
      borrow: {},
      swap: {},
      stake: {},
      lock: {},
    },
    deployments: {
      eth: { supported: true, contracts: {} },
      arb: { supported: true, contracts: {} },
      opt: { supported: true, contracts: {} },
      base: { supported: true, contracts: {} },
      gno: { supported: true, contracts: {} },
    },
    tokenPolicy: {
      nativeSymbol: 'WETH',
      keepNativeLiteral: false,
      resolveSymbolsToAddresses: false,
      resolveFields: ['tokens'],
    },
  },

  // Balancer v2 - Multi-token automated market maker
  balancer_v2: {
    name: 'Balancer v2',
    description: 'Multi-token automated market maker',
    actions: ['deposit', 'lock'],
    parameters: {
      deposit: {
        targets: param(
          'string[]',
          true,
          'Pool names, BPT addresses, or pool IDs',
        ),
        tokens: param(
          'string[]',
          false,
          'Token symbols/addresses (optional refinement)',
        ),
      },
      lock: {},
      borrow: {},
      swap: {},
      stake: {},
    },
    deployments: {
      eth: { supported: true, contracts: {} },
      arb: { supported: true, contracts: {} },
      opt: { supported: true, contracts: {} },
      base: { supported: true, contracts: {} },
      gno: { supported: true, contracts: {} },
    },
    parameterMappings: [
      {
        from: 'tokens',
        to: 'targets',
        condition: { protocol: 'balancer_v2', action: 'deposit' },
      },
    ],
    tokenPolicy: {
      nativeSymbol: 'ETH',
      keepNativeLiteral: true,
      resolveSymbolsToAddresses: false,
    },
  },

  // Compound v3 - Lending protocol
  compound_v3: {
    name: 'Compound v3',
    description: 'Decentralized lending protocol',
    actions: ['deposit', 'borrow'],
    parameters: {
      deposit: {
        targets: param('string[]', true, 'Token symbols/addresses'),
      },
      borrow: {
        targets: param('string[]', true, 'Token symbols/addresses'),
      },
      swap: {},
      stake: {},
      lock: {},
    },
    deployments: {
      eth: { supported: true, contracts: {} },
      arb: { supported: false, contracts: {} },
      opt: { supported: false, contracts: {} },
      base: { supported: false, contracts: {} },
      gno: { supported: false, contracts: {} },
    },
    parameterMappings: [
      { from: 'tokens', to: 'targets', condition: { protocol: 'compound_v3' } },
    ],
    actionAliases: {
      supply: 'deposit',
    },
    tokenPolicy: {
      nativeSymbol: 'ETH',
      keepNativeLiteral: true,
      resolveSymbolsToAddresses: false,
    },
  },

  // Aura - Balancer ecosystem yield farming
  aura: {
    name: 'Aura Finance',
    description: 'Yield farming protocol built on Balancer',
    actions: ['deposit', 'lock'],
    parameters: {
      deposit: {
        targets: param(
          'string[]',
          true,
          'Pool names, BPT addresses, or pool IDs',
        ),
        tokens: param('string[]', false, 'Token symbols/addresses'),
      },
      lock: {},
      borrow: {},
      swap: {},
      stake: {},
    },
    deployments: {
      eth: { supported: true, contracts: {} },
      arb: { supported: true, contracts: {} },
      opt: { supported: true, contracts: {} },
      base: { supported: true, contracts: {} },
      gno: { supported: true, contracts: {} },
    },
    parameterMappings: [
      {
        from: 'tokens',
        to: 'targets',
        condition: { protocol: 'aura', action: 'deposit' },
      },
    ],
    tokenPolicy: {
      nativeSymbol: 'ETH',
      keepNativeLiteral: true,
      resolveSymbolsToAddresses: false,
    },
  },

  // StakeWise v3 - Ethereum staking with vaults
  stakewise_v3: {
    name: 'StakeWise v3',
    description: 'Decentralized Ethereum staking with vault system',
    actions: ['stake'],
    parameters: {
      stake: {
        targets: param('string[]', true, 'Vault addresses or names'),
      },
      deposit: {},
      borrow: {},
      swap: {},
      lock: {},
    },
    deployments: {
      eth: { supported: true, contracts: {} },
      gno: { supported: true, contracts: {} },
      arb: { supported: false, contracts: {} },
      opt: { supported: false, contracts: {} },
      base: { supported: false, contracts: {} },
    },
    tokenPolicy: {
      nativeSymbol: 'ETH',
      keepNativeLiteral: true,
      resolveSymbolsToAddresses: false,
    },
  },

  // Spark - MakerDAO's lending protocol
  spark: {
    name: 'Spark Protocol',
    description: 'MakerDAO lending protocol',
    actions: ['deposit', 'borrow'],
    parameters: {
      deposit: {
        targets: param('string[]', true, 'Token symbols/addresses'),
      },
      borrow: {
        targets: param('string[]', true, 'Token symbols/addresses'),
      },
      swap: {},
      stake: {},
      lock: {},
    },
    deployments: {
      eth: { supported: true, contracts: {} },
      gno: { supported: true, contracts: {} },
      arb: { supported: false, contracts: {} },
      opt: { supported: false, contracts: {} },
      base: { supported: false, contracts: {} },
    },
    actionAliases: {
      supply: 'deposit',
    },
    tokenPolicy: {
      nativeSymbol: 'ETH',
      keepNativeLiteral: true,
      resolveSymbolsToAddresses: false,
    },
  },
}

// Helper functions for protocol configuration
export function getProtocolConfig(
  protocol: string,
): ProtocolConfig | undefined {
  return PROTOCOL_CONFIGS[protocol]
}

export function getSupportedProtocols(): string[] {
  return Object.keys(PROTOCOL_CONFIGS)
}

export function getProtocolsForAction(action: ActionType): string[] {
  return Object.entries(PROTOCOL_CONFIGS)
    .filter(([_, config]) => config.actions.includes(action))
    .map(([protocol, _]) => protocol)
}

export function getProtocolsForChain(chain: Chain): string[] {
  return Object.entries(PROTOCOL_CONFIGS)
    .filter(([_, config]) => config.deployments[chain]?.supported)
    .map(([protocol, _]) => protocol)
}

export function isProtocolSupported(
  protocol: string,
  chain: Chain,
  action?: ActionType,
): boolean {
  const config = getProtocolConfig(protocol)
  if (!config) return false

  const deployment = config.deployments[chain]
  if (!deployment?.supported) return false

  if (action && !config.actions.includes(action)) return false

  return true
}
