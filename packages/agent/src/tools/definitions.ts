import type { Anthropic } from '@anthropic-ai/sdk'
import { generateProtocolTools } from './protocol-tools'

// Generate per‑protocol DeFi Kit tools from SSOT
const defiKitTools = generateProtocolTools()

export const tools: Anthropic.Tool[] = [
  {
    name: 'greeting',
    description: 'Greet the user and introduce the DeFi assistant capabilities',
    input_schema: {
      type: 'object',
      properties: {
        user_name: {
          type: 'string',
          description: 'Optional user name to personalize the greeting',
        },
      },
    },
  },
  {
    name: 'get_portfolio',
    description:
      'Return the full portfolio (protocol positions, token balances, and 24h net curve) for a wallet via DeBank',
    input_schema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description:
            'The wallet address to analyze (EVM address starting with 0x)',
        },
      },
      required: ['address'],
    },
  },
  {
    name: 'tx_lido',
    description:
      'Build a Safe-compatible Lido deposit transaction (stake ETH for stETH)',
    input_schema: {
      type: 'object',
      properties: {
        chain: {
          type: 'string',
          enum: ['eth', 'arb', 'opt', 'base', 'gno'],
          default: 'eth',
        },
        action: { type: 'string', enum: ['deposit'], default: 'deposit' },
        amount: { type: 'string', description: 'ETH amount in human units' },
        referral: {
          type: 'string',
          description: 'Referral address (optional, defaults to 0x0)',
        },
        sender: {
          type: 'string',
          description: 'Safe avatar or initiator address',
        },
      },
      required: ['chain', 'action', 'amount', 'sender'],
    },
  },
  // {
  //   name: 'messari_copilot',
  //   description: 'Get AI-powered market analysis and insights using Messari Copilot for any crypto-related question',
  //   input_schema: {
  //     type: 'object',
  //     properties: {
  //       query: {
  //         type: 'string',
  //         description: 'The market analysis question or topic to research'
  //       },
  //       context: {
  //         type: 'string',
  //         description: 'Additional context for the analysis (optional)'
  //       }
  //     },
  //     required: ['query']
  //   }
  // },
  // Spread auto-generated DeFi Kit tools from protocol configurations
  ...defiKitTools,
  {
    name: 'build_executable_tx',
    description:
      'Build an executable DeFi payload (EIP-712 or Safe-compatible tx) from an intent or structured args',
    input_schema: {
      type: 'object',
      properties: {
        intent: {
          type: 'string',
          description:
            'Natural language intent, e.g. "swap 10 ETH on cowswap for USDC on arbitrum"',
        },
        protocol: { type: 'string', description: 'Protocol, e.g., cowswap' },
        action: {
          type: 'string',
          enum: ['swap', 'deposit', 'borrow', 'stake', 'lock'],
          description: 'Action to perform',
        },
        chain: {
          type: 'string',
          enum: ['eth', 'arb', 'opt', 'base', 'gno'],
          default: 'eth',
        },
        from: { type: 'string', description: 'Sell token symbol or address' },
        to: { type: 'string', description: 'Buy token symbol or address' },
        amount: { type: 'string', description: 'Amount in human units' },
        minAmountOut: {
          type: 'string',
          description:
            'Minimum output amount (human units) used when quotes disabled',
        },
        slippageBps: {
          type: 'number',
          description: 'Slippage in bps (default 50)',
        },
        ttlSeconds: {
          type: 'number',
          description: 'Order validity in seconds (default 1800)',
        },
        receiver: {
          type: 'string',
          description: 'Receiver address (defaults to sender)',
        },
        sender: { type: 'string', description: 'Sender address (signer)' },
      },
      required: ['sender'],
    },
  },
  {
    name: 'tx_aave_v3',
    description:
      'Build a Safe-compatible Aave v3 Pool transaction (deposit or borrow)',
    input_schema: {
      type: 'object',
      properties: {
        chain: {
          type: 'string',
          enum: ['eth', 'arb', 'opt', 'base', 'gno'],
          default: 'eth',
        },
        action: { type: 'string', enum: ['deposit', 'borrow'] },
        market: {
          type: 'string',
          enum: ['Core', 'Prime', 'EtherFi'],
          default: 'Core',
        },
        asset: {
          type: 'string',
          description: 'Asset symbol or address (e.g., USDC, WETH)',
        },
        amount: { type: 'string', description: 'Amount in human units' },
        onBehalfOf: {
          type: 'string',
          description: 'Beneficiary (defaults to sender)',
        },
        interestRateMode: {
          type: 'number',
          enum: [1, 2],
          description: 'Borrow rate mode: 1=Stable, 2=Variable (default)',
        },
        referralCode: {
          type: 'number',
          description: 'Referral code (default 0)',
        },
        sender: {
          type: 'string',
          description: 'Safe avatar or initiator address',
        },
      },
      required: ['chain', 'action', 'asset', 'amount', 'sender'],
    },
  },
  {
    name: 'tx_erc20_approve',
    description:
      'Build a Safe-compatible ERC20 approve(spender, amount) transaction',
    input_schema: {
      type: 'object',
      properties: {
        chain: {
          type: 'string',
          enum: ['eth', 'arb', 'opt', 'base', 'gno'],
          default: 'eth',
        },
        token: { type: 'string', description: 'Token symbol or address' },
        spender: { type: 'string', description: 'Spender contract address' },
        amount: {
          type: 'string',
          description: 'Amount in human units or "max"',
        },
        sender: {
          type: 'string',
          description: 'Safe avatar or initiator address',
        },
      },
      required: ['chain', 'token', 'spender', 'amount', 'sender'],
    },
  },
  {
    name: 'tx_cowswap',
    description:
      'Build a Safe-compatible CowSwap pre-sign payload (OrderSigner.signOrder via delegatecall)',
    input_schema: {
      type: 'object',
      properties: {
        chain: {
          type: 'string',
          enum: ['eth', 'arb', 'opt', 'base', 'gno'],
          default: 'eth',
        },
        from: { type: 'string', description: 'Sell token symbol or address' },
        to: { type: 'string', description: 'Buy token symbol or address' },
        amount: { type: 'string', description: 'Sell amount in human units' },
        minAmountOut: {
          type: 'string',
          description: 'Minimum output amount (human units)',
        },
        ttlSeconds: {
          type: 'number',
          description: 'Order validity in seconds (default 1800)',
        },
        feeAmountBp: {
          type: 'number',
          description: 'Fee cap in basis points (default 0)',
        },
        receiver: {
          type: 'string',
          description: 'Receiver address (defaults to sender)',
        },
        sender: {
          type: 'string',
          description: 'Safe avatar or signer address',
        },
      },
      required: ['chain', 'from', 'to', 'amount', 'minAmountOut', 'sender'],
    },
  },
]
