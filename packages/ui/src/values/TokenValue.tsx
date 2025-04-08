import type { ReactNode } from 'react'
import { NumberValue } from './NumberValue'

type TokenValueProps = {
  action?: ReactNode
  symbol?: string | null
  children: `${number}`
  delta?: `${number}`
}

export const TokenValue = ({
  children,
  action,
  symbol,
  delta,
}: TokenValueProps) => {
  return (
    <span className="inline-flex items-center gap-2">
      {symbol && (
        <span className="text-xs font-semibold uppercase opacity-75">
          {symbol}
        </span>
      )}

      <NumberValue precision={4} delta={delta}>
        {children}
      </NumberValue>

      {action}
    </span>
  )
}
