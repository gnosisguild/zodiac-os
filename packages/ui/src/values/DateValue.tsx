import { Empty } from '../layout'

type DateValueProps = {
  children: Date | number | null | undefined
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'long',
  timeStyle: 'short',
})

export const DateValue = ({ children }: DateValueProps) => {
  if (children == null) {
    return <Empty />
  }

  return (
    <span className="slashed-zero tabular-nums">
      {dateFormatter.format(children)}
    </span>
  )
}

export const formatDate = (value: Date | number) => dateFormatter.format(value)
