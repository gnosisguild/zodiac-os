import {
  getProtocolConfig,
  isProtocolSupported,
} from '../../../clients/defikit/protocols'
import {
  ActionBuilder,
  ActionRequest,
  ExecutionPayload,
  SafeTxPayload,
} from '../types'
import { parseAmountToUnits } from '../utils/amount'
import { CHAIN_ID_MAP } from '../utils/chain'

export class LidoBuilder implements ActionBuilder {
  supports(protocol: string, action: string, chain: any): boolean {
    return (
      protocol === 'lido' &&
      action === 'deposit' &&
      isProtocolSupported('lido', chain, 'deposit')
    )
  }

  async build(req: ActionRequest): Promise<ExecutionPayload> {
    if (!this.supports(req.protocol, req.action, req.chain)) {
      throw new Error('Unsupported protocol/action/chain for Lido')
    }

    const chain = req.chain
    const chainId = CHAIN_ID_MAP[chain]

    if (!req.amount) throw new Error('Missing amount')

    // Lido main staking contract (stETH) per chain from SSOT
    const cfg = getProtocolConfig('lido')
    const deployment = cfg?.deployments[chain]
    const stEthAddr = deployment?.contracts?.stETH
    if (!stEthAddr)
      throw new Error(`Lido stETH contract not found on chain ${chain}`)

    // Amount is native ETH; encode as value
    // Use WETH for decimals reference (18) on mainnet when converting to wei
    const amountUnits = parseAmountToUnits(String(req.amount), 'WETH', chain)

    const referral =
      (req as any).referral || '0x0000000000000000000000000000000000000000'

    const safeTx: SafeTxPayload = {
      to: stEthAddr,
      value: amountUnits.value,
      operation: 0,
      contractMethod: {
        name: 'submit',
        payable: true,
        inputs: [{ name: 'referral', type: 'address' }],
      },
      contractInputsValues: {
        referral,
      },
    }

    const preview = `Lido deposit ${req.amount} ETH on ${chain}`

    return {
      kind: 'safeTx',
      chainId,
      preview,
      safeTx,
    }
  }
}
