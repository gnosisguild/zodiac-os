import { getAccounts, getFeatures, getUser } from '@/companion'
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { sleepTillIdle } from '@zodiac/test-utils'
import { configMocks, mockAnimationsApi } from 'jsdom-testing-mocks'
import { afterAll, afterEach, beforeEach, vi } from 'vitest'

vi.mock('@zodiac/env', async (importOriginal) => {
  const module = await importOriginal<typeof import('@zodiac/env')>()

  return {
    ...module,

    getCompanionAppUrl: vi.fn(),
  }
})

vi.mock('@/companion', async (importOriginal) => {
  const module = await importOriginal<typeof import('@/companion')>()

  return {
    ...module,

    getUser: vi.fn().mockResolvedValue(null),
    getAccounts: vi.fn().mockResolvedValue([]),
    getFeatures: vi.fn().mockResolvedValue([]),
  }
})

const mockGetUser = vi.mocked(getUser)
const mockGetAccounts = vi.mocked(getAccounts)
const mockGetFeatures = vi.mocked(getFeatures)

beforeEach(() => {
  mockGetUser.mockResolvedValue(null)
  mockGetAccounts.mockResolvedValue([])
  mockGetFeatures.mockResolvedValue([])
})

configMocks({ afterEach, afterAll })

mockAnimationsApi()

window.document.body.innerHTML = '<div id="root"></div>'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

afterEach(async () => {
  await sleepTillIdle()

  cleanup()
})
