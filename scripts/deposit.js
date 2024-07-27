const { ethers, network, deployments, getNamedAccounts } = require("hardhat")
const {
    developmentChains,
    networkConfig,
    sDuration,
} = require("../helper-hardhat-config")
const chainId = network.config.chainId
const amount = ethers.utils.parseEther("0.02")
const interval = sDuration.days(10) // 10 days

const forkSepoliaChain = async () => {
    console.log("forking Sepolia testnet Chain")

    const sepoliaProvider = new ethers.providers.JsonRpcProvider(
        process.env.SEPOLIA_RPC_URL,
    )
    const latestBlockNumber = await sepoliaProvider.getBlockNumber()

    await network.provider.send("hardhat_reset", [
        {
            forking: {
                jsonRpcUrl: process.env.SEPOLIA_RPC_URL,
                blockNumber: latestBlockNumber,
            },
        },
    ])

    console.log("Sepolia Testnet is forked------------------------")
}

async function deposit() {
    const accounts = await ethers.getSigners()
    deployer = accounts[0]
    user1 = accounts[1]

    const { WethAddress, usdcAddress, daiAddress } =
        networkConfig[network.config.chainId]

    const withdrawalContract = await ethers.getContract(
        "WithdrawalContract",
        deployer,
    )

    const weth = await ethers.getContractAt("IWETH", WethAddress, deployer)
    const usdc = await ethers.getContractAt("IERC20", usdcAddress, deployer)

    const supportedTokenAddresses = [weth.address, usdc.address]

    console.log("Setting Supported Tokens")

    const setTokenAddress = await withdrawalContract.setSupportedTokenAddress(
        supportedTokenAddresses,
    )
    await setTokenAddress.wait(1)

    // const tx  = await weth.deposit({value: amount})
    // await tx.wait(1)

    const balance = await weth.balanceOf(deployer.address)

    console.log(`balance of the deployer is ${balance.toString()}`)
    

    await weth.approve(withdrawalContract.address, amount)
    const transactionResponse = await withdrawalContract.deposit(
        weth.address,
        amount,
        interval,
    )
    const transactionReceipt = await transactionResponse.wait(1)
    console.log(`Amount has been deposited`)
    const userDepositId = transactionReceipt.events[1].args.depositId

    console.log(` The Deposit Id is ${userDepositId}`)

   
}

deposit()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
