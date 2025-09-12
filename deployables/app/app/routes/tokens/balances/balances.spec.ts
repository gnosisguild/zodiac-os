import { getTokenBalances } from '@/balances-server'
import { createMockTokenBalance, render } from '@/test-utils'
import { screen } from '@testing-library/react'
import { randomAddress } from '@zodiac/test-utils'
import { mockAccount } from '@zodiac/web3/test-utils'
import { href } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetTokenBalances = vi.mocked(getTokenBalances)

describe('Token balances', () => {
  beforeEach(async () => {
    mockAccount()
  })

  it('is possible to send funds of a token', async () => {
    const address = randomAddress()

    mockGetTokenBalances.mockResolvedValue([
      createMockTokenBalance({ contractId: address }),
    ])

    await render(href('/offline/tokens/balances'))

    expect(await screen.findByRole('link', { name: 'Send' })).toHaveAttribute(
      'href',
      href(`/offline/tokens/send/:chain?/:token?`, {
        chain: 'eth',
        token: address,
      }),
    )
  })
})
