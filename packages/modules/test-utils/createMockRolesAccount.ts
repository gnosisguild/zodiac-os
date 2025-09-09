import { Chain, ZERO_ADDRESS } from '@zodiac/chains'
import type { HexAddress } from '@zodiac/schema'
import { randomAddress } from '@zodiac/test-utils'
import { Account, AccountType, ExecutionAccount, prefixAddress } from 'ser-kit'

type RolesExecutionAccount = Extract<
  ExecutionAccount,
  { type: AccountType.ROLES }
>

type CreateMockRolesExecutionAccountOptions = {
  chainId?: Chain
  address?: HexAddress
}

export const createMockRolesExecutionAccount = ({
  chainId = Chain.ETH,
  address = ZERO_ADDRESS,
}: CreateMockRolesExecutionAccountOptions = {}): RolesExecutionAccount => ({
  type: AccountType.ROLES,
  version: 2,
  multisend: [],
  address,
  prefixedAddress: prefixAddress(chainId, address),
  chain: chainId,
})

export type RolesAccount = Extract<Account, { type: AccountType.ROLES }>

type Role = RolesAccount['roles'][number]
type CreateMockRolesAccountOptions = CreateMockRolesExecutionAccountOptions & {
  avatar?: HexAddress
  roles?: Role[]
}

export const createMockRolesAccount = ({
  avatar = randomAddress(),
  roles = [],
  ...options
}: CreateMockRolesAccountOptions = {}): RolesAccount => ({
  ...createMockRolesExecutionAccount(options),

  avatar,
  owner: avatar,
  target: avatar,

  roles,
  allowances: [],
})
