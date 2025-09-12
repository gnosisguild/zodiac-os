import { Ellipsis } from 'lucide-react'
import { useState, type PropsWithChildren } from 'react'
import { GhostButton, type BaseButtonProps } from '../buttons'
import { Stick } from '../overlays/Stick'

type MeatballMenuProps = Pick<BaseButtonProps, 'size' | 'busy'> &
  PropsWithChildren<{
    label: string
    descriptionId?: string
  }>

export const MeatballMenu = ({
  label,
  size,
  children,
  descriptionId,
}: MeatballMenuProps) => {
  const [open, setOpen] = useState(false)

  return (
    <Stick
      position="bottom right"
      onClickOutside={() => setOpen(false)}
      node={
        open && (
          <div className="flex flex-col gap-1 rounded-md border p-1 shadow-md backdrop-blur dark:border-zinc-200/10 dark:bg-zinc-800/80">
            {children}
          </div>
        )
      }
    >
      <GhostButton
        iconOnly
        aria-describedby={descriptionId}
        size={size}
        icon={Ellipsis}
        onClick={(event) => {
          // This menu button can be placed in arbitrary places
          // including links and we don't want to cause a navigation
          // when someone opens a menu
          event.preventDefault()
          event.stopPropagation()

          setOpen(!open)
        }}
      >
        {label}
      </GhostButton>
    </Stick>
  )
}
