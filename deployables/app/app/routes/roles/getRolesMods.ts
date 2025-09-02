import {
  dbClient,
  getActivatedAccounts,
  getRoleActionAssets,
  getRoleActions,
} from '@zodiac/db'
import {
  Role,
  RoleAction,
  RoleActionAsset,
  RoleDeploymentIssue,
} from '@zodiac/db/schema'

import { Account, AccountType, NewAccount, UpdateAccount } from 'ser-kit'
import { Allowance, encodeKey, processPermissions } from 'zodiac-roles-sdk'
import { computeSwapPermissions } from './computeSwapPermissions'
import { getRefillPeriod } from './getRefillPeriod'

type UpdateOrNewRolesMod = Extract<
  UpdateAccount | NewAccount,
  { type: AccountType.ROLES }
>

type Result = {
  rolesMods: UpdateOrNewRolesMod[]
  issues: RoleDeploymentIssue[]
}

type GetRolesModsOptions = {
  members: Account[]
}

export const getRolesMods = async (
  role: Role,
  { members }: GetRolesModsOptions,
): Promise<Result> => {
  const activeAccounts = await getActivatedAccounts(dbClient(), {
    roleId: role.id,
  })

  if (activeAccounts.length === 0) {
    return {
      rolesMods: [],
      issues: [RoleDeploymentIssue.NoActiveAccounts],
    }
  }

  const actions = await getRoleActions(dbClient(), role.id)
  const assets = await getRoleActionAssets(dbClient(), {
    roleId: role.id,
  })

  const permissions = derivePermissions(actions, assets)
  const { annotations, targets } = processPermissions(permissions)
  const roleKey = encodeKey(role.key)

  const rolesMods = activeAccounts.map(
    (activeAccount): UpdateOrNewRolesMod => ({
      type: AccountType.ROLES,
      chain: activeAccount.chainId,
      nonce: activeAccount.nonce,

      avatar: activeAccount.address,
      owner: activeAccount.address,
      target: activeAccount.address,

      roles: {
        [roleKey]: {
          key: encodeKey(role.key),
          members: members.map((member) => member.address),
          annotations,
          targets,
        },
      },
      allowances: deriveAllowances(assets),
    }),
  )

  return {
    rolesMods,
    issues: [],
  }
}

const derivePermissions = (
  actions: RoleAction[],
  assets: RoleActionAsset[],
) => {
  return actions.flatMap((action) => {
    const actionAssets = assets.filter(
      (asset) => asset.roleActionId === action.id,
    )

    return computeSwapPermissions(actionAssets)
  })
}

const deriveAllowances = (assets: RoleActionAsset[]) =>
  assets.reduce<{ [key: string]: Allowance }>((result, asset) => {
    if (asset.allowance == null || asset.interval == null) {
      return result
    }

    const key = encodeKey(asset.allowanceKey)
    return {
      ...result,
      [key]: {
        balance: asset.allowance,
        key,
        maxRefill: asset.allowance,
        period: getRefillPeriod(asset.interval),
        refill: asset.allowance,
        timestamp: 0n, // setting it to zero means it will be set to the block timestamp when the allowance is set
      },
    }
  }, {})
