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
import {
  createMockEoaAccount,
  createMockRole,
  createMockRolesAccount,
} from '@zodiac/modules/test-utils'
import { AllowanceInterval } from '@zodiac/schema'
import { AccountType, prefixAddress, queryAccounts } from 'ser-kit'
import { beforeEach, describe, expect, vi } from 'vitest'
import { encodeKey as encodeRoleKey } from 'zodiac-roles-sdk'
import { getRefillPeriod } from './getRefillPeriod'
import { getRolesMods } from './getRolesMods'
import { predictRolesModAddress } from './predictAddress'

vi.mock('ser-kit', async (importOriginal) => {
  const module = await importOriginal<typeof import('ser-kit')>()

  return {
    ...module,

    queryAccounts: vi.fn(),
  }
})

const mockQueryAccounts = vi.mocked(queryAccounts)

describe('getRoleMods', () => {
  beforeEach(() => {
    mockQueryAccounts.mockResolvedValue([])

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

    const address = predictRolesModAddress(account)

    expect(mod).toEqual({
      type: AccountType.ROLES,
      version: 2,
      address,
      prefixedAddress: prefixAddress(account.chainId, address),
      allowances: [],
      avatar: account.address,
      target: account.address,
      owner: account.address,
      chain: account.chainId,
      modules: [],
      multisend: [],
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

      expect(mod).toHaveProperty('allowances', [
        {
          balance: 1000n,
          maxRefill: 1000n,
          period: getRefillPeriod(AllowanceInterval.Daily),
          refill: 1000n,
          timestamp: BigInt(new Date().getTime()),
          key: encodeRoleKey(asset.allowanceKey),
        },
      ])
    })
    dbIt.todo('keeps existing allowances')
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

      expect(mod).toHaveProperty('roles', [
        {
          key: encodeRoleKey(role.key),
          annotations: [],
          targets: [],
          members: [],
        },
      ])
    })

    dbIt('keeps existing roles', async () => {
      const user = await userFactory.create()
      const tenant = await tenantFactory.create(user)

      const account = await accountFactory.create(tenant, user)

      const address = predictRolesModAddress(account)

      const existingRole = createMockRole()

      mockQueryAccounts.mockResolvedValue([
        createMockRolesAccount({
          address,
          avatar: account.address,
          roles: [existingRole],
        }),
      ])

      const role = await roleFactory.create(tenant, user)

      await setActiveAccounts(dbClient(), role, [account.id])

      const {
        rolesMods: [mod],
      } = await getRolesMods(role, { members: [] })

      expect(mod).toHaveProperty('roles', [
        existingRole,
        {
          key: encodeRoleKey(role.key),
          annotations: [],
          targets: [],
          members: [],
        },
      ])
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

        expect(mod).toHaveProperty('roles', [
          expect.objectContaining({ members: [wallet.address] }),
        ])
      })
    })
  })
})
