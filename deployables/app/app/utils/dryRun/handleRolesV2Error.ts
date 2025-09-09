import { decodeKey as decodeRoleKey } from 'zodiac-roles-sdk'
import { decodeGenericError, decodeRolesV2Error } from './decodeError'
import type { JsonRpcError } from './JsonRpcError'

export const handleRolesV2Error = (e: JsonRpcError, roleKey: string) => {
  const rolesError = decodeRolesV2Error(e)
  if (rolesError) {
    switch (rolesError.signature) {
      case 'NotAuthorized(address)':
        return 'The connected account must be enabled as a module of the modifier.'

      case 'ConditionViolation(uint8,bytes32)':
        // this is the expected error for a working Roles mod setup
        return null

      case 'NoMembership()':
        return `The connected account is not a member of role ${decodeRoleKey(
          roleKey,
        )}.`

      default:
    }
  }

  const decoded = decodeGenericError(e)
  console.warn('Unexpected Roles v2 error', e, decoded)
  return decoded || 'Unexpected error'
}
