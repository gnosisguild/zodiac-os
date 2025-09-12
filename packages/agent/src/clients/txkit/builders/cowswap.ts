import { isProtocolSupported } from '../../../clients/defikit/protocols'
import { resolveTokenAddress } from '../../../services/token-resolver'
import { ActionBuilder, ActionRequest, ExecutionPayload } from '../types'
import { encodeBytes32Ascii, parseAmountToUnits } from '../utils/amount'
import { CHAIN_ID_MAP, GPV2_SETTLEMENT } from '../utils/chain'

function normalizeSymbolForCow(
  symbol: string,
  chain: keyof typeof CHAIN_ID_MAP,
): string {
  const s = symbol.toUpperCase()
  if (s === 'ETH' || s === 'NATIVE' || s === 'ETHER') {
    if (chain === 'gno') return 'WXDAI'
    return 'WETH'
  }
  return s
}

export class CowSwapBuilder implements ActionBuilder {
  supports(protocol: string, action: string, chain: any): boolean {
    return (
      protocol === 'cowswap' &&
      action === 'swap' &&
      isProtocolSupported('cowswap', chain, 'swap')
    )
  }

  async build(req: ActionRequest): Promise<ExecutionPayload> {
    if (!this.supports(req.protocol, req.action, req.chain)) {
      throw new Error('Unsupported protocol/action/chain for CowSwap')
    }

    if (!req.from || !req.to) throw new Error('Missing from/to tokens')
    if (!req.amount) throw new Error('Missing amount')
    if (!req.sender) throw new Error('Missing sender')

    const chain = req.chain
    const chainId = CHAIN_ID_MAP[chain]
    const receiver = req.receiver || req.sender
    const ttl = req.ttlSeconds ?? 1800
    const validTo = Math.floor(Date.now() / 1000) + ttl

    const fromSym = normalizeSymbolForCow(req.from, chain)
    const toSym = normalizeSymbolForCow(req.to, chain)

    const fromAddr = resolveTokenAddress(fromSym, chain)
    const toAddr = resolveTokenAddress(toSym, chain)
    if (!fromAddr || !fromAddr.startsWith('0x'))
      throw new Error(`Cannot resolve from token: ${req.from}`)
    if (!toAddr || !toAddr.startsWith('0x'))
      throw new Error(`Cannot resolve to token: ${req.to}`)

    const amountUnits = parseAmountToUnits(String(req.amount), fromSym, chain)

    if (!req.minAmountOut) {
      throw new Error('minAmountOut is required when quoting is disabled')
    }
    const minOutUnits = parseAmountToUnits(
      String(req.minAmountOut),
      toSym,
      chain,
    )

    const domain = {
      name: 'Gnosis Protocol',
      version: 'v2',
      chainId,
      verifyingContract:
        req.verifyingContractOverride || GPV2_SETTLEMENT[chain],
    }

    const types = {
      Order: [
        { name: 'sellToken', type: 'address' },
        { name: 'buyToken', type: 'address' },
        { name: 'receiver', type: 'address' },
        { name: 'sellAmount', type: 'uint256' },
        { name: 'buyAmount', type: 'uint256' },
        { name: 'validTo', type: 'uint32' },
        { name: 'appData', type: 'bytes32' },
        { name: 'feeAmount', type: 'uint256' },
        { name: 'kind', type: 'bytes32' },
        { name: 'partiallyFillable', type: 'bool' },
        { name: 'sellTokenBalance', type: 'bytes32' },
        { name: 'buyTokenBalance', type: 'bytes32' },
      ],
    }

    const message = {
      sellToken: fromAddr,
      buyToken: toAddr,
      receiver,
      sellAmount: amountUnits.value,
      buyAmount: minOutUnits.value,
      validTo,
      appData: '0x' + '0'.repeat(64),
      feeAmount: '0',
      kind: encodeBytes32Ascii('sell'),
      partiallyFillable: false,
      sellTokenBalance: encodeBytes32Ascii('erc20'),
      buyTokenBalance: encodeBytes32Ascii('erc20'),
    }

    const preview = `CowSwap swap ${req.amount} ${req.from} → ${req.to} on ${chain} (min ${req.minAmountOut}, ttl ${ttl}s)`

    return {
      kind: 'eip712',
      chainId,
      preview,
      eip712: {
        domain,
        types,
        primaryType: 'Order',
        message,
        signer: req.sender,
        metadata: {
          protocol: 'cowswap',
          action: 'swap',
        },
      },
    }
  }
}
