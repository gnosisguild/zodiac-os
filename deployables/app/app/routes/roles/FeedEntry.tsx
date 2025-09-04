import { DebugJson } from '@/components'
import { GhostButton, Modal } from '@zodiac/ui'
import { ArrowRight, Code, LucideIcon } from 'lucide-react'
import { PropsWithChildren, useState } from 'react'
import { Account, AccountType } from 'ser-kit'
import { LabeledAddress } from './AddressLabelContext'

type FeedEntryProps = PropsWithChildren<{
  icon: LucideIcon
  action: string
  raw: unknown
}>

export const FeedEntry = ({
  action,
  icon: Icon,
  children,
  raw,
}: FeedEntryProps) => {
  const [showRaw, setShowRaw] = useState(false)

  return (
    <>
      <div className="grid flex-1 grid-cols-10 items-center gap-4 text-sm">
        <div className="col-span-2 flex items-start justify-start gap-2">
          <div className="rounded-full border border-zinc-700 bg-zinc-800 p-1">
            <Icon className="size-3" />
          </div>

          {action}
        </div>

        {children && (
          <div className="col-span-7 col-start-3 grid grid-cols-3 gap-4">
            {children}
          </div>
        )}

        <div className="flex justify-end">
          <GhostButton
            iconOnly
            size="tiny"
            icon={Code}
            onClick={() => setShowRaw(true)}
          >
            Show raw
          </GhostButton>
        </div>
      </div>

      <Modal
        open={showRaw}
        onClose={() => setShowRaw(false)}
        size="4xl"
        title="Raw call data"
      >
        <DebugJson data={raw} />

        <Modal.Actions>
          <Modal.CloseAction>Close</Modal.CloseAction>
        </Modal.Actions>
      </Modal>
    </>
  )
}

export const Description = ({ account }: { account: Account }) => {
  switch (account.type) {
    case AccountType.SAFE: {
      return (
        <div className="flex flex-col items-start gap-2 text-sm">
          <div className="font-semibold">
            Setup <span className="underline">Safe</span>{' '}
          </div>
          <LabeledAddress>{account.address}</LabeledAddress>
        </div>
      )
    }
    case AccountType.ROLES: {
      return (
        <div className="flex flex-col items-start gap-2 text-sm">
          <div className="font-semibold">
            Setup <span className="underline">Roles Mod</span>{' '}
          </div>

          <div className="flex items-center gap-2">
            <LabeledAddress>{account.address}</LabeledAddress>
            <ArrowRight className="size-4" />
            <LabeledAddress>{account.target}</LabeledAddress>
          </div>
        </div>
      )
    }
  }
}

export const LabeledItem = ({
  label,
  children,
}: PropsWithChildren<{ label: string }>) => (
  <div className="flex flex-col gap-4">
    <div className="text-xs font-semibold opacity-75">{label}</div>
    <div>{children}</div>
  </div>
)
