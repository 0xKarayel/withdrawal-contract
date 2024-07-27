// import { expect, assert } from 'chai'
const { assert, expect } = require("chai")
const {
    network,
    deployments,
    ethers,
    getNamedAccounts,
    userConfig,
} = require("hardhat")
const {
    developmentChains,
    sDuration,
    networkConfig,
} = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("withdrawalContract", function () {
          let withdrawalContract,
              deployer,
              mockV3Aggregator,
              user1,
              user2,
              testToken, 
              testToken2
          const MaxAmount = ethers.utils.parseEther("10")
          const Minamount = ethers.utils.parseEther("2")
          const secondsInADay = 24 * 60 * 60
          const interval = sDuration.days(10) // 10 days
          beforeEach(async function () {
              const accounts = await ethers.getSigners()
              deployer = accounts[0]
              user1 = accounts[1]
              user2 = accounts[2]
              await deployments.fixture(["all"])
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer,
              )
              withdrawalContract =
                  await ethers.getContract("WithdrawalContract")
              testToken = await ethers.getContract("TestToken", deployer)
              testToken2 = await ethers.getContract("TestToken2", deployer)
              
              const supportedTokenAddress = [testToken.address, testToken2.address]

              const setTokenAddress = await withdrawalContract.setSupportedTokenAddress(supportedTokenAddress)
              await setTokenAddress.wait(1)
              
          })
          
          describe("constructor", function () {
              it("It sets the Price feed correctly", async function () {
                  const priceFeedAddress =
                      await withdrawalContract.getPriceFeed()
                  assert.equal(mockV3Aggregator.address, priceFeedAddress)
              })
          })
          describe("deposit", function () {
              it("it reverts if the minimum amount is not met and fails if it exceeds the Maximum Amount", async function () {
                  await testToken.transfer(
                      user1.address,
                      "100000000000000000000",
                  ) //tranfer 10 token to user1
                  await testToken.transfer(
                      withdrawalContract.address,
                      "100000000000000000000",
                  ) // transfer  100 token to the contract Address

                  await testToken
                      .connect(user1)
                      .approve(withdrawalContract.address, MaxAmount)
                  const user1Connected = await withdrawalContract.connect(user1)

                  await expect(
                      user1Connected.deposit(testToken.address, 0, interval),
                  ).to.be.revertedWith("NotEnoughAmount") // We expected it to revert by transfering an amount less than the minimum Amount
                  await expect(
                      user1Connected.deposit(
                          testToken.address,
                          MaxAmount.add(Minamount),
                          interval,
                      ),
                  ).to.be.revertedWith("AmountIsTooMuch") // We expected it to revert by transfering an amount greater than the Maximum Amount
              })
              it("it properly assigned userParameters to the Deposit id", async function () {
                const supportedTokenAddress = [testToken.address, testToken2.address]

                const setTokenAddress = await withdrawalContract.setSupportedTokenAddress(supportedTokenAddress)
                await setTokenAddress.wait(1)


                
                  await testToken.transfer(
                      user1.address,
                      "100000000000000000000",
                  ) //tranfer 10 token to user1
                  const user1Connected = await withdrawalContract.connect(user1)
                  await testToken
                      .connect(user1)
                      .approve(withdrawalContract.address, MaxAmount)

                  const transactionResponse = await user1Connected.deposit(
                      testToken.address,
                      Minamount,
                      interval,
                  )
                  const transactionReceipt = await transactionResponse.wait(1)
                  const userDepositId =
                      transactionReceipt.events[1].args.depositId
                  const withdrawalState =
                      await user1Connected.getWithdrawalState()

                  const userParameters =
                      await user1Connected.getParameters(userDepositId)
                  const {
                      depositor,
                      amountDeposited,
                      depositTime,
                      duration,
                      depositId,
                      state,
                  } = userParameters

                  assert.equal(depositor, user1.address)
                  assert.equal(amountDeposited.toString(), Minamount.toString())
                  assert.equal(duration, interval)
                  assert.equal(depositId, userDepositId)
                  assert.equal(state, withdrawalState)
              })
              it("it properly assigned unique Ids to each deposits", async function () {

                const supportedTokenAddress = [testToken.address, testToken2.address]

                const setTokenAddress = await withdrawalContract.setSupportedTokenAddress(supportedTokenAddress)
                await setTokenAddress.wait(1)

                  await testToken.transfer(
                      user1.address,
                      "100000000000000000000",
                  ) //tranfer 10 token to user1
                  const user1Connected = await withdrawalContract.connect(user1)
                  await testToken
                      .connect(user1)
                      .approve(withdrawalContract.address, MaxAmount)

                  const transactionResponse1 = await user1Connected.deposit(
                      testToken.address,
                      Minamount,
                      interval,
                  )
                  const transactionReceipt1 = await transactionResponse1.wait(1)
                  const DepositId1 =
                      transactionReceipt1.events[1].args.depositId

                  const transactionResponse2 = await user1Connected.deposit(
                      testToken.address,
                      Minamount.add(Minamount),
                      interval,
                  )
                  const transactionReceipt2 = await transactionResponse2.wait(1)
                  const DepositId2 =
                      transactionReceipt2.events[1].args.depositId

                  const getId = await withdrawalContract.getDepositId(
                      user1.address,
                  )

                  assert.equal(getId.toString(), [DepositId1, DepositId2])
              })
              it("it stores the addresses of all Depositors", async function () {
                const supportedTokenAddress = [testToken.address, testToken2.address]

                const setTokenAddress = await withdrawalContract.setSupportedTokenAddress(supportedTokenAddress)
                await setTokenAddress.wait(1)

                  await testToken.transfer(
                      user1.address,
                      "100000000000000000000",
                  ) //tranfer 10 token to user1
                  await testToken.transfer(
                      user2.address,
                      "100000000000000000000",
                  ) //tranfer 10 token to user1
                  const user1Connected = await withdrawalContract.connect(user1)
                  await testToken
                      .connect(user1)
                      .approve(withdrawalContract.address, MaxAmount)
                  const transactionResponse1 = await user1Connected.deposit(
                      testToken.address,
                      Minamount,
                      interval,
                  )

                  const user2Connected = await withdrawalContract.connect(user2)
                  await testToken
                      .connect(user2)
                      .approve(withdrawalContract.address, MaxAmount)
                  const transactionResponse = await user2Connected.deposit(
                      testToken.address,
                      Minamount,
                      interval,
                  )

                  const funders1 = await withdrawalContract.getFunders(0)
                  const funders2 = await withdrawalContract.getFunders(1)

                  assert.equal(funders1, user1.address)
                  assert.equal(funders2, user2.address)
              })
              it("It emits an event after a user Deposited", async function () {
                const supportedTokenAddress = [testToken.address, testToken2.address]

                const setTokenAddress = await withdrawalContract.setSupportedTokenAddress(supportedTokenAddress)
                await setTokenAddress.wait(1)

                  await testToken.transfer(
                      user1.address,
                      "100000000000000000000",
                  ) //tranfer 10 token to user1

                  const user1Connected = await withdrawalContract.connect(user1)
                  await testToken
                      .connect(user1)
                      .approve(withdrawalContract.address, MaxAmount)
                  expect(
                      await user1Connected.deposit(
                          testToken.address,
                          Minamount,
                          interval,
                      ),
                  ).to.emit("UserDeposited")
              })
          })
          describe("getInterest", function () {
            
              it("It calculates the interest if the duration is between the of 10 and 20 days", async function () {
                const supportedTokenAddress = [testToken.address, testToken2.address]

                const setTokenAddress = await withdrawalContract.setSupportedTokenAddress(supportedTokenAddress)
                await setTokenAddress.wait(1)

                  await testToken.transfer(
                      user1.address,
                      "100000000000000000000",
                  ) //tranfer 10 token to user1
                  await testToken.transfer(
                      user2.address,
                      "100000000000000000000",
                  ) //tranfer 10 token to user1
                  const user1Connected = await withdrawalContract.connect(user1)
                  await testToken
                      .connect(user1)
                      .approve(withdrawalContract.address, MaxAmount)
                  const transactionResponse = await user1Connected.deposit(
                      testToken.address,
                      Minamount,
                      interval,
                  )

                  const calculatedInterest = (2 * Minamount) / 100
                  const interest = await user1Connected.getInterest(
                      Minamount,
                      interval,
                  )

                  expect(interest, calculatedInterest).to.be.equal
              })
              it("It calculates the interest if the duration is between 20 and 30 days", async function () {
                const supportedTokenAddress = [testToken.address, testToken2.address]

                const setTokenAddress = await withdrawalContract.setSupportedTokenAddress(supportedTokenAddress)
                await setTokenAddress.wait(1)

                  await testToken.transfer(
                      user1.address,
                      "100000000000000000000",
                  ) //tranfer 10 token to user1
                  await testToken.transfer(
                      user2.address,
                      "100000000000000000000",
                  ) //tranfer 10 token to user1
                  const user1Connected = await withdrawalContract.connect(user1)
                  await testToken
                      .connect(user1)
                      .approve(withdrawalContract.address, MaxAmount)
                  const transactionResponse = await user1Connected.deposit(
                      testToken.address,
                      Minamount,
                      interval,
                  )

                  const calculatedInterest = (4 * Minamount) / 100
                  const interest = await user1Connected.getInterest(
                      Minamount,
                      sDuration.days(20),
                  )

                  expect(interest, calculatedInterest).to.be.equal
              })
              it("It calculates the interest if the duration is between 30days and above", async function () {
                const supportedTokenAddress = [testToken.address, testToken2.address]

                const setTokenAddress = await withdrawalContract.setSupportedTokenAddress(supportedTokenAddress)
                await setTokenAddress.wait(1)

                  await testToken.transfer(
                      user1.address,
                      "100000000000000000000",
                  ) //tranfer 10 token to user1
                  await testToken.transfer(
                      user2.address,
                      "100000000000000000000",
                  ) //tranfer 10 token to user1
                  const user1Connected = await withdrawalContract.connect(user1)
                  await testToken
                      .connect(user1)
                      .approve(withdrawalContract.address, MaxAmount)
                  const transactionResponse = await user1Connected.deposit(
                      testToken.address,
                      Minamount,
                      interval,
                  )

                  const calculatedInterest = (10 * Minamount) / 100
                  const interest = await user1Connected.getInterest(
                      Minamount,
                      sDuration.days(100),
                  )

                  expect(interest, calculatedInterest).to.be.equal
              })
          })
          describe("withdraw", function () {
              it("it reverts with a custom error if the caller is not the depositor", async function () {
                const supportedTokenAddress = [testToken.address, testToken2.address]

                const setTokenAddress = await withdrawalContract.setSupportedTokenAddress(supportedTokenAddress)
                await setTokenAddress.wait(1)

                  await testToken.transfer(
                      user1.address,
                      "100000000000000000000",
                  ) //tranfer 10 token to user1

                  await testToken.transfer(
                      withdrawalContract.address,
                      "100000000000000000000",
                  ) //tranfer 100 token to the contract

                  const user1Connected = await withdrawalContract.connect(user1)
                  await testToken
                      .connect(user1)
                      .approve(withdrawalContract.address, MaxAmount)
                  const transactionResponse = await user1Connected.deposit(
                      testToken.address,
                      Minamount,
                      interval,
                  )

                  const transactionReceipt = await transactionResponse.wait(1)

                  const depositId = transactionReceipt.events[1].args.depositId

                  // Fast Forwarding the time

                  await network.provider.send("evm_increaseTime", [
                      interval + 1,
                  ])
                  await network.provider.request({
                      method: "evm_mine",
                      params: [],
                  })

                  //Calling the withdrawal function on the deployer

                  await expect(
                      withdrawalContract.withdraw(testToken.address, depositId),
                  ).to.be.revertedWith("NotDepositor")
              })
              it("it reverts if the duration has not passed not yet", async function () {
                const supportedTokenAddress = [testToken.address, testToken2.address]

                const setTokenAddress = await withdrawalContract.setSupportedTokenAddress(supportedTokenAddress)
                await setTokenAddress.wait(1)

                  await testToken.transfer(
                      user1.address,
                      "100000000000000000000",
                  ) //tranfer 10 token to user1

                  await testToken.transfer(
                      withdrawalContract.address,
                      "100000000000000000000",
                  ) //tranfer 100 token to the contract

                  const user1Connected = await withdrawalContract.connect(user1)
                  await testToken
                      .connect(user1)
                      .approve(withdrawalContract.address, MaxAmount)
                  const transactionResponse = await user1Connected.deposit(
                      testToken.address,
                      Minamount,
                      interval,
                  )

                  const transactionReceipt = await transactionResponse.wait(1)

                  const depositId = transactionReceipt.events[1].args.depositId

                  //Calling the withdraw button when the time has not passed yet

                  await expect(
                      user1Connected.withdraw(testToken.address, depositId),
                  ).to.be.revertedWith("NotRiped")
              })
              it("it successfully withdraws the depositor amount with interest after time has passed", async () => {
                const supportedTokenAddress = [testToken.address, testToken2.address]

                const setTokenAddress = await withdrawalContract.setSupportedTokenAddress(supportedTokenAddress)
                await setTokenAddress.wait(1)

                  await testToken.transfer(
                      user1.address,
                      "100000000000000000000",
                  ) //tranfer 100 token to user1

                  await testToken.transfer(
                      withdrawalContract.address,
                      "100000000000000000000",
                  ) //tranfer 100 token to the contract

                  const startingContractBalance = await testToken.balanceOf(
                      withdrawalContract.address,
                  )
                  const startingUser1Balance = await testToken.balanceOf(
                      user1.address,
                  )

                  const user1Connected = await withdrawalContract.connect(user1)
                  await testToken
                      .connect(user1)
                      .approve(withdrawalContract.address, MaxAmount)
                  const transactionResponse = await user1Connected.deposit(
                      testToken.address,
                      Minamount,
                      interval,
                  )

                  const transactionReceipt = await transactionResponse.wait(1)

                  const depositId = transactionReceipt.events[1].args.depositId

                  const interest =
                      await user1Connected.getUserInterest(depositId)

                  await network.provider.send("evm_increaseTime", [
                      interval + 1,
                  ])
                  await network.provider.request({
                      method: "evm_mine",
                      params: [],
                  })

                  await user1Connected.withdraw(testToken.address, depositId)

                  const endingContractBalance = await testToken.balanceOf(
                      withdrawalContract.address,
                  )

                  const endingUser1Balance = await testToken.balanceOf(
                      user1.address,
                  )


                  assert.equal(
                      endingUser1Balance.toString(),
                      startingUser1Balance.add(interest),
                  )
                  assert.equal(
                      endingContractBalance.toString(),
                      startingContractBalance.sub(interest).toString(),
                  )
              })
              it("it reverts if the caller calls the withdrawal button after the first time", async () => {
                const supportedTokenAddress = [testToken.address, testToken2.address]

                const setTokenAddress = await withdrawalContract.setSupportedTokenAddress(supportedTokenAddress)
                await setTokenAddress.wait(1)

                await testToken.transfer(
                    user1.address,
                    "100000000000000000000",
                ) //tranfer 100 token to user1

                await testToken.transfer(
                    withdrawalContract.address,
                    "100000000000000000000",
                ) //tranfer 100 token to the contract

                const startingContractBalance = await testToken.balanceOf(
                    withdrawalContract.address,
                )
                const startingUser1Balance = await testToken.balanceOf(
                    user1.address,
                )

                const user1Connected = await withdrawalContract.connect(user1)
                await testToken
                    .connect(user1)
                    .approve(withdrawalContract.address, MaxAmount)
                const transactionResponse = await user1Connected.deposit(
                    testToken.address,
                    Minamount,
                    interval,
                )

                const transactionReceipt = await transactionResponse.wait(1)

                const depositId = transactionReceipt.events[1].args.depositId

                const interest =
                    await user1Connected.getUserInterest(depositId)

                await network.provider.send("evm_increaseTime", [
                    interval + 1,
                ])
                await network.provider.request({
                    method: "evm_mine",
                    params: [],
                })

                await user1Connected.withdraw(testToken.address, depositId)

                await expect(user1Connected.withdraw(testToken.address, depositId)).to.be.revertedWith("DepositAlreadyClosed")

              }
              )
          })
      })


