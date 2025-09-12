import { resolveTokenAddress } from '../../../services/token-resolver'
import { ApproveRequest, ExecutionPayload, SafeTxPayload } from '../types'
import { parseAmountToUnits } from '../utils/amount'
import { CHAIN_ID_MAP } from '../utils/chain'

const MAX_UINT256 =
  '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'

export async function buildErc20Approve(
  req: ApproveRequest,
): Promise<ExecutionPayload> {
  if (!/^0x[a-fA-F0-9]{40}$/.test(req.spender)) {
    throw new Error('Invalid spender address')
  }
  const chainId = CHAIN_ID_MAP[req.chain]
  const tokenAddr = resolveTokenAddress(req.token, req.chain)
  if (!tokenAddr || !tokenAddr.startsWith('0x'))
    throw new Error(`Cannot resolve token: ${req.token}`)

  let amount: string
  if (typeof req.amount === 'string' && req.amount.toLowerCase() === 'max') {
    amount = MAX_UINT256
  } else {
    amount = parseAmountToUnits(String(req.amount), req.token, req.chain).value
  }

  const safeTx: SafeTxPayload = {
    to: tokenAddr,
    value: '0',
    operation: 0,
    contractMethod: {
      name: 'approve',
      payable: false,
      inputs: [
        { name: 'spender', type: 'address' },
        { name: 'amount', type: 'uint256' },
      ],
    },
    contractInputsValues: {
      spender: req.spender,
      amount,
    },
  }

  const preview = `ERC20 approve ${req.token} → ${req.spender} for ${typeof req.amount === 'string' && req.amount.toLowerCase() === 'max' ? 'MAX' : req.amount}`

  return {
    kind: 'safeTx',
    chainId,
    preview,
    safeTx,
  }
}
