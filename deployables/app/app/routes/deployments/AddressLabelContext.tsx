import { HexAddress } from '@zodiac/schema'
import { Address } from '@zodiac/web3'
import {
  ComponentProps,
  createContext,
  PropsWithChildren,
  useContext,
} from 'react'
import { unprefixAddress } from 'ser-kit'

export type Labels = Record<HexAddress, string>
const AddressLabelContext = createContext<Labels>({})

export const ProvideAddressLabels = ({
  children,
  labels,
}: PropsWithChildren<{ labels: Labels }>) => (
  <AddressLabelContext value={labels}>{children}</AddressLabelContext>
)

export const LabeledAddress = ({
  children,
  ...props
}: Omit<ComponentProps<typeof Address>, 'shorten' | 'size'>) => {
  const labels = useContext(AddressLabelContext)

  const address = unprefixAddress(children as HexAddress)

  return (
    <Address {...props} label={labels[address]} shorten size="small">
      {children}
    </Address>
  )
}
