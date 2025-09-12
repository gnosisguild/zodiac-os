import { useMemo } from 'react'
import { Empty } from '../layout'
import { Popover } from '../overlays'
import { Delta } from './Delta'

type NumberValueProps = {
  children: number | bigint | Intl.StringNumericLiteral | null
  delta?: `${number}`
  precision?: number
}

export const NumberValue = ({
  children,
  precision = 2,
  delta,
}: NumberValueProps) => {
  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      }),
    [precision],
  )

  const defaultNumberFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 40,
      }),
    [],
  )

  const diffValue = delta && parseFloat(delta)
  const isPositive = diffValue && diffValue > 0
  const absDelta = delta?.startsWith('-')
    ? (delta.slice(1) as `${number}`)
    : delta

  if (children == null) {
    return <Empty />
  }

  return (
    <Popover
      inline
      popover={
        <div className="flex flex-col items-end gap-1" role="tooltip">
          <span className="tabular-numbs text-sm slashed-zero">
            {defaultNumberFormatter.format(children)}
          </span>
          {absDelta != null && (
            <Delta value={diffValue} invertedBackground>
              <span className="tabular-numbs text-sm slashed-zero">
                {isPositive ? '+' : '-'}{' '}
                {defaultNumberFormatter.format(absDelta)}
              </span>
            </Delta>
          )}
        </div>
      }
    >
      <Delta value={diffValue}>
        <span className="slashed-zero tabular-nums">
          {numberFormatter.format(children)}
        </span>
      </Delta>
    </Popover>
  )
}
