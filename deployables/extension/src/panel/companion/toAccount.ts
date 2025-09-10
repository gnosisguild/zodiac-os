import { getChainId } from '@zodiac/chains'
import { ExecutionRoute } from '@zodiac/schema'
import { unprefixAddress } from 'ser-kit'
import type { PartialLocalAccount } from './PartialAccount'

export const toAccount = (route: ExecutionRoute): PartialLocalAccount => ({
  id: route.id,
  chainId: getChainId(route.avatar),
  address: unprefixAddress(route.avatar),
  label: route.label ?? null,
})
