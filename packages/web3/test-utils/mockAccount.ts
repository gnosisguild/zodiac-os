import { Chain } from '@zodiac/chains'
import { HexAddress } from '@zodiac/schema'
import { randomAddress } from '@zodiac/test-utils'
import { vi } from 'vitest'
import { useAccount } from '../src'

type MockAccountOptions = { chainId?: Chain; address?: HexAddress }

const mockUseAccount = vi.mocked(useAccount)

export const mockAccount = ({
  chainId = Chain.ETH,
  address = randomAddress(),
}: MockAccountOptions = {}) => {
  // @ts-expect-error We really only want to use this subset
  mockUseAccount.mockReturnValue({ address, chainId })
}
