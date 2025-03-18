import { ZERO_ADDRESS } from '@zodiac/chains'
import type { HexAddress, PrefixedAddress } from '@zodiac/schema'
import classNames from 'classnames'
import { splitPrefixedAddress } from 'ser-kit'
import { getAddress } from 'viem'
import { CopyToClipboard } from '../CopyToClipboard'
import { Empty } from '../Empty'
import { defaultSize, type Size } from '../common'
import { Popover } from '../overlays'
import { Blockie } from './Blockie'

type AddressProps = {
  children: HexAddress | PrefixedAddress
  size?: Size
  /**
   * Render a copy button next to the address
   *
   * @default false
   */
  allowCopy?: boolean
  /**
   * Only show the first and last 4 characters of the given address
   *
   * @default false
   * */
  shorten?: boolean
}

export const Address = ({
  children,
  size = defaultSize,
  allowCopy = false,
  shorten = false,
}: AddressProps) => {
  const [, address] = splitPrefixedAddress(children)

  if (address === ZERO_ADDRESS) {
    return (
      <div className="flex items-center gap-2 overflow-hidden">
        <Blockie
          address={ZERO_ADDRESS}
          className={classNames(
            size === 'base' && 'size-5',
            size === 'small' && 'size-4',
          )}
        />
        <Empty />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 overflow-hidden">
      <Blockie
        address={address}
        className={classNames(
          size === 'base' && 'size-5',
          size === 'small' && 'size-4',
          size === 'tiny' && 'size-3',
        )}
      />

      <code
        className={classNames(
          'max-w-full overflow-hidden text-ellipsis text-nowrap font-mono',
          shorten && 'cursor-default uppercase',
          size === 'small' && 'text-xs',
          size === 'tiny' && 'text-xs',
        )}
      >
        {shorten ? <ShortAddress>{address}</ShortAddress> : getAddress(address)}
      </code>

      {allowCopy && (
        <CopyToClipboard iconOnly data={address} size="tiny">
          Copy address
        </CopyToClipboard>
      )}
    </div>
  )
}

const VISIBLE_START = 4
const VISIBLE_END = 4

const ShortAddress = ({ children }: { children: HexAddress }) => {
  const start = children.substring(2, VISIBLE_START + 2)
  const end = children.substring(42 - VISIBLE_END, 42)

  return (
    <Popover
      position="bottom"
      popover={<Address size="small">{children}</Address>}
    >
      <span className="flex items-center">
        <span className="lowercase">0x</span>
        {start}
        <span className="font-sans">...</span>
        {end}
      </span>
    </Popover>
  )
}
