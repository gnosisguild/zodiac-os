# Cowswap Order Signer

In order to create [Roles Module](https://github.com/gnosis/zodiac-modifier-roles) permissions for Cowswap orders, we need a contract to pass in order data and sign the deterministic order id.

## Audits

- [Omniscia](https://omniscia.io/reports/gnosis-guild-cow-order-signer-654ca7b04ca7a30019c86b95/)
- [G0 Group](https://github.com/g0-group/Audits/blob/master/CowswapOrderSignerDec2023.pdf)

## Deployments

Address: `0x23dA9AdE38E4477b23770DeD512fD37b12381FAB`

- [Ethereum](https://etherscan.io/address/0x23dA9AdE38E4477b23770DeD512fD37b12381FAB)
- [Gnosis](https://gnosisscan.io/address/0x23dA9AdE38E4477b23770DeD512fD37b12381FAB)
- [Arbitrum](https://arbiscan.io/address/0x23dA9AdE38E4477b23770DeD512fD37b12381FAB)
- [Base](https://basescan.org/address/0x23dA9AdE38E4477b23770DeD512fD37b12381FAB)
- [Avalanche](https://snowtrace.io/address/0x23dA9AdE38E4477b23770DeD512fD37b12381FAB)
- [Polygon](https://polygonscan.com/address/0x23dA9AdE38E4477b23770DeD512fD37b12381FAB)
- [Sepolia](https://sepolia.etherscan.io/address/0x23dA9AdE38E4477b23770DeD512fD37b12381FAB)

## How to Deploy

Clone repo, run `yarn`, run `yarn deploy {network-name}` (networks defined in `./hardhat.config.ts`)

Rerun a second time to verify.

When using Frame, make sure you hardcode the `from` wallet address and adjust the gasLimit manually in Frame.

## How to Test

In the repo, run `npx hardhat node` to fork mainnet, then in another tab run `yarn test --network localhost`
