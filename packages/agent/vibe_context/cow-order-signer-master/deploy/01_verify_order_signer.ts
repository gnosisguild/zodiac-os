import { defaultAbiCoder } from '@ethersproject/abi'
import { getCreate2Address, keccak256 } from 'ethers/lib/utils'
import { DeployFunction } from 'hardhat-deploy/types'

const deployOrderSigner: DeployFunction = async (hre) => {
  const [signer] = await hre.ethers.getSigners()

  let GPv2SigningAddress = '0x9008D19f58AAbD9eD0D60971565AA8510560ab41'

  const OrderSigner = await hre.ethers.getContractFactory('CowswapOrderSigner')
  const initData = defaultAbiCoder.encode(['address'], [GPv2SigningAddress])
  const defaultSalt =
    '0x0000000000000000000000000000000000000000000000000000000000000000'
  const singletonFactoryAddress = '0xce0042b868300000d44a59004da54a005ffdcf9f'

  const orderSignerAddress = getCreate2Address(
    singletonFactoryAddress,
    defaultSalt,
    keccak256(OrderSigner.bytecode + initData.slice(2)),
  )

  console.log('verifying contract deployed at', orderSignerAddress)

  try {
    await hre.run('verify:verify', {
      address: orderSignerAddress,
      constructorArguments: [GPv2SigningAddress],
    })
  } catch (e) {
    if (
      e instanceof Error &&
      e.stack &&
      (e.stack.indexOf('Reason: Already Verified') > -1 ||
        e.stack.indexOf('Contract source code already verified') > -1)
    ) {
      console.log('  ✔ Contract is already verified')
    } else {
      console.log(
        '  ✘ Verifying the contract failed. This is probably because Etherscan is still indexing the contract. Try running this same command again in a few seconds.',
      )
      throw e
    }
  }
}

export default deployOrderSigner
