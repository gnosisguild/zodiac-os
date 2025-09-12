import {
  BuyTokenDestination,
  OrderBookApi,
  OrderKind,
  SellTokenSource,
  SigningScheme,
} from '@cowprotocol/cow-sdk'
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'

import { JsonRpcProvider } from '@ethersproject/providers'
import { BigNumber, Contract } from 'ethers'
import { solidityKeccak256 } from 'ethers/lib/utils'
import {
  CowswapOrderSigner,
  GPv2Signing,
  GPv2Signing__factory,
  TestAvatar,
} from '../typechain-types'

const PRESIGNED_MAGIC_VALUE = BigNumber.from(
  solidityKeccak256(['string'], ['GPv2Signing.Scheme.PreSign']),
)

// We use `loadFixture` to share common setups (or fixtures) between tests.
// Using this simplifies your tests and makes them run faster, by taking
// advantage or Hardhat Network's snapshot functionality.

describe('CowswapOrderSigner contract', () => {
  // We define a fixture to reuse the same setup in every test. We use
  // loadFixture to run this setup once, snapshot that state, and reset Hardhat
  // Network to that snapshot in every test.
  async function deployOrderSigner() {
    const [deployer, alice] = await ethers.getSigners()
    const GPv2SigningAddress = '0x9008D19f58AAbD9eD0D60971565AA8510560ab41'

    const now = Math.floor(Date.now() / 1000)
    // set time of forked chain to now, so we can sign orders with a validTo in the future
    await time.setNextBlockTimestamp(now)

    const OrderSigner = await ethers.getContractFactory('CowswapOrderSigner')
    const orderSigner = (await OrderSigner.deploy(
      GPv2SigningAddress,
    )) as CowswapOrderSigner

    const Avatar = await ethers.getContractFactory('TestAvatar')
    const avatar = (await Avatar.deploy()) as TestAvatar

    const cowswap = new Contract(
      GPv2SigningAddress,
      GPv2Signing__factory.abi,
      alice,
    ) as GPv2Signing

    const appData = '{"version":"0.9.0","metadata":{}}'
    const demoOrder = {
      sellToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      buyToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      receiver: avatar.address,
      sellAmount: '96825924243465932',
      buyAmount: '474505929366652675891',
      validTo: now + 60 * 30,
      appData: solidityKeccak256(['string'], [appData]),
      feeAmount: '19174075756534068',
      kind: ethers.utils.id('sell'),
      partiallyFillable: false,
      sellTokenBalance: ethers.utils.id('erc20'),
      buyTokenBalance: ethers.utils.id('erc20'),
    }

    const demoOrderValidDuration = 60 * 30 // 30 minutes
    const demoOrderFeeAmountBP = Math.ceil(
      (parseInt(demoOrder.feeAmount) / parseInt(demoOrder.sellAmount)) * 10000,
    ) // = 535 bps

    // Fixtures can return anything you consider useful for your tests
    return {
      orderSigner,
      avatar,
      appData,
      demoOrder,
      demoOrderValidDuration,
      demoOrderFeeAmountBP,
      cowswap,
      provider: alice.provider as JsonRpcProvider,
    }
  }

  it('should be deployed', async () => {
    const { orderSigner, provider } = await loadFixture(deployOrderSigner)

    const bytecode = await provider.getCode(orderSigner.address)

    expect(bytecode).to.not.equal('0x')
  })

  describe('signOrder', () => {
    it('should compute the correct order UID and pre-sign it', async () => {
      const {
        orderSigner,
        demoOrder,
        demoOrderFeeAmountBP,
        demoOrderValidDuration,
        appData,
        cowswap,
        avatar,
      } = await loadFixture(deployOrderSigner)

      const cowApi = new OrderBookApi({ chainId: 1 })

      const expectedUid = await cowApi
        .sendOrder({
          ...demoOrder,
          kind: OrderKind.SELL,
          sellTokenBalance: SellTokenSource.ERC20,
          buyTokenBalance: BuyTokenDestination.ERC20,
          from: avatar.address,
          appData: appData,
          appDataHash: demoOrder.appData,
          signingScheme: SigningScheme.PRESIGN,
          signature: '0x', // must be empty for presign
        })
        .catch((e) => {
          console.error(e)
          throw e
        })

      // order UID is not yet signed
      expect(await cowswap.preSignature(expectedUid)).to.equal(0)

      const { data } = await orderSigner.populateTransaction.signOrder(
        demoOrder,
        demoOrderValidDuration,
        demoOrderFeeAmountBP,
      )

      await expect(avatar.exec(orderSigner.address, 0, data || '', 1)).to.not.be
        .reverted

      // now it is
      expect(await cowswap.preSignature(expectedUid)).to.equal(
        PRESIGNED_MAGIC_VALUE,
      )
    })

    it('should revert if not delegate called', async () => {
      const {
        orderSigner,
        demoOrderFeeAmountBP,
        demoOrderValidDuration,
        avatar,
        demoOrder,
      } = await loadFixture(deployOrderSigner)

      const { data } = await orderSigner.populateTransaction.signOrder(
        demoOrder,
        demoOrderValidDuration,
        demoOrderFeeAmountBP,
      )

      await expect(avatar.exec(orderSigner.address, 0, data || '', 0)).to.be
        .reverted
    })

    describe('bad orders', () => {
      it('should revert if the order fee exceeds the declared fee basis points', async () => {
        const { orderSigner, avatar, demoOrder, demoOrderValidDuration } =
          await loadFixture(deployOrderSigner)

        const feeAmountBP = 100 // was 535

        const { data } = await orderSigner.populateTransaction.signOrder(
          demoOrder,
          demoOrderValidDuration,
          feeAmountBP,
        )

        await expect(avatar.exec(orderSigner.address, 0, data || '', 1)).to.be
          .reverted
      })

      it('should revert if the validTo timestamp lies outside the declared valid duration from now', async () => {
        const { orderSigner, avatar, demoOrder, demoOrderFeeAmountBP } =
          await loadFixture(deployOrderSigner)

        const { data } = await orderSigner.populateTransaction.signOrder(
          demoOrder,
          60, // set max allowed valid duration to 1 minute (the order exceeds this)
          demoOrderFeeAmountBP,
        )

        await expect(avatar.exec(orderSigner.address, 0, data || '', 1)).to.be
          .reverted
      })
    })
  })

  describe('unsignOrder', () => {
    it('should compute the correct order UID and revoke the pre-signature', async () => {
      const {
        orderSigner,
        demoOrder,
        demoOrderFeeAmountBP,
        demoOrderValidDuration,
        appData,
        cowswap,
        avatar,
      } = await loadFixture(deployOrderSigner)

      const cowApi = new OrderBookApi({ chainId: 1 })

      // It's not possible to send multiple orders with the same UID, so we need to modify the order
      const demoOrder2 = { ...demoOrder, validTo: demoOrder.validTo + 1 }

      const expectedUid = await cowApi
        .sendOrder({
          ...demoOrder2,
          kind: OrderKind.SELL,
          sellTokenBalance: SellTokenSource.ERC20,
          buyTokenBalance: BuyTokenDestination.ERC20,
          from: avatar.address,
          appData: appData,
          appDataHash: demoOrder2.appData,
          signingScheme: SigningScheme.PRESIGN,
          signature: '0x', // must be empty for presign
        })
        .catch((e) => {
          console.error(e)
          throw e
        })

      // sign the order
      const { data: signData } =
        await orderSigner.populateTransaction.signOrder(
          demoOrder2,
          demoOrderValidDuration,
          demoOrderFeeAmountBP,
        )
      await avatar.exec(orderSigner.address, 0, signData || '', 1)
      expect(await cowswap.preSignature(expectedUid)).to.equal(
        PRESIGNED_MAGIC_VALUE,
      )

      // unsign the order
      const { data: unsignData } =
        await orderSigner.populateTransaction.unsignOrder(demoOrder2)
      await expect(avatar.exec(orderSigner.address, 0, unsignData || '', 1)).to
        .not.be.reverted

      // pre-signature has been cleared
      expect(await cowswap.preSignature(expectedUid)).to.equal(0)
    })

    it('should revert if not delegate called', async () => {
      const { orderSigner, avatar, demoOrder } =
        await loadFixture(deployOrderSigner)

      const { data } =
        await orderSigner.populateTransaction.unsignOrder(demoOrder)

      await expect(avatar.exec(orderSigner.address, 0, data || '', 0)).to.be
        .reverted
    })
  })
})
