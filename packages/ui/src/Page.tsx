import { type PropsWithChildren, type Ref } from 'react'
import { Divider } from './layout'

export const Page = ({ children }: PropsWithChildren) => (
  <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
)

const Header = ({ children }: PropsWithChildren) => (
  <>
    <div className="flex flex-col">{children}</div>

    <Divider />
  </>
)

Page.Header = Header

Page.Content = ({
  children,
  ref,
}: {
  children: React.ReactNode
  ref?: Ref<HTMLDivElement>
}) => (
  <div
    ref={ref}
    className="shadow-xs mx-2 flex flex-1 flex-col gap-4 overflow-y-auto rounded-lg bg-white p-4 ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10"
  >
    {children}
  </div>
)

const Footer = ({ children }: PropsWithChildren) => (
  <div className="flex flex-col gap-4 p-4">{children}</div>
)

Page.Footer = Footer
