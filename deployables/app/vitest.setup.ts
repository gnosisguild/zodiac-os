import {
  getAvailableChains,
  getChain,
  getTokenBalances,
  getTokenByAddress,
  isValidToken,
} from '@/balances-server'
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { sleepTillIdle } from '@zodiac/test-utils'
import {
  configMocks,
  mockAnimationsApi,
  mockResizeObserver,
} from 'jsdom-testing-mocks'
import { afterAll, afterEach, beforeEach, vi } from 'vitest'
import { dbClient, deleteAllFeatures, deleteAllTenants } from './db'
import { createMockChain } from './test-utils/createMockChain'
import { createMockToken } from './test-utils/createMockToken'

configMocks({ afterEach, afterAll })

mockAnimationsApi()
mockResizeObserver()

Element.prototype.scrollIntoView = vi.fn()

vi.mock('@/simulation-server', async () => {
  const actual = await vi.importActual<typeof import('@/simulation-server')>(
    '@/simulation-server',
  )
  return {
    ...actual,
    simulateBundleTransaction: vi.fn(async () => {
      return {
        simulation_results: [
          {
            transaction: {
              network_id: '1',
              transaction_info: {
                asset_changes: [],
              },
            },
          },
        ],
      }
    }),
  }
})

vi.mock('@/balances-server', async (importOriginal) => {
  const module = await importOriginal<typeof import('@/balances-server')>()

  return {
    ...module,

    isValidToken: vi.fn(),
    getTokenBalances: vi.fn(),
    getTokenDetails: vi.fn(),
    getAvailableChains: vi.fn(),
    getTokenByAddress: vi.fn(),
    getChain: vi.fn(),
  }
})

vi.mock('@workos-inc/authkit-react-router', async (importOriginal) => {
  const module =
    await importOriginal<typeof import('@workos-inc/authkit-react-router')>()

  return {
    ...module,
    authkitLoader: vi.fn(),
    getSignInUrl: vi.fn().mockResolvedValue('http://workos-test.com/sign-in'),
  }
})

vi.mock('@/workOS/server', async (importOriginal) => {
  const module = await importOriginal<typeof import('@/workOS/server')>()

  return {
    ...module,

    createOrganization: vi.fn(),
    getOrganizationForUser: vi.fn(),
  }
})

const mockGetAvailableChains = vi.mocked(getAvailableChains)
const mockGetChain = vi.mocked(getChain)
const mockGetTokenBalances = vi.mocked(getTokenBalances)
const mockGetTokenByAddress = vi.mocked(getTokenByAddress)
const mockIsValidToken = vi.mocked(isValidToken)

beforeEach(async () => {
  vi.spyOn(window, 'postMessage')

  const db = dbClient()

  mockGetAvailableChains.mockResolvedValue([])
  mockGetTokenBalances.mockResolvedValue([])
  mockGetTokenByAddress.mockResolvedValue(createMockToken())
  mockGetChain.mockResolvedValue(createMockChain())
  mockIsValidToken.mockResolvedValue(true)

  await Promise.all([deleteAllTenants(db), deleteAllFeatures(db)])
})

afterEach(async () => {
  await sleepTillIdle()

  cleanup()
})
