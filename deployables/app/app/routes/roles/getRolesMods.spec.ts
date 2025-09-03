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
  roleActionAssetFactory,
  roleActionFactory,
  roleFactory,
  tenantFactory,
  userFactory,
  walletFactory,
} from '@zodiac/db/test-utils'
import { createMockEoaAccount } from '@zodiac/modules/test-utils'
import { AllowanceInterval } from '@zodiac/schema'
import { AccountType, resolveAccounts } from 'ser-kit'
import { beforeEach, describe, expect, vi } from 'vitest'
import { encodeKey } from 'zodiac-roles-sdk'
import { getRefillPeriod } from './getRefillPeriod'
import { getRolesMods } from './getRolesMods'

vi.mock('ser-kit', async (importOriginal) => {
  const module = await importOriginal<typeof import('ser-kit')>()

  return {
    ...module,

    resolveAccounts: vi.fn(),
  }
})

const mockResolveAccounts = vi.mocked(resolveAccounts)

describe('getRoleMods', () => {
  beforeEach(() => {
    mockResolveAccounts.mockResolvedValue({
      current: [],
      desired: [],
    })

    vi.setSystemTime(new Date())
  })

  dbIt('creates a roles mod for an active account', async () => {
    const user = await userFactory.create()
    const tenant = await tenantFactory.create(user)

    const account = await accountFactory.create(tenant, user)

    const role = await roleFactory.create(tenant, user)

    await setActiveAccounts(dbClient(), role, [account.id])

    const { rolesMods } = await getRolesMods(role, { members: [] })

    expect(rolesMods).toHaveLength(1)

    const [mod] = rolesMods

    expect(mod).toEqual({
      type: AccountType.ROLES,
      allowances: {},
      avatar: account.address,
      target: account.address,
      owner: account.address,
      chain: account.chainId,
      nonce: account.nonce,
      roles: expect.anything(),
    })
  })

  describe('Allowances', () => {
    dbIt('adds allowances from the configured assets', async () => {
      const user = await userFactory.create()
      const tenant = await tenantFactory.create(user)

      const account = await accountFactory.create(tenant, user)

      const role = await roleFactory.create(tenant, user)
      const action = await roleActionFactory.create(role, user)
      const asset = await roleActionAssetFactory.create(action, {
        allowance: 1000n,
        interval: AllowanceInterval.Daily,
      })

      await setActiveAccounts(dbClient(), role, [account.id])

      const {
        rolesMods: [mod],
      } = await getRolesMods(role, { members: [] })

      expect(mod).toHaveProperty('allowances', {
        [encodeKey(asset.allowanceKey)]: {
          balance: 1000n,
          maxRefill: 1000n,
          period: getRefillPeriod(AllowanceInterval.Daily),
          refill: 1000n,
          timestamp: 0n,
          key: encodeKey(asset.allowanceKey),
        },
      })
    })
  })

  describe('Roles', () => {
    dbIt('adds a role to the roles mod', async () => {
      const user = await userFactory.create()
      const tenant = await tenantFactory.create(user)

      const account = await accountFactory.create(tenant, user)

      const role = await roleFactory.create(tenant, user)

      await setActiveAccounts(dbClient(), role, [account.id])

      const {
        rolesMods: [mod],
      } = await getRolesMods(role, { members: [] })

      expect(mod).toHaveProperty('roles', {
        [encodeKey(role.key)]: {
          key: encodeKey(role.key),
          annotations: [],
          targets: [],
          members: [],
        },
      })
    })

    describe('Members', () => {
      dbIt('adds the configured members to the role', async () => {
        const user = await userFactory.create()
        const tenant = await tenantFactory.create(user)

        const wallet = await walletFactory.create(user)

        await setDefaultWallet(dbClient(), user, {
          walletId: wallet.id,
          chainId: Chain.ETH,
        })

        const account = await accountFactory.create(tenant, user, {
          chainId: Chain.ETH,
        })

        const role = await roleFactory.create(tenant, user)

        await setRoleMembers(dbClient(), role, [user.id])
        await setActiveAccounts(dbClient(), role, [account.id])

        const {
          rolesMods: [mod],
        } = await getRolesMods(role, {
          members: [createMockEoaAccount({ address: wallet.address })],
        })

        expect(mod).toHaveProperty('roles', {
          [encodeKey(role.key)]: expect.objectContaining({
            members: [wallet.address],
          }),
        })
      })
    })
  })
})
