
const {network, ethers} = require("hardhat")
const {networkConfig, developmentChains} = require("../helper-hardhat-config")
const {verify} = require("../utils/verify")
const DECIMALS = "8"
const INITIAL_PRICE = "200000000000" // 2000

module.exports = async function({getNamedAccounts, deployments}) {

    const {deploy, log} = deployments
    const {deployer} = await getNamedAccounts()
    const chainId = network.config.chainId
    const deployerSigner = await ethers.getSigner(deployer)

let ethUsdAggregatorAddress
    if (chainId == 31337) {

        const ethUsdAggregator = await deploy("MockV3Aggregator",{
                from: deployer,
                log: true,
                args: [DECIMALS, INITIAL_PRICE],
            
        })
        ethUsdAggregatorAddress = await ethUsdAggregator.address
    } else 
    {
        ethUsdAggregatorAddress = networkConfig[chainId]["ethUsdPriceFeedAddress"]
        }
        
        log("--------------------------------------")
        log("Deploying Withdrawal Contract------------------------------------------")
        console.log(`ethUsdAggregatorAddress is ${ethUsdAggregatorAddress}`)


    const args = [
        ethUsdAggregatorAddress
        

    ]

    const withdrawalContract = await deploy("WithdrawalContract", {
        from: deployer,
        args: args,
        log: true, 
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    
    let fundAmount
    if(chainId == 31337 ){
        fundAmount = ethers.utils.parseEther("1");
    } else {
        fundAmount = ethers.utils.parseEther("0.001")

    }
   const fundingContract =  await deployerSigner.sendTransaction({
        to: withdrawalContract.address,
        value: fundAmount

    })

    console.log(`Funded the address ${withdrawalContract.address} with some amount of ETH`)
     await fundingContract.wait(1)
     if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(withdrawalContract.address, args)
     }

   

}
module.exports.tags = ["all", "withdrawal"]