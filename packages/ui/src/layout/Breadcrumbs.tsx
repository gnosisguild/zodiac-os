import { Children, type ComponentProps, type PropsWithChildren } from 'react'
import { Link } from 'react-router'

export const Breadcrumbs = ({ children }: PropsWithChildren) => (
  <div className="flex items-center gap-2 font-mono text-xs uppercase opacity-75">
    {Children.map(children, (child) => (
      <>/{child}</>
    ))}
  </div>
)

const Entry = (props: Omit<ComponentProps<typeof Link>, 'className'>) => (
  <Link {...props} className="no-underline" />
)

Breadcrumbs.Entry = Entry
