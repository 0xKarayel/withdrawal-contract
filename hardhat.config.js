require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();
require("solidity-coverage");
require("hardhat-deploy");

const SEPOLIA_RPC_URL =
    process.env.SEPOLIA_RPC_URL || ""
    const PRIVATE_KEY = process.env.PRIVATE_KEY || ""
    const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ""

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
      gasPrice: 130000000000,
    },
    localhost: {
      chainId: 31337,
      // gasPrice: 130000000000,  
      // gasPrice: 8000000000,
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      //   accounts: {
      //     mnemonic: MNEMONIC,
      //   },
      saveDeployments: true,
      chainId: 11155111,
      gas: 2100000,
      gasPrice: 8000000000,
  },
    // mainnet: {
    //     url: process.env.MAINNET_RPC_URL,
    //     accounts: [PRIVATE_KEY],
    //     chainId: 1,
    //     blockConfirmations: 6,
    // },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.8",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000, // Number of runs optimized for
          },
          // Additional settings can go here
        },
      },
      {
        version: "0.6.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
          // Additional settings can go here
        },
      },
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
          // Additional settings can go here
        },
      },
    ],
    settings: {
      allowUnlimitedContractSize: true,
    },
  },
  etherscan: {
      apiKey: ETHERSCAN_API_KEY,
              customChains: [], // uncomment this line if you are getting a TypeError: customChains is not iterable

  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
    // coinmarketcap: COINMARKETCAP_API_KEY,
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
      1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
    },
  },
  mocha: {
    timeout: 200000, // 200 seconds max for running tests
  },
};
