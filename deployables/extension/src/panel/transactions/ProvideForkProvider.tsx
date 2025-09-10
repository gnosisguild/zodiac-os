import { useAccount } from '@/accounts'
import { AD_HOC_ROUTE_ID } from '@/execution-routes'
import { ForkProvider } from '@/providers'
import type { HexAddress } from '@/types'
import { invariant } from '@epic-web/invariant'
import { ZERO_ADDRESS } from '@zodiac/chains'
import { ExecutionRoute, jsonParse } from '@zodiac/schema'
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react'
import { ConnectionType, unprefixAddress } from 'ser-kit'
import { z } from 'zod'

const ProviderContext = createContext<ForkProvider | null>(null)

export const ProvideForkProvider = ({
  children,
  route,
}: PropsWithChildren<{ route: ExecutionRoute | null }>) => {
  const { chainId, address, id } = useAccount()
  const isUsingAdHocRoute = id === AD_HOC_ROUTE_ID

  const simulationModuleAddress = getSimulationModuleAddress(route)

  const [provider, setProvider] = useState<ForkProvider | null>(null)

  // whenever anything changes in the connection settings, we delete the current fork and start afresh
  useEffect(() => {
    const provider = new ForkProvider({
      chainId,
      avatarAddress: address,
      simulationModuleAddress,
      // For now we only support setup requests for ad-hoc routes.
      // If we ever want to support this more generally, we need to let users configure the setup requests so they don't stay silently active via the search param state even when switching accounts.
      setupRequests: isUsingAdHocRoute ? getSetupRequests() : [],
    })

    setProvider(provider)

    return () => {
      provider.destroy()
    }
  }, [chainId, address, simulationModuleAddress, isUsingAdHocRoute])

  if (provider == null) {
    return null
  }

  return <ProviderContext value={provider}>{children}</ProviderContext>
}

export const useForkProvider = () => {
  const provider = useContext(ProviderContext)

  invariant(
    provider != null,
    'useForkProvider() must be used within a <ProvideProvider/>',
  )

  return provider
}

const DUMMY_MODULE_ADDRESS = '0xfacade0000000000000000000000000000000000'

/**
 * Returns the module address used for simulation.
 * We generally simulate transactions using a Safe module as the entrypoint.
 * As part of the fork initialization, we ensure that the owner, the modules, or a dummy module is enabled.
 * Then we will route all transactions through this module.
 */
export const getSimulationModuleAddress = (route: ExecutionRoute | null) => {
  const moduleAddress = findModuleOnAvatarAddress(route)
  const ownerAddress = findOwnerOfAvatarAddress(route)
  return moduleAddress ?? ownerAddress ?? DUMMY_MODULE_ADDRESS
}

const findModuleOnAvatarAddress = (route: ExecutionRoute | null) => {
  if (route == null) {
    return null
  }

  const { waypoints } = route

  if (waypoints == null) {
    return null
  }

  const avatarWaypoint = waypoints[waypoints.length - 1]

  if (!('connection' in avatarWaypoint)) {
    return null
  }

  if (avatarWaypoint.connection.type !== ConnectionType.IS_ENABLED) {
    return null
  }

  return nullifyZeroAddress(unprefixAddress(avatarWaypoint.connection.from))
}

const findOwnerOfAvatarAddress = (route: ExecutionRoute | null) => {
  if (route == null) {
    return null
  }

  const { waypoints } = route

  if (waypoints == null) {
    return null
  }

  const avatarWaypoint = waypoints[waypoints.length - 1]

  if (!('connection' in avatarWaypoint)) {
    return null
  }

  if (avatarWaypoint.connection.type !== ConnectionType.OWNS) {
    return null
  }

  return nullifyZeroAddress(unprefixAddress(avatarWaypoint.connection.from))
}

const nullifyZeroAddress = (address: HexAddress) => {
  return address === ZERO_ADDRESS ? null : address
}

const jsonRpcRequestSchema = z.object({
  method: z.string(),
  params: z.array(z.any()).default([]),
})

const getSetupRequests = () => {
  const url = new URL(window.location.href)
  const setup = url.searchParams.get('setup')
  if (!setup) return []
  try {
    return jsonRpcRequestSchema.array().parse(jsonParse(setup))
  } catch (error) {
    console.error('Failed to parse setup requests', error)
    return []
  }
}
