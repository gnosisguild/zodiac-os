import { StepsByAccount } from '@zodiac/db/schema'
import {
  createMockSafeAccount,
  createMockTransactionRequest,
} from '@zodiac/modules/test-utils'
import { randomAddress } from '@zodiac/test-utils'
import { AccountType } from 'ser-kit'

export const createMockStepsByAccount = (): StepsByAccount => ({
  account: createMockSafeAccount(),
  steps: [
    {
      from: randomAddress(),
      call: {
        call: 'createNode',
        accountType: AccountType.SAFE,
        creationNonce: 0n,
        args: {
          owners: [],
          modules: [],
          threshold: 1,
        },
        deploymentAddress: randomAddress(),
      },
      transaction: createMockTransactionRequest(),
    },
  ],
})
