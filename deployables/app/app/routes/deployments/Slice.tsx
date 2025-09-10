import { DeploymentSlice } from '@zodiac/db/schema'
import { useIsPending } from '@zodiac/hooks'
import {
  Card,
  Collapsible,
  Divider,
  InlineForm,
  PrimaryLinkButton,
  SecondaryButton,
} from '@zodiac/ui'
import { Address, TransactionStatus } from '@zodiac/web3'
import { href } from 'react-router'
import { prefixAddress } from 'ser-kit'
import { Call } from './Call'
import { Description } from './FeedEntry'
import { Intent } from './intents'

type SliceProps = {
  slice: DeploymentSlice
  deploymentCancelled: boolean
}

export const Slice = ({ slice, deploymentCancelled }: SliceProps) => {
  const pending = useIsPending(
    Intent.ExecuteTransaction,
    (data) => data.get('deploymentSliceId') === slice.id,
  )

  return (
    <Card key={slice.from}>
      {slice.steps.map(({ account, steps }) => (
        <Collapsible
          key={account.address}
          header={
            <div className="flex flex-1 items-center justify-between gap-8">
              <Description account={account} />
              <span className="text-xs">
                {steps.length === 1 ? '1 call' : `${steps.length} calls`}
              </span>
            </div>
          }
        >
          <div className="flex flex-col gap-4 divide-y divide-zinc-700 pt-4">
            {steps.map((step, index) => (
              <div key={index} className="not-last:pb-4">
                <Call callData={step.call} chainId={slice.chainId} />
              </div>
            ))}
          </div>
        </Collapsible>
      ))}
      <Divider />
      <div className="flex flex-1 items-center justify-between gap-8">
        <Address>{slice.from}</Address>

        <div className="flex items-center gap-2">
          {slice.transactionHash != null && (
            <TransactionStatus hash={slice.transactionHash}>
              Deployed
            </TransactionStatus>
          )}

          <InlineForm
            context={{
              deploymentSliceId: slice.id,
              from: prefixAddress(slice.chainId, slice.from),
            }}
          >
            <SecondaryButton
              submit
              size="small"
              disabled={deploymentCancelled || slice.transactionHash != null}
              intent={Intent.ExecuteTransaction}
              busy={pending}
              onClick={(event) => event.stopPropagation()}
            >
              Deploy
            </SecondaryButton>
          </InlineForm>

          {slice.proposedTransactionId && slice.cancelledAt == null && (
            <PrimaryLinkButton
              size="small"
              to={href('/workspace/:workspaceId/submit/proposal/:proposalId', {
                workspaceId: slice.workspaceId,
                proposalId: slice.proposedTransactionId,
              })}
            >
              Show transaction
            </PrimaryLinkButton>
          )}
        </div>
      </div>
    </Card>
  )
}
