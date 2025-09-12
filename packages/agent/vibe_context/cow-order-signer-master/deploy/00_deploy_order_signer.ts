import { defaultAbiCoder } from '@ethersproject/abi'
import { getSingletonFactory } from '@gnosis.pm/zodiac/dist/src/factory/singletonFactory'
import { BigNumber } from 'ethers'
import {
  formatEther,
  formatUnits,
  getCreate2Address,
  keccak256,
} from 'ethers/lib/utils'
import { DeployFunction } from 'hardhat-deploy/types'
import { EthereumProvider, HardhatRuntimeEnvironment } from 'hardhat/types'

const ethProvider = require('eth-provider')

function createEIP1193(
  chainId: number | undefined,
  provider: EthereumProvider,
) {
  return {
    request: async ({ method, params }) => {
      if (method == 'eth_sendTransaction') {
        return requestUsingFrame(chainId, method, params)
      }

      return provider.request({ method, params })
    },
  }
}

const requestUsingFrame = async (
  chainId: number | undefined,
  method: string,
  params: any,
) => {
  if (!chainId) throw new Error('Chain ID is required when using frame')
  const frame = ethProvider('frame')
  frame.setChain(chainId)
  // fix for "Transaction parameter 'gasLimit' is not a valid hex string" RPC error
  if (Array.isArray(params) && typeof params[0].gasLimit === 'number') {
    params[0].gasLimit = '0x' + params[0].gasLimit.toString(16)
    console.log('params[0].gasLimit', params[0].gasLimit)
  }
  return frame.request({ method, params })
}

const deployOrderSigner: DeployFunction = async ({
  ethers,
  getNamedAccounts,
  deployments,
  network,
}: HardhatRuntimeEnvironment) => {
  const { deploy, getNetworkName } = deployments

  const [signer] = await ethers.getSigners()
  // console.log("deploying using account", signer.address);

  // Get chain ID, with fallback for known networks
  const chainId =
    network.config.chainId || (network.name === 'base' ? 8453 : undefined)

  // const deployer = provider.getSigner(signer.address);
  let GPv2SigningAddress = '0x9008D19f58AAbD9eD0D60971565AA8510560ab41'

  const OrderSigner = await ethers.getContractFactory('CowswapOrderSigner')
  const initData = defaultAbiCoder.encode(['address'], [GPv2SigningAddress])
  const defaultSalt =
    '0x0000000000000000000000000000000000000000000000000000000000000000'
  const singletonFactoryAddress = '0xce0042b868300000d44a59004da54a005ffdcf9f'

  const orderSignerAddress = getCreate2Address(
    singletonFactoryAddress,
    defaultSalt,
    keccak256(OrderSigner.bytecode + initData.slice(2)),
  )

  console.log('expected address', orderSignerAddress)

  const singletonFactory = await getSingletonFactory(signer as any)

  const gasPrice = await signer.getGasPrice()
  console.log(
    'account needs ETH (not all will be spent)',
    formatEther(BigNumber.from('550000').mul(gasPrice)),
    'at gas price: ' + formatUnits(gasPrice, 'gwei') + ' gwei',
  )

  if ((await signer.provider.getCode(orderSignerAddress)).length > 2) {
    console.log(
      `  \x1B[32m✔ Already deployed at:        ${orderSignerAddress}\x1B[0m `,
    )
    return
  }

  // Use Frame directly for the deployment transaction
  const deployTx = await singletonFactory.populateTransaction.deploy(
    OrderSigner.bytecode + initData.slice(2),
    defaultSalt,
    { gasLimit: BigNumber.from('550000') },
  )

  // Send transaction via Frame
  const from = 'TODO'
  console.log('deploy from:', from)
  const txHash = await requestUsingFrame(chainId, 'eth_sendTransaction', [
    {
      ...deployTx,
      from,
    },
  ])

  console.log(
    `  \x1B[32m✔ Mastercopy deployed to:        ${orderSignerAddress} 🎉\x1B[0m `,
  )
  console.log(`Transaction hash: ${txHash}`)
}

export default deployOrderSigner
