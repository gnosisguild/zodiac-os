import {
  createMockDelayWaypoint,
  createMockEndWaypoint,
  createMockEoaAccount,
  createMockExecutionRoute,
  createMockRoleWaypoint,
  createMockSafeAccount,
  createMockSafeExecutionAccount,
  createMockStartingWaypoint,
  createMockWaypoints,
} from '@/test-utils'
import { Chain, getChainId } from '@zodiac/chains'
import { randomAddress, randomEoaAddress } from '@zodiac/test-utils'
import { AccountType, prefixAddress, splitPrefixedAddress } from 'ser-kit'
import { describe, expect, it } from 'vitest'
import { getStartingWaypoint } from './getStartingWaypoint'
import { getWaypoints } from './getWaypoints'
import { updateChainId } from './updateChainId'

describe('updateChainId', () => {
  describe('Avatar', () => {
    it('Updates the chain of the avatar', () => {
      const address = randomAddress()

      const route = createMockExecutionRoute({
        avatar: prefixAddress(Chain.ETH, address),
      })

      const updatedRoute = updateChainId(route, Chain.GNO)

      expect(updatedRoute).toHaveProperty(
        'avatar',
        prefixAddress(Chain.GNO, address),
      )
    })
  })

  describe('Initiator', () => {
    it('updates the chain of the initiator', () => {
      const address = randomAddress()

      const route = createMockExecutionRoute({
        initiator: prefixAddress(Chain.ETH, address),
      })

      const updatedRoute = updateChainId(route, Chain.GNO)

      expect(updatedRoute).toHaveProperty(
        'initiator',
        prefixAddress(Chain.GNO, address),
      )
    })
  })

  describe('Waypoints', () => {
    describe('Starting point', () => {
      it('updates the chain property of SAFE starting points', () => {
        const route = createMockExecutionRoute({
          waypoints: createMockWaypoints({
            start: createMockStartingWaypoint(
              createMockSafeExecutionAccount({ chainId: Chain.ETH }),
            ),
          }),
        })

        const updatedRoute = updateChainId(route, Chain.GNO)

        const startingPoint = getStartingWaypoint(updatedRoute.waypoints)

        expect(startingPoint.account).toHaveProperty('chain', Chain.GNO)
      })
    })

    describe.each([
      [AccountType.ROLES, createMockRoleWaypoint({ chainId: Chain.ETH })],
      [
        AccountType.SAFE,
        createMockEndWaypoint({
          account: createMockSafeAccount({ chainId: Chain.ETH }),
        }),
      ],
      [AccountType.DELAY, createMockDelayWaypoint({ chainId: Chain.ETH })],
    ])('Waypoint with account type: "%s"', (_, waypoint) => {
      it('updates the prefixed address of roles modules', () => {
        const route = createMockExecutionRoute({
          waypoints: createMockWaypoints({
            waypoints: [waypoint],
          }),
        })

        const updatedRoute = updateChainId(route, Chain.GNO)

        const [updatedWaypoint] = getWaypoints(updatedRoute)

        expect(getChainId(updatedWaypoint.account.prefixedAddress)).toEqual(
          Chain.GNO,
        )
      })

      it('updates the chain property of roles modules', () => {
        const route = createMockExecutionRoute({
          waypoints: createMockWaypoints({
            waypoints: [waypoint],
          }),
        })

        const updatedRoute = updateChainId(route, Chain.GNO)

        const [updatedWaypoint] = getWaypoints(updatedRoute)

        expect(updatedWaypoint.account).toHaveProperty('chain', Chain.GNO)
      })

      it('updates the from address of the connection', () => {
        const route = createMockExecutionRoute({
          waypoints: createMockWaypoints({
            waypoints: [waypoint],
          }),
        })

        const updatedRoute = updateChainId(route, Chain.GNO)

        const [updatedWaypoint] = getWaypoints(updatedRoute)

        expect(getChainId(updatedWaypoint.connection.from)).toEqual(Chain.GNO)
      })
    })
  })

  describe('EOA Accounts', () => {
    it('does not update the starting waypoint of EOA accounts', () => {
      const route = createMockExecutionRoute({
        waypoints: createMockWaypoints({
          start: createMockStartingWaypoint(createMockEoaAccount()),
        }),
      })

      const updatedRoute = updateChainId(route, Chain.GNO)

      const startingPoint = getStartingWaypoint(updatedRoute.waypoints)

      const [chainId] = splitPrefixedAddress(
        startingPoint.account.prefixedAddress,
      )

      expect(chainId).not.toBeDefined()
    })

    it('does not update the initiator field when it is an EOA account', () => {
      const initiator = randomEoaAddress()

      const route = createMockExecutionRoute({
        initiator,
      })

      const updatedRoute = updateChainId(route, Chain.GNO)

      expect(updatedRoute).toHaveProperty('initiator', initiator)
    })

    it('does not update the from field of a roles waypoint when it is an EOA account', () => {
      const from = randomEoaAddress()

      const route = createMockExecutionRoute({
        waypoints: createMockWaypoints({
          waypoints: [createMockRoleWaypoint({ from })],
        }),
      })

      const updatedRoute = updateChainId(route, Chain.GNO)

      const [rolesWaypoint] = getWaypoints(updatedRoute)

      expect(rolesWaypoint.connection).toHaveProperty('from', from)
    })
  })
})
