import { useAccount } from '@/accounts'
import { Translate, useTransaction } from '@/transactions'
import { chainCurrency } from '@zodiac/chains'
import { toMetaTransactionRequest } from '@zodiac/schema'
import { CopyToClipboard, Divider, TextInput, ToggleButton } from '@zodiac/ui'
import { formatEther, Fragment } from 'ethers'
import { useState, type PropsWithChildren } from 'react'
import { AddressField } from './AddressField'
import { DecodedTransaction } from './DecodedTransaction'
import { useFriendlyTransaction } from './friendly'
import { RawTransaction } from './RawTransaction'
import { Remove } from './Remove'
import { RolePermissionCheck } from './RolePermissionCheck'
import { SimulationStatus } from './SimulationStatus'
import { useDecodedFunctionData } from './useDecodedFunctionData'

interface Props {
  transactionId: string
}

export const Transaction = ({ transactionId }: Props) => {
  const transaction = useTransaction(transactionId)
  const [expanded, setExpanded] = useState(true)
  const decoded = useDecodedFunctionData(transactionId)

  const { FriendlyTitle, FriendlyBody } = useFriendlyTransaction(transactionId)

  return (
    <section
      aria-labelledby={transaction.id}
      className="flex flex-col rounded-md border border-zinc-300/80 dark:border-zinc-500/60"
    >
      <div className="bg-zinc-100/80 p-2 dark:bg-zinc-500/20">
        <TransactionHeader
          transactionId={transactionId}
          isDelegateCall={transaction.operation === 1}
          functionFragment={decoded?.functionFragment}
          expanded={expanded}
          onExpandToggle={() => setExpanded(!expanded)}
        >
          {FriendlyTitle ? (
            <FriendlyTitle transactionId={transactionId} />
          ) : (
            <GenericTitle transactionId={transactionId} />
          )}
        </TransactionHeader>
      </div>

      {expanded && (
        <div className="flex flex-col gap-3 border-t border-zinc-300 bg-zinc-200/80 px-2 py-4 text-sm dark:border-zinc-500/80 dark:bg-zinc-500/30">
          {FriendlyBody ? (
            <FriendlyBody transactionId={transactionId} />
          ) : (
            <GenericBody transactionId={transactionId} />
          )}
          <Divider />
          <TransactionStatus transactionId={transactionId} />
        </div>
      )}
    </section>
  )
}

const GenericBody = ({ transactionId }: { transactionId: string }) => {
  const transaction = useTransaction(transactionId)
  const decoded = useDecodedFunctionData(transactionId)
  const { chainId } = useAccount()
  return (
    <>
      <AddressField
        chainId={chainId}
        address={transaction.to}
        label="Contract"
        description={transaction.contractInfo?.name}
      />

      <EtherValue value={transaction.value} />

      {decoded ? (
        <DecodedTransaction {...decoded}>
          <Divider />
        </DecodedTransaction>
      ) : (
        <>
          <Divider />

          <RawTransaction data={transaction.data} />
        </>
      )}
    </>
  )
}

type HeaderProps = PropsWithChildren<{
  transactionId: string
  functionFragment?: Fragment
  onExpandToggle(): void
  expanded: boolean
  isDelegateCall: boolean
  children: React.ReactNode
}>

const TransactionHeader = ({
  transactionId,
  onExpandToggle,
  expanded,
  children,
}: HeaderProps) => {
  const transaction = useTransaction(transactionId)
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="flex cursor-pointer items-center gap-2 overflow-hidden">
        <ToggleButton expanded={expanded} onToggle={onExpandToggle} />
        {children}
      </label>

      <div className="flex items-center justify-end gap-2">
        <SimulationStatus transactionId={transactionId} mini />

        <RolePermissionCheck transactionId={transactionId} mini />

        <div className="flex">
          <Translate mini transactionId={transactionId} />

          <CopyToClipboard
            iconOnly
            size="small"
            data={toMetaTransactionRequest(transaction)}
          >
            Copy transaction data to clipboard
          </CopyToClipboard>
          <Remove transactionId={transactionId} />
        </div>
      </div>
    </div>
  )
}

const GenericTitle = ({ transactionId }: { transactionId: string }) => {
  const transaction = useTransaction(transactionId)
  const decoded = useDecodedFunctionData(transactionId)
  return (
    <div className="flex flex-col gap-1 overflow-hidden">
      <h5
        id={transactionId}
        className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold"
      >
        {decoded?.functionFragment
          ? decoded.functionFragment.format('sighash').split('(')[0]
          : 'Raw transaction'}
      </h5>

      {transaction.operation === 1 && (
        <span className="text-xs font-normal uppercase opacity-75">
          delegatecall
        </span>
      )}
    </div>
  )
}

interface StatusProps {
  transactionId: string
}

const TransactionStatus = ({ transactionId }: StatusProps) => (
  <>
    <SimulationStatus transactionId={transactionId} />

    <Divider />

    <RolePermissionCheck transactionId={transactionId} />
  </>
)

type EtherValueProps = { value: bigint }

const EtherValue = ({ value }: EtherValueProps) => {
  const { chainId } = useAccount()

  return (
    <TextInput
      readOnly
      value={formatEther(value || 0)}
      label="Amount"
      description={chainCurrency(chainId)}
    />
  )
}
