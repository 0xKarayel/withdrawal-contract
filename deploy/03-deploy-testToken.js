const { ethers, network } = require("hardhat")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deployer } = await getNamedAccounts()
    const { deploy, log } = deployments

    log("-----------------------------------------------")
    log("Deploying Test Token")

    

    const testToken = await deploy("TestToken", {
        from: deployer,
        args: [], 
        log: true,
        waitConfirmations: network.config.blockConfimations || 1,
    })

    console.log(` Test token deployed at ${testToken.address}`)
}
module.exports.tags  = ["all", "test"]