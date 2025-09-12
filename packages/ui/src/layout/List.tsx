import { ComponentPropsWithoutRef } from 'react'
import { Labeled } from '../inputs'

type ListProps = Omit<ComponentPropsWithoutRef<'ul'>, 'className'> & {
  label: string
}

export const List = ({ label, ...props }: ListProps) => (
  <Labeled label={label}>
    <ul
      {...props}
      aria-label={label}
      className="list-inside list-disc text-sm"
    />
  </Labeled>
)

type ListItemProps = Omit<ComponentPropsWithoutRef<'li'>, 'className'> & {
  label?: string
}

export const ListItem = ({ label, children, ...props }: ListItemProps) => {
  const resolvedLabel =
    label != null ? label : typeof children === 'string' ? children : undefined

  return (
    <li {...props} aria-label={resolvedLabel}>
      {children}
    </li>
  )
}
