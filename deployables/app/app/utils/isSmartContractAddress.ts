import type { HexAddress, PrefixedAddress } from '@zodiac/schema'
import type { JsonRpcProvider } from 'ethers'
import { unprefixAddress } from 'ser-kit'

export async function isSmartContractAddress(
  provider: JsonRpcProvider,
  address: HexAddress | PrefixedAddress,
): Promise<boolean> {
  const code = await provider.getCode(unprefixAddress(address))
  return code !== '0x'
}
