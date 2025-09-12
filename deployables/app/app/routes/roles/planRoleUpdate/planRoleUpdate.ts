import { dbClient, getRole } from '@zodiac/db'
import { HexAddress } from '@zodiac/schema'
import { UUID } from 'crypto'
import { planApplyAccounts, resolveAccounts } from 'ser-kit'
import { getMemberSafes } from './getMemberSafes'
import { getRolesMods } from './getRolesMods'
import { groupByFrom } from './groupByFrom'

export const planRoleUpdate = async (
  roleId: UUID,
  accountForSetup: HexAddress,
) => {
  const role = await getRole(dbClient(), roleId)

  const { safes, issues: memberIssues } = await getMemberSafes(role)
  const resolvedSafes = await resolveAccounts({
    updatesOrCreations: safes,
    accountForSetup,
  })

  const { rolesMods, issues: roleIssues } = await getRolesMods(role, {
    members: resolvedSafes.desired,
  })

  const resolvedRolesMods = await resolveAccounts({
    updatesOrCreations: rolesMods,
  })

  const result = await planApplyAccounts({
    current: [...resolvedSafes.current, ...resolvedRolesMods.current],
    desired: [...resolvedSafes.desired, ...resolvedRolesMods.desired],
    accountForSetup,
  })

  return {
    issues: [...roleIssues, ...memberIssues],
    slices: groupByFrom(result, accountForSetup),
  }
}
