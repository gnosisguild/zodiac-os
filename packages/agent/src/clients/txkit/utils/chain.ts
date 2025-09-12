import { Chain } from '../types'

export const CHAIN_ID_MAP: Record<Chain, number> = {
  eth: 1,
  arb: 42161,
  opt: 10,
  base: 8453,
  gno: 100,
}

export const COW_ADDRESSES = {
  OrderSigner: {
    eth: '0x23dA9AdE38E4477b23770DeD512fD37b12381FAB',
    arb: '0x23dA9AdE38E4477b23770DeD512fD37b12381FAB',
    opt: '0x23dA9AdE38E4477b23770DeD512fD37b12381FAB',
    base: '0x23dA9AdE38E4477b23770DeD512fD37b12381FAB',
    gno: '0x23dA9AdE38E4477b23770DeD512fD37b12381FAB',
  } as Record<Chain, string>,
  GPv2VaultRelayer: {
    eth: '0xC92E8bdf79f0507f65a392b0ab4667716BFE0110',
    arb: '0xC92E8bdf79f0507f65a392b0ab4667716BFE0110',
    opt: '0xC92E8bdf79f0507f65a392b0ab4667716BFE0110',
    base: '0xC92E8bdf79f0507f65a392b0ab4667716BFE0110',
    gno: '0xC92E8bdf79f0507f65a392b0ab4667716BFE0110',
  } as Record<Chain, string>,
  ComposableCow: {
    eth: '0xfdaFc9d1902f4e0b84f65F49f244b32b31013b74',
    arb: '0xfdaFc9d1902f4e0b84f65F49f244b32b31013b74',
    opt: '0xfdaFc9d1902f4e0b84f65F49f244b32b31013b74',
    base: '0xfdaFc9d1902f4e0b84f65F49f244b32b31013b74',
    gno: '0xfdaFc9d1902f4e0b84f65F49f244b32b31013b74',
  } as Record<Chain, string>,
}

// Common settlement address for CoW Protocol (GPv2)
export const GPV2_SETTLEMENT: Record<Chain, string> = {
  eth: '0x9008D19f58AAbD9eD0D60971565AA8510560ab41',
  arb: '0x9008D19f58AAbD9eD0D60971565AA8510560ab41',
  opt: '0x9008D19f58AAbD9eD0D60971565AA8510560ab41',
  base: '0x9008D19f58AAbD9eD0D60971565AA8510560ab41',
  gno: '0x9008D19f58AAbD9eD0D60971565AA8510560ab41',
}
