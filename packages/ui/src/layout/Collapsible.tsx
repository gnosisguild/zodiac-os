import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@headlessui/react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { PropsWithChildren, type ReactNode } from 'react'
import { GhostButton } from '../buttons'

type CollapsibleProps = PropsWithChildren<{
  header: ReactNode
  defaultOpen?: boolean
}>

export const Collapsible = ({
  header,
  children,
  defaultOpen = false,
}: CollapsibleProps) => {
  return (
    <Disclosure as="div" defaultOpen={defaultOpen} className="w-full">
      {({ open }) => (
        <>
          <DisclosureButton
            as="div"
            className="group flex w-full cursor-pointer items-center justify-between gap-4"
          >
            <div className="flex flex-1">{header}</div>

            <GhostButton
              iconOnly
              icon={open ? ChevronUp : ChevronDown}
              size="small"
            >
              {open ? 'Close' : 'Open'}
            </GhostButton>
          </DisclosureButton>

          <div className="overflow-hidden">
            <DisclosurePanel
              transition
              className="data-closed:-translate-y-6 data-closed:opacity-0 origin-top transition duration-200 ease-out"
            >
              {children}
            </DisclosurePanel>
          </div>
        </>
      )}
    </Disclosure>
  )
}
