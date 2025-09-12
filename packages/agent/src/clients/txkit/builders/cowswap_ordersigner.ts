import { ActionRequest, ExecutionPayload, SafeTxPayload } from '../types'
import { COW_ADDRESSES } from '../utils/chain'
import { CowSwapBuilder } from './cowswap'

// Build a Safe-compatible transaction calling OrderSigner.signOrder using the same
// order fields produced for EIP-712 signing. This enables contract-based pre-signing.
export async function buildCowOrderSignerPreSign(
  req: ActionRequest,
): Promise<ExecutionPayload> {
  // Reuse normalization by first building the EIP-712 order
  const eip = await new CowSwapBuilder().build(req)
  if (!eip.eip712) throw new Error('Failed to create base EIP-712 order')
  const { message } = eip.eip712

  const chainId = eip.chainId
  const chain = req.chain
  const to = COW_ADDRESSES.OrderSigner[chain]
  const validDuration = req.ttlSeconds ?? 1800
  const feeAmountBp = req.feeAmountBp ?? 0

  const safeTx: SafeTxPayload = {
    to,
    value: '0',
    operation: 1,
    contractMethod: {
      name: 'signOrder',
      payable: false,
      inputs: [
        {
          name: 'order',
          type: 'tuple',
          components: [
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
        },
        { name: 'validDuration', type: 'uint32' },
        { name: 'feeAmountBp', type: 'uint256' },
      ],
    },
    contractInputsValues: {
      'order.sellToken': message.sellToken,
      'order.buyToken': message.buyToken,
      'order.receiver': message.receiver,
      'order.sellAmount': message.sellAmount,
      'order.buyAmount': message.buyAmount,
      'order.validTo': String(message.validTo),
      'order.appData': message.appData,
      'order.feeAmount': message.feeAmount,
      'order.kind': message.kind,
      'order.partiallyFillable': message.partiallyFillable,
      'order.sellTokenBalance': message.sellTokenBalance,
      'order.buyTokenBalance': message.buyTokenBalance,
      validDuration: String(validDuration),
      feeAmountBp: String(feeAmountBp),
    },
  }

  return {
    kind: 'safeTx',
    chainId,
    preview: `OrderSigner.signOrder pre-sign on ${chain} for ${req.amount} ${req.from} → ${req.to}`,
    safeTx,
  }
}
