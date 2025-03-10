import { useExecutionRoute } from '@/execution-routes'
import { useWindowId } from '@/inject-bridge'
import { Transition } from '@headlessui/react'
import {
  getPilotAddress,
  getRolesWaypoint,
  getStartingWaypoint,
} from '@zodiac/modules'
import { type ExecutionRoute, type HexAddress } from '@zodiac/schema'
import { Blockie, Form, GhostButton, Select } from '@zodiac/ui'
import { List, Pencil } from 'lucide-react'
import { useState } from 'react'
import { useSubmit } from 'react-router'
import Stick from 'react-stick'
import { unprefixAddress } from 'ser-kit'
import { ClearTransactionsModal } from '../../ClearTransactionsModal'
import { ConnectionStack } from '../../ConnectionStack'
import { useLaunchRoute } from '../../useLaunchRoute'
import { Intent } from './intents'

type AccountSelectProps = {
  accounts: ExecutionRoute[]
}

export const AccountSelect = ({ accounts }: AccountSelectProps) => {
  const route = useExecutionRoute()
  const windowId = useWindowId()
  const [hover, setHover] = useState(false)
  const submit = useSubmit()
  const [launchRoute, { isLaunchPending, cancelLaunch, proceedWithLaunch }] =
    useLaunchRoute({
      onLaunch(routeId) {
        submit({ intent: Intent.LaunchRoute, routeId }, { method: 'POST' })
      },
    })

  const pilotAddress = getPilotAddress([getStartingWaypoint(route.waypoints)])
  const rolesWaypoint = getRolesWaypoint(route)

  return (
    <>
      <div className="flex items-center gap-2 border-b border-zinc-200/80 bg-zinc-100/80 text-zinc-600 hover:border-zinc-300/80 dark:border-zinc-600/80 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-zinc-500/80">
        <Stick
          className="flex items-center gap-2 overflow-hidden"
          position="bottom left"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          node={
            <Transition
              show={hover}
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
              enter="transition-opacity"
              leave="transition-opacity"
            >
              <div className="isolate z-10 mx-4 pt-2">
                <div className="backdrop-blur-xs rounded-md border border-zinc-200/80 bg-zinc-100/80 px-4 py-2 shadow-lg dark:border-zinc-500/80 dark:bg-zinc-900/80">
                  <ConnectionStack route={route} />
                </div>
              </div>
            </Transition>
          }
        >
          <Blockies
            avatarAddress={unprefixAddress(route.avatar)}
            moduleAddress={
              rolesWaypoint == null ? undefined : rolesWaypoint.account.address
            }
            pilotAddress={pilotAddress}
          />
        </Stick>

        <Select
          inline
          isClearable={false}
          isMulti={false}
          isSearchable={false}
          className="flex-1"
          label="Accounts"
          onChange={(option) => {
            if (option == null) {
              return
            }

            launchRoute(option.value)
          }}
          defaultValue={{ value: route.id, name: route.label }}
          options={accounts.map((account) => ({
            value: account.id,
            name: account.label,
          }))}
        >
          {({ data: { name } }) => (
            <span className="overflow-hidden text-ellipsis whitespace-nowrap">
              {name || 'Unnamed route'}
            </span>
          )}
        </Select>

        <div className="mr-4 flex shrink-0 items-center gap-1">
          <Form context={{ routeId: route.id, windowId }}>
            <GhostButton
              submit
              iconOnly
              intent={Intent.EditAccount}
              icon={Pencil}
              size="small"
            >
              Edit account
            </GhostButton>
          </Form>

          <Form context={{ windowId }}>
            <GhostButton
              submit
              iconOnly
              intent={Intent.ListAccounts}
              icon={List}
              size="small"
            >
              List accounts
            </GhostButton>
          </Form>
        </div>
      </div>

      <ClearTransactionsModal
        open={isLaunchPending}
        onCancel={cancelLaunch}
        onAccept={proceedWithLaunch}
      />
    </>
  )
}

type BlockiesProps = {
  avatarAddress: HexAddress
  pilotAddress?: HexAddress
  moduleAddress?: HexAddress
}

const Blockies = ({
  pilotAddress,
  moduleAddress,
  avatarAddress,
}: BlockiesProps) => (
  <div className="flex shrink-0 p-2">
    {pilotAddress && (
      <div className="rounded-full border-2 border-slate-500 dark:border-slate-900">
        <Blockie address={pilotAddress} className="size-6" />
      </div>
    )}
    {moduleAddress && (
      <div className="-ml-4 rounded-full border-2 border-slate-500 first:ml-0 dark:border-slate-900">
        <Blockie address={moduleAddress} className="size-6" />
      </div>
    )}
    <div className="-ml-4 rounded-full border-2 border-slate-500 first:ml-0 dark:border-slate-900">
      <Blockie address={avatarAddress} className="size-6" />
    </div>
  </div>
)
