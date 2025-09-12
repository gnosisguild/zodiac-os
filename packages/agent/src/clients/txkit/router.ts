import { AaveV3Builder } from './builders/aave_v3'
import { CowSwapBuilder } from './builders/cowswap'
import { LidoBuilder } from './builders/lido'
import { ActionBuilder, ActionRequest, ExecutionPayload } from './types'

const builders: ActionBuilder[] = [
  new CowSwapBuilder(),
  new AaveV3Builder(),
  new LidoBuilder(),
]

export async function buildExecutableTx(
  req: ActionRequest,
): Promise<ExecutionPayload> {
  const builder = builders.find((b) =>
    b.supports(req.protocol, req.action, req.chain),
  )
  if (!builder)
    throw new Error(
      `No builder for ${req.protocol}/${req.action} on ${req.chain}`,
    )
  return builder.build(req)
}
