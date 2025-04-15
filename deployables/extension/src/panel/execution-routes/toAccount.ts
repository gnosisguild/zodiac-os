import type { Account } from '@/companion'
import type { ExecutionRoute } from '@/types'
import { getChainId } from '@zodiac/chains'
import { unprefixAddress } from 'ser-kit'

export const toAccount = (route: ExecutionRoute): Account => ({
  id: route.id,
  chainId: getChainId(route.avatar),
  address: unprefixAddress(route.avatar),
  label: route.label ?? null,
})
