import { beforeEach, vi } from 'vitest'
import { useConnectorClient } from '../src'

vi.mock('@zodiac/web3', async (importOriginal) => {
  const module = await importOriginal<typeof import('@zodiac/web3')>()

  return {
    ...module,

    useAccount: vi.fn(module.useAccount),
    useConnectorClient: vi.fn(module.useConnectorClient),
  }
})

const mockUseConnectorClient = vi.mocked(useConnectorClient)

beforeEach(() => {
  // @ts-expect-error We just need this to be there
  mockUseConnectorClient.mockReturnValue({ data: {} })
})
