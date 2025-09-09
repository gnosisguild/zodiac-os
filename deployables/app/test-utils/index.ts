import type {
  CompanionAppMessage,
  CompanionResponseMessage,
} from '@zodiac/messages'
import { createExpectMessage } from '@zodiac/test-utils'

export { activateRoute } from './activateRoute'
export { createMockApprovalLog } from './createMockApprovalLog'
export { createMockChain } from './createMockChain'
export { createMockExecuteTransactionAction } from './createMockExecuteTransactionAction'
export { createMockListResult } from './createMockListResult'
export { createMockProposeTransactionAction } from './createMockProposeTransactionAction'
export { createMockSimulatedTransaction } from './createMockSimulatedTransaction'
export { createMockStepsByAccount } from './createMockStepsByAccount'
export { createMockTokenBalance } from './createMockTokenBalance'
export { loadAndActivateRoute } from './loadAndActivateRoute'
export { loadRoutes } from './loadRoutes'
export { post } from './post'
export { postMessage } from './postMessage'
export { regexEscape } from './regexEscape'
export { render } from './render'
export * from './workOS'

export const expectMessage = await createExpectMessage<
  CompanionAppMessage | CompanionResponseMessage
>()
