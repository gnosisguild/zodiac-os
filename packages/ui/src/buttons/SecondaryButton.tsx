import classNames from 'classnames'
import {
  BaseButton,
  type BaseButtonProps,
  BaseLinkButton,
  type BaseLinkButtonProps,
} from './BaseButton'
import type { WithStyle } from './types'

type SecondaryButtonProps = WithStyle<Omit<BaseButtonProps, 'className'>>

export const SecondaryButton = ({
  style = 'regular',
  ...props
}: SecondaryButtonProps) => (
  <BaseButton
    {...props}
    className={classNames(
      'font-bold ring-2 ring-transparent',
      style === 'regular' &&
        'border-zinc-300 bg-white text-zinc-600 focus:border-transparent focus:ring-indigo-600 enabled:hover:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:ring-teal-400 dark:enabled:hover:border-zinc-600 dark:enabled:hover:bg-zinc-800',
    )}
  />
)

type SecondaryLinkButtonProps = WithStyle<
  Omit<BaseLinkButtonProps, 'className'>
>

export const SecondaryLinkButton = ({
  style = 'regular',
  ...props
}: SecondaryLinkButtonProps) => (
  <BaseLinkButton
    {...props}
    className={classNames(
      'font-bold ring-2 ring-transparent',
      style === 'regular' &&
        'border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400 focus:border-transparent focus:ring-indigo-600 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 dark:focus:ring-teal-400',
    )}
  />
)
