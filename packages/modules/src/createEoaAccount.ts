import type { HexAddress } from '@zodiac/schema'
import { AccountType, ExecutionAccount, prefixAddress } from 'ser-kit'

type EOA = Extract<ExecutionAccount, { type: AccountType.EOA }>

export type CreateEoaAccountOptions = {
  address: HexAddress
}

export const createEoaAccount = ({
  address,
}: CreateEoaAccountOptions): EOA => ({
  type: AccountType.EOA,
  address,
  prefixedAddress: prefixAddress(undefined, address),
})
