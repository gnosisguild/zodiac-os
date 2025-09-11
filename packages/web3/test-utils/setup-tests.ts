import { randomHex } from '@zodiac/test-utils'
import { beforeEach, vi } from 'vitest'
import { useConnectorClient, useSendTransaction } from '../src'

vi.mock('@zodiac/web3', async (importOriginal) => {
  const module = await importOriginal<typeof import('@zodiac/web3')>()

  return {
    ...module,

    useAccount: vi.fn(module.useAccount),
    useConnectorClient: vi.fn(module.useConnectorClient),
    useSendTransaction: vi.fn(module.useSendTransaction),
  }
})

const mockUseConnectorClient = vi.mocked(useConnectorClient)
const mockUseSendTransaction = vi.mocked(useSendTransaction)

beforeEach(async () => {
  // @ts-expect-error We just need this to be there
  mockUseConnectorClient.mockReturnValue({ data: {} })

  const { useSendTransaction: realUseSendTransaction } =
    await vi.importActual<typeof import('../src')>('../src')

  mockUseSendTransaction.mockImplementation((options) => {
    const result = realUseSendTransaction(options)

    return {
      ...result,
      sendTransaction: (variables, options) => {
        if (options != null && options.onSuccess) {
          options.onSuccess(randomHex(), variables, null)
        }
      },
    }
  })
})
