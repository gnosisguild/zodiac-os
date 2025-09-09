import { invariant } from '@epic-web/invariant'
import type { Account } from '@zodiac/schema'
import { Info, Popover } from '@zodiac/ui'
import type { PropsWithChildren } from 'react'
import {
  AccountType,
  ConnectionType,
  type Connection as SerConnection,
} from 'ser-kit'
import { decodeKey as decodeRoleKey } from 'zodiac-roles-sdk'
import { useOrientation } from './Routes'

type ConnectionProps = PropsWithChildren<{
  connection?: SerConnection
  account: Account
}>

export const Connection = ({
  connection,
  account,
  children,
}: ConnectionProps) => {
  const orientation = useOrientation()

  const popoverPosition = orientation === 'vertical' ? 'right' : 'top'

  if (connection == null) {
    return null
  }

  if (connection.type === ConnectionType.OWNS) {
    return (
      <Popover
        position={popoverPosition}
        popover={<span className="leading-0 text-xs">Owns</span>}
      >
        <div className="rounded-full bg-indigo-500/20 p-1 text-indigo-600 dark:bg-teal-500/20 dark:text-teal-300">
          {children}
        </div>
      </Popover>
    )
  }

  if (connection.type === ConnectionType.IS_MEMBER) {
    invariant(
      account.type === AccountType.ROLES,
      'IS_MEMBER connection can only be defined with a roles account',
    )

    return (
      <Popover
        position={popoverPosition}
        popover={<Roles version={account.version} connection={connection} />}
      >
        <div className="rounded-full bg-indigo-500/20 p-1 text-indigo-600 dark:bg-teal-500/20 dark:text-teal-300">
          {children}
        </div>
      </Popover>
    )
  }

  return <div className="p-1">{children}</div>
}

export const DirectConnection = ({ children }: PropsWithChildren) => (
  <div className="flex flex-col items-center gap-4">
    {children}

    <Info>Direct connection</Info>
  </div>
)

const Roles = ({
  connection,
  version,
}: {
  connection: SerConnection
  version: 1 | 2
}) => {
  if (connection.type !== ConnectionType.IS_MEMBER) {
    return null
  }

  if (version === 1) {
    return (
      <>
        <h3 className="mb-2 whitespace-nowrap text-xs font-semibold uppercase">
          Role ID
        </h3>

        <span className="whitespace-nowrap text-xs">{connection.roles[0]}</span>
      </>
    )
  }

  return (
    <>
      <h3 className="mb-2 whitespace-nowrap text-xs font-semibold uppercase">
        Possible roles
      </h3>
      <ul className="list-inside list-disc text-xs">
        {connection.roles.map((roleKey) => (
          <li key={roleKey}>{decodeRoleKey(roleKey)}</li>
        ))}
      </ul>
    </>
  )
}
