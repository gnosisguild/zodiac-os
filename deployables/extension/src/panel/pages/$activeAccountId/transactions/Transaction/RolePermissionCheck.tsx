import { useOptionalExecutionRoute } from '@/execution-routes'
import {
  Translate,
  useApplicableTranslation,
  usePermissionCheck,
  useTransaction,
} from '@/transactions'
import { recordCalls, useRoleRecordLink } from '@/zodiac'
import { invariant } from '@epic-web/invariant'
import { getRolesAppUrl } from '@zodiac/env'
import type { ExecutionRoute, PrefixedAddress } from '@zodiac/schema'
import {
  errorToast,
  GhostLinkButton,
  Popover,
  SecondaryButton,
  SecondaryLinkButton,
  Spinner,
  Tag,
} from '@zodiac/ui'
import {
  CassetteTape,
  Check,
  SquareArrowOutUpRight,
  TriangleAlert,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { useState } from 'react'
import { AccountType, ConnectionType } from 'ser-kit'
import { decodeKey as decodeRoleKey } from 'zodiac-roles-sdk'

type Props = {
  transactionId: string
  mini?: boolean
}

enum RecordCallState {
  Initial,
  Pending,
  Done,
}

export const RolePermissionCheck = ({ transactionId, mini = false }: Props) => {
  const route = useOptionalExecutionRoute()

  const transaction = useTransaction(transactionId)
  const permissionCheck = usePermissionCheck(transactionId)
  const translation = useApplicableTranslation(transactionId)

  // if the role is unambiguous and from a v2 Roles module, we can record a permissions request to the Roles app
  const roleToRecordToCandidates = extractRoles(route).filter(
    (r) => r.version === 2 && (r.defaultRole || r.roles.length === 1),
  )
  const roleToRecordTo =
    roleToRecordToCandidates.length === 1
      ? {
          rolesMod: roleToRecordToCandidates[0].rolesMod,
          roleKey:
            roleToRecordToCandidates[0].defaultRole ||
            roleToRecordToCandidates[0].roles[0],
        }
      : undefined

  const rolePageLink =
    roleToRecordTo &&
    `${getRolesAppUrl()}/${roleToRecordTo.rolesMod}/roles/${decodeRoleKey(roleToRecordTo.roleKey)}`
  const roleRecordLink = useRoleRecordLink(roleToRecordTo)

  const [recordCallState, setRecordCallState] = useState(
    RecordCallState.Initial,
  )
  const recordCall = async () => {
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
  }

  if (mini) {
    if (permissionCheck.isPending) {
      return <Tag head={<Spinner />} color="blue" />
    }

    if (permissionCheck.isSkipped) {
      return <Tag head={<UserRound size={16} />} color="gray" />
    }

    if (permissionCheck.error == null) {
      return <Tag head={<UsersRound size={16} />} color="green" />
    }

    return <Tag head={<UsersRound size={16} />} color="red" />
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        Role permissions
        <div className="flex gap-2">
          {permissionCheck.isPending ? (
            <Tag head={<Spinner />} color="blue">
              Checking...
            </Tag>
          ) : permissionCheck.isSkipped ? (
            <Tag color="gray">Skipped</Tag>
          ) : permissionCheck.error != null ? (
            <Popover
              popover={<span className="text-sm">{permissionCheck.error}</span>}
            >
              <Tag head={<TriangleAlert size={16} />} color="red">
                Error
              </Tag>
            </Popover>
          ) : (
            <Tag head={<Check size={16} />} color="green">
              Allowed
            </Tag>
          )}

          {rolePageLink && (
            <GhostLinkButton
              openInNewWindow
              iconOnly
              size="small"
              icon={SquareArrowOutUpRight}
              to={rolePageLink}
            >
              View role permissions
            </GhostLinkButton>
          )}
        </div>
      </div>

      {permissionCheck.error != null && (
        <>
          <Translate transactionId={transactionId} />

          {translation == null && roleToRecordTo && (
            <div className="flex flex-wrap items-center gap-2">
              {recordCallState === RecordCallState.Done ? (
                <SecondaryButton fluid disabled icon={Check} size="small">
                  Request recorded
                </SecondaryButton>
              ) : (
                <SecondaryButton
                  fluid
                  icon={CassetteTape}
                  size="small"
                  onClick={recordCall}
                  busy={recordCallState === RecordCallState.Pending}
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
          )}
        </>
      )}
    </div>
  )
}

type Role = {
  rolesMod: PrefixedAddress
  version: 1 | 2
  roles: string[]
  defaultRole?: string
}

const extractRoles = (route: ExecutionRoute | null) => {
  if (route == null) {
    return []
  }

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
