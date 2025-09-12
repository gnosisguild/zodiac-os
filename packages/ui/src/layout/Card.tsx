import { PropsWithChildren, ReactNode } from 'react'

type CardProps = PropsWithChildren<{ title?: ReactNode; titleId?: string }>

export const Card = ({ children, title, titleId }: CardProps) => (
  <section
    className="flex flex-col gap-4 rounded border border-zinc-300 p-4 dark:border-zinc-700"
    aria-labelledby={titleId}
  >
    {typeof title === 'string' ? (
      <h2 className="font-semibold">{title}</h2>
    ) : (
      title
    )}
    {children}
  </section>
)
