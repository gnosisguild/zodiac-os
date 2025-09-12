import { invariant } from '@epic-web/invariant'
import { Chain } from '@zodiac/chains'
import { StepsByAccount } from '@zodiac/db/schema'
import { HexAddress } from '@zodiac/schema'
import { AccountBuilderResult } from 'ser-kit'

type GroupByFromResult = Map<
  Chain,
  { from: HexAddress; accountBuilderResult: StepsByAccount[] }[]
>

export const groupByFrom = (
  ungroupedResult: AccountBuilderResult,
  accountForSetup: Map<Chain, HexAddress>,
): GroupByFromResult => {
  const stepsByChain = groupBy(ungroupedResult, (step) => step.account.chain)

  return Object.entries(stepsByChain).reduce<GroupByFromResult>(
    (result, [chainId, accountBuilderResults]) => {
      const ANYONE = 'ANYONE'
      const { [ANYONE]: stepsFromAnyone, ...stepsByFrom } = groupBy(
        accountBuilderResults,
        (step) => step.from ?? ANYONE,
      )
      // include steps without a `from` in the first group
      const firstGroup = Object.values(stepsByFrom)[0]

      if (firstGroup == null) {
        const from = accountForSetup.get(chainId)

        invariant(
          from != null,
          `Could not find a setup safe for chain "${chainId}"`,
        )

        // all steps can be executed by anyone – use specified accountForSetup
        return result.set(chainId, [
          {
            from,
            accountBuilderResult: stepsFromAnyone,
          },
        ])
      }

      if (stepsFromAnyone != null) {
        firstGroup.unshift(...stepsFromAnyone)
      }

      return result.set(
        chainId,
        Object.entries(stepsByFrom).map(([from, steps]) => ({
          from: from as HexAddress,
          accountBuilderResult: steps,
        })),
      )
    },
    new Map(),
  )
}

/**
 * Groups an array of items by a key extracted from each item
 * @param array - The array to group
 * @param keySelector - Function that extracts the key from each item
 * @returns An object where keys are the extracted values and values are arrays of items
 */
export function groupBy<T, K extends string | number | symbol>(
  array: T[],
  keySelector: (item: T) => K,
): Record<K, T[]> {
  return array.reduce(
    (groups, item) => {
      const key = keySelector(item)
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(item)

      return groups
    },
    {} as Record<K, T[]>,
  )
}
