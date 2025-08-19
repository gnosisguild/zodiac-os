import { Chain } from '@/routes-ui'
import { ChainId } from '@zodiac/chains'
import { NumberValue } from '@zodiac/ui'
import {
  Crosshair,
  HandCoins,
  Plus,
  SquareFunction,
  UserRoundPlus,
} from 'lucide-react'
import { AccountBuilderCall, AccountType } from 'ser-kit'
import { LabeledAddress } from './AddressLabelContext'
import { FeedEntry, LabeledItem } from './FeedEntry'
import { parseRefillPeriod } from './getRefillPeriod'
import { LabeledRoleKey } from './RoleLabelContext'

type CallProps = { chainId: ChainId; callData: AccountBuilderCall }
type DetailCallProps<CallType extends AccountBuilderCall['call']> = {
  chainId: ChainId
  callData: Extract<AccountBuilderCall, { call: CallType }>
}

export const Call = ({ chainId, callData }: CallProps) => {
  switch (callData.call) {
    case 'createNode': {
      return <CreateNodeCall chainId={chainId} callData={callData} />
    }
    case 'assignRoles': {
      return <AssignRolesCall chainId={chainId} callData={callData} />
    }
    case 'setAllowance': {
      return <SetAllowanceCall chainId={chainId} callData={callData} />
    }
    case 'scopeTarget': {
      return <ScopeTargetCall chainId={chainId} callData={callData} />
    }
    case 'scopeFunction': {
      return <ScopeFunctionCall chainId={chainId} callData={callData} />
    }

    default: {
      return (
        <div className="text-xs">{`Missing node type for call "${callData.call}"`}</div>
      )
    }
  }
}

const ScopeFunctionCall = ({ callData }: DetailCallProps<'scopeFunction'>) => (
  <FeedEntry action="Scope function" icon={SquareFunction} raw={callData}>
    <LabeledItem label="Target">
      <LabeledAddress>{callData.targetAddress}</LabeledAddress>
    </LabeledItem>

    <LabeledItem label="Role">
      <LabeledRoleKey>{callData.roleKey}</LabeledRoleKey>
    </LabeledItem>
  </FeedEntry>
)

const ScopeTargetCall = ({ callData }: DetailCallProps<'scopeTarget'>) => (
  <FeedEntry icon={Crosshair} action="Scope target" raw={callData}>
    <LabeledItem label="Target">
      <LabeledAddress>{callData.targetAddress}</LabeledAddress>
    </LabeledItem>

    <LabeledItem label="Role">
      <LabeledRoleKey>{callData.roleKey}</LabeledRoleKey>
    </LabeledItem>
  </FeedEntry>
)

const SetAllowanceCall = ({ callData }: DetailCallProps<'setAllowance'>) => (
  <FeedEntry icon={HandCoins} action="Set allowance" raw={callData}>
    <LabeledItem label="Allowance">
      <NumberValue>{callData.refill}</NumberValue>
    </LabeledItem>

    <LabeledItem label="Period">
      {parseRefillPeriod(callData.period)}
    </LabeledItem>
  </FeedEntry>
)

const AssignRolesCall = ({ callData }: DetailCallProps<'assignRoles'>) => {
  return (
    <FeedEntry icon={UserRoundPlus} action="Add role member" raw={callData}>
      <LabeledItem label="Member">
        <LabeledAddress>{callData.member}</LabeledAddress>
      </LabeledItem>

      <LabeledItem label="Role">
        <LabeledRoleKey>{callData.roleKey}</LabeledRoleKey>
      </LabeledItem>
    </FeedEntry>
  )
}

const CreateNodeCall = ({
  callData,
  chainId,
}: DetailCallProps<'createNode'>) => {
  switch (callData.accountType) {
    case AccountType.SAFE: {
      return (
        <FeedEntry icon={Plus} action="Create Safe" raw={callData}>
          <LabeledItem label="Safe">
            <LabeledAddress>{callData.deploymentAddress}</LabeledAddress>
          </LabeledItem>

          <LabeledItem label="Owners">
            <ul>
              {callData.args.owners.map((owner) => (
                <li key={owner}>
                  <LabeledAddress>{owner}</LabeledAddress>
                </li>
              ))}
            </ul>
          </LabeledItem>
        </FeedEntry>
      )
    }
    case AccountType.ROLES: {
      return (
        <FeedEntry icon={Plus} action="Create role" raw={callData}>
          <LabeledItem label="Chain">
            <Chain chainId={chainId} />
          </LabeledItem>

          <LabeledItem label="Role">
            <LabeledAddress>{callData.deploymentAddress}</LabeledAddress>
          </LabeledItem>

          <LabeledItem label="Target Safe">
            <LabeledAddress>{callData.args.target}</LabeledAddress>
          </LabeledItem>
        </FeedEntry>
      )
    }
  }

  return null
}
