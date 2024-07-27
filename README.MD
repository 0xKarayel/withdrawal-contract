WITHDRAWAL CONTRACT 

PRE-REQUISITE

The Framework Used for the project is Hardhat 
After cloning or pulling from this repo, enter the command yarn install in the terminal to install all the dependencies for this project
Make sure your .env is set up with all the necessary keys and endpoints needed. The template is shown below: 

PRIVATE_KEY=48349IBIERHUIDFCBEIVKEOBNCIVH
SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/<API_KEY>
SEPOLIA_API_KEY=<API_KEY>

Note that the mnemonic provided above is just a sample as it does not subject the project to any form of exploitation. The tester should provide their own mnemonic.

Note that the smart contract is deployed in SEPOLIA TESTNET. Hence, sepolia faucet will be needed in testing the smart contract. Faucet can be gotten in the following links below;

https://www.alchemy.com/faucets/ethereum-sepolia
https://chainstack.com/sepolia-faucet/
https://www.sepoliafaucet.io/


CONTRACT DETAILS

Contract Address: 0xaaab7626283eCec34968C58cf8D87600e573dafd
Link: https://sepolia.etherscan.io/address/0xaaab7626283eCec34968C58cf8D87600e573dafd

COMPILATION

Enter the command shown below to compile your solidity code:

yarn hardhat compile

DEPLOYMENT

The script 01-deploy-withdrawalcontract.js under the deploy directory is the one deploying the smart contract

Enter the command shown below to deploy the smart contract to sepolia test network:

yarn hardhat deploy --tags "withdrawal" --network sepolia

OR

If any issue is encountered while trying to deploy with hardhat, REMIX is an alternative. It can be deployed with REMIX 👉👉 https://remix.ethereum.org/

RUNNING TESTS 
The test file can be test\unit\FundsLock.test.js can be found. The test has two categories of tests

Test for the deposit() function in the smart contract. The deposit function allows users to deposit some amounts into the contract. To run this particular test, Type the below command in the terminal

yarn hardhat test --grep "It emits an event after a user Deposited"

Test for the withdraw() function in the smart contract. The withdraw function allows users to withdraw their deposited amounts from the contract based on the amounts they deposited. The higher the amounts deposited, the greater the interest yields on the investment. To test for the function in the contract, Type the below command in the terminal.

yarn hardhat test  --grep "it successfully withdraws the depositor amount with interest after time has passed"


RUNNING SCRIPTS 

1. setUpContract.js 
  This script is used to for setting up the contract, and also set the supported the tokens.

  yarn hardhat run scripts/setUpContract.js --network sepolia

2. deposit.js 

This scripts is used for depositing the tokens into the smart contract and also set the interval 

yarn hardhat run scripts/deposit.js --network sepolia

3 withdraw.js 

This scripts is used for withdrawing the amount deposited into the contract and the interval has elapsed

yarn hardhat run scripts/withdraw.js --network sepolia











