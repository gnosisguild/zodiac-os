import { dbClient, getRole } from '@zodiac/db'
import { UUID } from 'crypto'
import { planApplyAccounts, resolveAccounts } from 'ser-kit'
import { getMemberSafes } from './getMemberSafes'
import { getRolesMods } from './getRolesMods'

export const planRoleUpdate = async (roleId: UUID) => {
  const role = await getRole(dbClient(), roleId)

  const { safes, issues: memberIssues } = await getMemberSafes(role)
  const resolvedSafes = await resolveAccounts({
    updatesOrCreations: safes,
  })

  const { rolesMods, issues: roleIssues } = await getRolesMods(role, {
    members: resolvedSafes.desired,
  })

  const resolvedRolesMods = await resolveAccounts({
    updatesOrCreations: rolesMods,
  })

  return {
    issues: [...roleIssues, ...memberIssues],
    plan: await planApplyAccounts({
      current: [...resolvedSafes.current, ...resolvedRolesMods.current],
      desired: [...resolvedSafes.desired, ...resolvedRolesMods.desired],
    }),
  }
}
