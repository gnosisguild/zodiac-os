import { useExecutionRoute } from '@/execution-routes'
import { useProvider } from '@/providers-ui'
import type { TransactionState } from '@/state'
import { useApplicableTranslation } from '@/transaction-translation'
import { invariant } from '@epic-web/invariant'
import { EOA_ZERO_ADDRESS } from '@zodiac/chains'
import { getRolesAppUrl } from '@zodiac/env'
import { decodeRoleKey } from '@zodiac/modules'
import type { ExecutionRoute } from '@zodiac/schema'
import {
  errorToast,
  GhostLinkButton,
  SecondaryButton,
  SecondaryLinkButton,
  Tag,
} from '@zodiac/ui'
import {
  CassetteTape,
  Check,
  SquareArrowOutUpRight,
  TriangleAlert,
  UsersRound,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  AccountType,
  checkPermissions,
  ConnectionType,
  PermissionViolation,
  type Route as SerRoute,
} from 'ser-kit'
import {
  recordCalls,
  useRoleRecordLink,
} from '../../../integrations/zodiac/roles'
import { Translate } from './Translate'

const extractRoles = (route: ExecutionRoute) => {
  return (
    route.waypoints?.flatMap((wp) => {
      if (
        wp.account.type === AccountType.ROLES &&
        'connection' in wp &&
        wp.connection.type === ConnectionType.IS_MEMBER
      ) {
        return {
          rolesMod: wp.account.prefixedAddress,
          version: wp.account.version,
          roles: wp.connection.roles,
          defaultRole: wp.connection.defaultRole,
        }
      }
      return []
    }) || []
  )
}

type Props = {
  transactionState: TransactionState
  mini?: boolean
}

enum RecordCallState {
  Initial,
  Pending,
  Done,
}

export const RolePermissionCheck = ({
  transactionState,
  mini = false,
}: Props) => {
  const [error, setError] = useState<PermissionViolation | false | undefined>(
    undefined,
  )
  const route = useExecutionRoute()
  const provider = useProvider()

  const translationAvailable = !!useApplicableTranslation(transactionState.id)

  useEffect(() => {
    let canceled = false
    if (provider == null) {
      return
    }

    const { waypoints } = route

    invariant(waypoints != null, 'Route must have waypoints')

    const checkableRoute = {
      ...route,
      waypoints,
      initiator: route.initiator ?? EOA_ZERO_ADDRESS,
    } satisfies SerRoute

    checkPermissions([transactionState.transaction], checkableRoute).then(
      ({ success, error }) => {
        if (!canceled) setError(success ? false : error)
      },
    )

    return () => {
      canceled = true
    }
  }, [transactionState, route, provider])

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
      await recordCalls([transactionState.transaction], roleToRecordTo)
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

  if (error === undefined) return null

  if (mini) {
    return (
      <>
        {error === false ? (
          <Tag head={<UsersRound size={16} />} color="green"></Tag>
        ) : (
          <Tag head={<UsersRound size={16} />} color="red"></Tag>
        )}
      </>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        Role permissions
        <div className="flex gap-2">
          {error === false ? (
            <Tag head={<Check size={16} />} color="green">
              Allowed
            </Tag>
          ) : (
            <Tag head={<TriangleAlert size={16} />} color="red">
              {error}
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

      {error && translationAvailable && (
        <Translate transactionId={transactionState.id} />
      )}

      {error && !translationAvailable && roleToRecordTo && (
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
    </div>
  )
}
