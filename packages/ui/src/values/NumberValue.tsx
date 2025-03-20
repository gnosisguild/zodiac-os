import { useMemo } from 'react'
import { Popover } from '../overlays'

type NumberValueProps = {
  children: number
  precision?: number
}

export const NumberValue = ({ children, precision = 2 }: NumberValueProps) => {
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

  return (
    <Popover
      inline
      popover={
        <span className="tabular-numbs text-sm slashed-zero">
          {defaultNumberFormatter.format(children)}
        </span>
      }
    >
      <span className="slashed-zero tabular-nums">
        {numberFormatter.format(children)}
      </span>
    </Popover>
  )
}
