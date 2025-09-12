import { Chain } from '@zodiac/chains'
import { createMockSafeAccount } from '@zodiac/modules/test-utils'
import { randomAddress } from '@zodiac/test-utils'
import { describe, expect, it } from 'vitest'
import { groupByFrom } from './groupByFrom'

describe('groupByFrom', () => {
  it('uses the setup account for steps that can be executed by anyone', () => {
    const setupSafe = randomAddress()
    const account = createMockSafeAccount()

    const result = groupByFrom(
      [{ account, steps: [], from: undefined }],
      new Map(Object.entries({ [Chain.ETH]: setupSafe })),
    )

    expect(Object.fromEntries(result.entries())).toEqual({
      [Chain.ETH]: [
        {
          from: setupSafe,
          accountBuilderResult: [{ account, steps: [], from: undefined }],
        },
      ],
    })
  })

  it('keeps the "from" for steps that have it set', async () => {
    const account = createMockSafeAccount()
    const from = randomAddress()
    const setupSafe = randomAddress()

    const result = groupByFrom(
      [{ account, steps: [], from }],
      new Map(Object.entries({ [Chain.ETH]: setupSafe })),
    )

    expect(Object.fromEntries(result.entries())).toEqual({
      [Chain.ETH]: [
        { from, accountBuilderResult: [{ account, steps: [], from }] },
      ],
    })
  })

  it('groups results by chain', () => {
    const accountA = createMockSafeAccount({ chainId: Chain.ETH })
    const accountB = createMockSafeAccount({ chainId: Chain.GNO })

    const safeA = randomAddress()
    const safeB = randomAddress()

    const result = groupByFrom(
      [
        { account: accountA, steps: [], from: undefined },
        { account: accountB, steps: [], from: undefined },
      ],
      new Map(Object.entries({ [Chain.ETH]: safeA, [Chain.GNO]: safeB })),
    )

    expect(Object.fromEntries(result.entries())).toEqual({
      [Chain.ETH]: [
        {
          from: safeA,
          accountBuilderResult: [
            { account: accountA, steps: [], from: undefined },
          ],
        },
      ],
      [Chain.GNO]: [
        {
          from: safeB,
          accountBuilderResult: [
            { account: accountB, steps: [], from: undefined },
          ],
        },
      ],
    })
  })
})
