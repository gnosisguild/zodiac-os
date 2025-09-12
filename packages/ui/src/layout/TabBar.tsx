import classNames from 'classnames'
import type { LucideIcon } from 'lucide-react'
import type { ComponentProps, PropsWithChildren, ReactNode } from 'react'
import { NavLink } from 'react-router'

type TabBarProps = PropsWithChildren<{ action?: ReactNode }>

export const TabBar = ({ children, action }: TabBarProps) => (
  <div
    role="tablist"
    className="flex items-center justify-between border-b border-zinc-300 dark:border-zinc-600"
  >
    <div className="flex items-center gap-2">{children}</div>

    {action}
  </div>
)

type LinkTabProps = Omit<
  ComponentProps<typeof NavLink>,
  'className' | 'role'
> & {
  icon?: LucideIcon
}

const LinkTab = ({ children, icon: Icon, ...props }: LinkTabProps) => {
  return (
    <NavLink
      {...props}
      role="tab"
      prefetch="render"
      className={({ isActive }) =>
        classNames(
          'flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium',
          isActive
            ? 'border-indigo-500 text-indigo-600 dark:border-teal-300 dark:text-teal-500'
            : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-300 dark:hover:text-zinc-50',
        )
      }
    >
      {typeof children === 'function' ? (
        (props) => children(props)
      ) : (
        <>
          {Icon && <Icon size={16} />}
          {children}
        </>
      )}
    </NavLink>
  )
}

TabBar.LinkTab = LinkTab
