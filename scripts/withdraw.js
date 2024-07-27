const { ethers, network, deployments, getNamedAccounts } = require("hardhat")
const {
    developmentChains,
    networkConfig,
    sDuration,
} = require("../helper-hardhat-config")
const chainId = network.config.chainId
const amount = ethers.utils.parseEther("0.04")
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

async function withdraw() {
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


    const depositId= await withdrawalContract.getDepositId(deployer.address)
    console.log(`The depositId is ${depositId}` )
     
    



    const withdrawTx = await withdrawalContract.withdraw(weth.address, depositId.toString())
    const withdrawReceipts = await withdrawTx.wait()
    

    console.log(`withdrawal is successful`)
}

withdraw()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
