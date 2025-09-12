import {
  getProtocolConfig,
  isProtocolSupported,
} from '../../../clients/defikit/protocols'
import { resolveTokenAddress } from '../../../services/token-resolver'
import {
  ActionBuilder,
  ActionRequest,
  ExecutionPayload,
  SafeTxPayload,
} from '../types'
import { parseAmountToUnits } from '../utils/amount'
import { CHAIN_ID_MAP } from '../utils/chain'

export class AaveV3Builder implements ActionBuilder {
  supports(protocol: string, action: string, chain: any): boolean {
    return (
      protocol === 'aave_v3' &&
      (action === 'deposit' || action === 'borrow') &&
      isProtocolSupported('aave_v3', chain, action as any)
    )
  }

  async build(req: ActionRequest): Promise<ExecutionPayload> {
    if (!this.supports(req.protocol, req.action, req.chain)) {
      throw new Error('Unsupported protocol/action/chain for Aave v3')
    }

    const chain = req.chain
    const chainId = CHAIN_ID_MAP[chain]

    // Determine Pool address by market
    const cfg = getProtocolConfig('aave_v3')
    const deployment = cfg?.deployments[chain]
    const market = req.market || 'Core'
    const poolAddr = deployment?.markets?.[market]
    if (!poolAddr) {
      throw new Error(
        `Aave v3 Pool address not found for market ${market} on ${chain}`,
      )
    }

    const assetSymbolOrAddress = req.asset || req.from
    if (!assetSymbolOrAddress)
      throw new Error('Missing asset token (asset/from)')
    if (!req.amount) throw new Error('Missing amount')

    const asset = resolveTokenAddress(String(assetSymbolOrAddress), chain)
    if (!asset || !asset.startsWith('0x'))
      throw new Error(`Cannot resolve asset: ${assetSymbolOrAddress}`)

    const amountUnits = parseAmountToUnits(
      String(req.amount),
      String(assetSymbolOrAddress),
      chain,
    )

    const onBehalfOf = req.onBehalfOf || req.sender
    const referralCode = req.referralCode ?? 0

    let safeTx: SafeTxPayload
    let preview: string

    if (req.action === 'deposit') {
      safeTx = {
        to: poolAddr,
        value: '0',
        operation: 0,
        contractMethod: {
          name: 'supply',
          payable: false,
          inputs: [
            { name: 'asset', type: 'address' },
            { name: 'amount', type: 'uint256' },
            { name: 'onBehalfOf', type: 'address' },
            { name: 'referralCode', type: 'uint16' },
          ],
        },
        contractInputsValues: {
          asset,
          amount: amountUnits.value,
          onBehalfOf,
          referralCode: String(referralCode),
        },
      }
      preview = `Aave v3 ${market} deposit ${req.amount} ${assetSymbolOrAddress} on ${chain}`
    } else {
      const irm = req.interestRateMode ?? 2 // 1 = Stable, 2 = Variable
      safeTx = {
        to: poolAddr,
        value: '0',
        operation: 0,
        contractMethod: {
          name: 'borrow',
          payable: false,
          inputs: [
            { name: 'asset', type: 'address' },
            { name: 'amount', type: 'uint256' },
            { name: 'interestRateMode', type: 'uint256' },
            { name: 'referralCode', type: 'uint16' },
            { name: 'onBehalfOf', type: 'address' },
          ],
        },
        contractInputsValues: {
          asset,
          amount: amountUnits.value,
          interestRateMode: String(irm),
          referralCode: String(referralCode),
          onBehalfOf,
        },
      }
      preview = `Aave v3 ${market} borrow ${req.amount} ${assetSymbolOrAddress} on ${chain} (IRM ${irm === 1 ? 'Stable' : 'Variable'})`
    }

    return {
      kind: 'safeTx',
      chainId,
      preview,
      safeTx,
    }
  }
}
