import { Chain } from '@zodiac/chains'
import {
  dbClient,
  setActiveAccounts,
  setDefaultWallet,
  setRoleMembers,
} from '@zodiac/db'
import {
  accountFactory,
  dbIt,
  roleFactory,
  tenantFactory,
  userFactory,
  walletFactory,
} from '@zodiac/db/test-utils'
import { AccountType, resolveAccounts } from 'ser-kit'
import { beforeEach, describe, expect, vi } from 'vitest'
import { getMemberSafes } from './getMemberSafes'

vi.mock('ser-kit', async (importOriginal) => {
  const module = await importOriginal<typeof import('ser-kit')>()

  return {
    ...module,

    resolveAccounts: vi.fn(),
  }
})

const mockResolveAccounts = vi.mocked(resolveAccounts)

describe('getMemberSafes', () => {
  beforeEach(() => {
    mockResolveAccounts.mockResolvedValue({
      current: [],
      desired: [],
    })
  })

  dbIt('creates safes for members', async () => {
    const user = await userFactory.create()
    const tenant = await tenantFactory.create(user)

    const wallet = await walletFactory.create(user)

    await setDefaultWallet(dbClient(), user, {
      walletId: wallet.id,
      chainId: Chain.ETH,
    })

    const role = await roleFactory.create(tenant, user)
    const account = await accountFactory.create(tenant, user, {
      chainId: Chain.ETH,
    })

    await setActiveAccounts(dbClient(), role, [account.id])
    await setRoleMembers(dbClient(), role, [user.id])

    const { safes } = await getMemberSafes(role)

    expect(safes).toEqual([
      {
        type: AccountType.SAFE,
        chain: Chain.ETH,
        modules: [],
        owners: [wallet.address],
        threshold: 1,
        nonce: user.nonce,
      },
    ])
  })

  dbIt('creates a safe on every chain that is active', async () => {
    const user = await userFactory.create()
    const tenant = await tenantFactory.create(user)

    const wallet = await walletFactory.create(user)

    await setDefaultWallet(dbClient(), user, {
      walletId: wallet.id,
      chainId: Chain.ETH,
    })
    await setDefaultWallet(dbClient(), user, {
      walletId: wallet.id,
      chainId: Chain.GNO,
    })

    const role = await roleFactory.create(tenant, user)

    const ethAccount = await accountFactory.create(tenant, user, {
      label: 'Account A',
      chainId: Chain.ETH,
    })
    const gnoAccount = await accountFactory.create(tenant, user, {
      label: 'Account B',
      chainId: Chain.GNO,
    })

    await setRoleMembers(dbClient(), role, [user.id])
    await setActiveAccounts(dbClient(), role, [ethAccount.id, gnoAccount.id])

    const { safes } = await getMemberSafes(role)

    expect(safes).toEqual([
      {
        type: AccountType.SAFE,
        chain: Chain.ETH,
        modules: [],
        owners: [wallet.address],
        threshold: 1,
        nonce: user.nonce,
      },
      {
        type: AccountType.SAFE,
        chain: Chain.GNO,
        modules: [],
        owners: [wallet.address],
        threshold: 1,
        nonce: user.nonce,
      },
    ])
  })

  dbIt('creates only one safe per chain', async () => {
    const user = await userFactory.create()
    const tenant = await tenantFactory.create(user)

    const wallet = await walletFactory.create(user)

    await setDefaultWallet(dbClient(), user, {
      walletId: wallet.id,
      chainId: Chain.ETH,
    })

    const role = await roleFactory.create(tenant, user)

    const accountA = await accountFactory.create(tenant, user, {
      label: 'Account A',
      chainId: Chain.ETH,
    })
    const accountB = await accountFactory.create(tenant, user, {
      label: 'Account B',
      chainId: Chain.ETH,
    })

    await setRoleMembers(dbClient(), role, [user.id])
    await setActiveAccounts(dbClient(), role, [accountA.id, accountB.id])

    const { safes } = await getMemberSafes(role)

    expect(safes).toEqual([
      {
        type: AccountType.SAFE,
        chain: Chain.ETH,
        modules: [],
        owners: [wallet.address],
        threshold: 1,
        nonce: user.nonce,
      },
    ])
  })
})
