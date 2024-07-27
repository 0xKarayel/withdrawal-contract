const { ethers, network, deployments, getNamedAccounts } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const chainId = network.config.chainId

async function setUpContract() {
   
    const deployer = (await getNamedAccounts()).deployer

 const  {
    WethAddress, usdcAddress, daiAddress
  } = networkConfig[network.config.chainId];

  

    const withdrawalContract = await ethers.getContract(
        "WithdrawalContract",
        deployer,
    )
    const weth = await ethers.getContractAt("IWETH", WethAddress);
      const usdc= await ethers.getContractAt("IERC20", usdcAddress);
      const dai = await ethers.getContractAt("IERC20", daiAddress);

  

    const supportedTokenAddress = [weth.address, usdc.address, dai.address]
    console.log("Setting Up the Tokens Address")

    const transactionResponse =
        await withdrawalContract.setSupportedTokenAddress(supportedTokenAddress)
    await transactionResponse.wait(1)

    console.log("Set Up Completed")
}

setUpContract()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
