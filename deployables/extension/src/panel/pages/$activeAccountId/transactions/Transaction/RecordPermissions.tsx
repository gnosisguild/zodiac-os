import { useOptionalExecutionRoute } from '@/execution-routes'
import { useTransaction } from '@/transactions'
import { recordCalls, useRoleRecordLink } from '@/zodiac'
import { invariant } from '@epic-web/invariant'
import { getRolesAppUrl } from '@zodiac/env'
import { ExecutionRoute } from '@zodiac/schema'
import { errorToast, SecondaryButton, SecondaryLinkButton } from '@zodiac/ui'
import { CassetteTape, Check, SquareArrowOutUpRight } from 'lucide-react'
import { useState } from 'react'
import { AccountType, ConnectionType, PrefixedAddress } from 'ser-kit'
import { decodeKey as decodeRoleKey } from 'zodiac-roles-sdk'

type RecordPermissionProps = { transactionId: string }

export const RecordPermissions = ({ transactionId }: RecordPermissionProps) => {
  const { recordCall, roleRecordLink, canRecord, isPending, isDone } =
    useRecordCall(transactionId)

  if (!canRecord) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isDone ? (
        <SecondaryButton fluid disabled icon={Check} size="small">
          Request recorded
        </SecondaryButton>
      ) : (
        <SecondaryButton
          fluid
          icon={CassetteTape}
          size="small"
          onClick={recordCall}
          busy={isPending}
        >
          Request permission
        </SecondaryButton>
      )}

      {roleRecordLink && (
        <SecondaryLinkButton
          fluid
          openInNewWindow
          size="small"
          icon={SquareArrowOutUpRight}
          to={roleRecordLink}
        >
          View requested permissions
        </SecondaryLinkButton>
      )}
    </div>
  )
}

enum RecordCallState {
  Initial,
  Pending,
  Done,
}

const useRecordCall = (transactionId: string) => {
  const route = useOptionalExecutionRoute()

  const roleToRecordTo = findRoleToRecordTo(route)
  const roleRecordLink = useRoleRecordLink(roleToRecordTo)

  const [recordCallState, setRecordCallState] = useState(
    RecordCallState.Initial,
  )
  const transaction = useTransaction(transactionId)

  return {
    isPending: recordCallState === RecordCallState.Pending,
    isDone: recordCallState === RecordCallState.Done,

    canRecord: roleToRecordTo != null,

    roleRecordLink,

    async recordCall() {
      invariant(roleToRecordTo, 'No role to record to')
      setRecordCallState(RecordCallState.Pending)

      try {
        await recordCalls([transaction], roleToRecordTo)

        setRecordCallState(RecordCallState.Done)
      } catch (e) {
        errorToast({
          id: 'roles-record-call-error',
          title: 'Error recording call',
          message: (e as Error).message,
        })

        setRecordCallState(RecordCallState.Initial)
      }
    },
  }
}

type Role = {
  rolesMod: PrefixedAddress
  version: 1 | 2
  roles: string[]
  defaultRole?: string
}

const extractRoles = (route: ExecutionRoute) => {
  if (route.waypoints == null) {
    return []
  }

  return route.waypoints.reduce<Role[]>((result, waypoint) => {
    if (waypoint.account.type !== AccountType.ROLES) {
      return result
    }

    if (!('connection' in waypoint)) {
      return result
    }

    if (waypoint.connection.type !== ConnectionType.IS_MEMBER) {
      return result
    }

    return [
      ...result,
      {
        rolesMod: waypoint.account.prefixedAddress,
        version: waypoint.account.version,
        roles: waypoint.connection.roles,
        defaultRole: waypoint.connection.defaultRole,
      },
    ]
  }, [])
}

export const useRolePageLink = () => {
  const route = useOptionalExecutionRoute()
  const roleToRecordTo = findRoleToRecordTo(route)

  if (roleToRecordTo == null) {
    return
  }

  return `${getRolesAppUrl()}/${roleToRecordTo.rolesMod}/roles/${decodeRoleKey(roleToRecordTo.roleKey)}`
}

const findRoleToRecordTo = (route: ExecutionRoute | null) => {
  if (route == null) {
    return null
  }

  // if the role is unambiguous and from a v2 Roles module, we can record a permissions request to the Roles app
  const roleToRecordToCandidates = extractRoles(route).filter(
    (r) => r.version === 2 && (r.defaultRole || r.roles.length === 1),
  )

  if (roleToRecordToCandidates.length !== 1) {
    return null
  }

  return {
    rolesMod: roleToRecordToCandidates[0].rolesMod,
    roleKey:
      roleToRecordToCandidates[0].defaultRole ||
      roleToRecordToCandidates[0].roles[0],
  }
}
