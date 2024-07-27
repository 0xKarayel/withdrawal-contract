const { ethers } = require("hardhat");

const networkConfig = {
    31337: {
        name: "localhost",
        ethAddress: "0x8267cF9254734C6Eb452a7bb9AAF97B392258b21", 
        
        
      },
      11155111: {
        name: "sepolia",
        WethAddress: "0x5f207d42F869fd1c71d7f0f81a2A67Fc20FF7323", 
        usdcAddress: "0x8267cF9254734C6Eb452a7bb9AAF97B392258b21",
        daiAddress: "0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6",
        usdcPriceFeedAddress: "0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E",
        daiUsdPriceFeedAddress: "0x14866185B1962B63C3Ea9E03Bc1da838bab34C19",
        ethUsdPriceFeedAddress: "0x694AA1769357215DE4FAC081bf1f309aDC325306",






    },

   
}

const developmentChains = ["hardhat", "localhost"]
const VERIFICATION_BLOCK_CONFIRMATIONS = 6

const sDuration = {
    seconds: function (val) {
      return val;
    },
    minutes: function (val) {
      return val * this.seconds(60);
    },
    hours: function (val) {
      return val * this.minutes(60);
    },
    days: function (val) {
      return val * this.hours(24);
    },
    weeks: function (val) {
      return val * this.days(7);
    },
    years: function (val) {
      return val * this.days(365);
    },
  };

module.exports = {
    networkConfig,
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
    sDuration
}
