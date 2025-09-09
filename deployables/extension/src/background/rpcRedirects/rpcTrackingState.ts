import { Chain } from '@zodiac/chains'

export type TrackedRpcEndpoints = Map<string, Chain>

export type TrackingState = {
  trackedTabs: Set<number>
  chainIdByRpcUrl: TrackedRpcEndpoints

  rpcUrlsByTabId: Map<number, Set<string>>
}

export const createRpcTrackingState = (): TrackingState => ({
  trackedTabs: new Set(),
  chainIdByRpcUrl: new Map(),
  rpcUrlsByTabId: new Map(),
})
