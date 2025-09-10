import { ProvideAccount, toLocalAccount, type TaggedAccount } from '@/accounts'
import { toAccount } from '@/companion'
import {
  ProvideForkProvider,
  ProvideTransactions,
  type State,
} from '@/transactions'
import { invariant } from '@epic-web/invariant'
import { createMockExecutionRoute } from '@zodiac/modules/test-utils'
import {
  renderHook as renderHookBase,
  type RenderHookOptions,
} from '@zodiac/test-utils'
import { createRef, Fragment, RefObject, type PropsWithChildren } from 'react'
import { mockActiveTab, mockRuntimeConnect } from './chrome'
import { createTransactionState } from './creators'

type Fn<Result, Props> = (props: Props) => Result

type ExtendedOptions = {
  activeTab?: Partial<chrome.tabs.Tab>

  account?: TaggedAccount

  initialState?: Partial<State>
}

export const renderHook = async <Result, Props>(
  fn: Fn<Result, Props>,
  {
    activeTab,
    account = toLocalAccount(toAccount(createMockExecutionRoute())),
    wrapper: Wrapper = Fragment,
    initialState,

    ...options
  }: RenderHookOptions<Props> & ExtendedOptions = {},
) => {
  const mockedTab = mockActiveTab(activeTab)
  const mockedRuntimePort = mockRuntimeConnect()

  const state = createRef<State>()

  const FinalWrapper = ({ children }: PropsWithChildren) => (
    <RenderWrapper
      account={account}
      initialState={createTransactionState(initialState)}
      stateRef={state}
    >
      <Wrapper>{children}</Wrapper>
    </RenderWrapper>
  )

  const result = await renderHookBase<Result, Props>(fn, {
    ...options,
    wrapper: FinalWrapper,
  })

  return {
    ...result,
    mockedTab,
    mockedRuntimePort,
    getState() {
      invariant(state.current != null, 'State has not been initialized, yet')

      return state.current
    },
  }
}

type RenderWrapperProps = PropsWithChildren<{
  account: TaggedAccount
  initialState: State
  stateRef: RefObject<State | null>
}>

const RenderWrapper = ({
  account,
  initialState,
  children,
  stateRef,
}: RenderWrapperProps) => (
  <ProvideAccount account={account}>
    <ProvideTransactions initialState={initialState} stateRef={stateRef}>
      <ProvideForkProvider route={null}>{children}</ProvideForkProvider>
    </ProvideTransactions>
  </ProvideAccount>
)
