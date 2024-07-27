// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//import statements
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./PriceConverter.sol";
import "./interfaces/IWETH.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

//error codes
error withdrawalContract__NotUser();
error WithdrawalContract__NotDepositor();
error WithdrawalContract__DepositAlreadyClosed();
error WithdrawalContract__NotRiped();
error WithdrawalContract__InsufficientBalance();
error withdrawalContract__AmountExceeded();
error withdrawalContract__NotEnoughAmount();
error withdrawalContract__AmountIsTooMuch();
error withdrawalContract__InvalidTokenAddress();

contract WithdrawalContract is ReentrancyGuard, Ownable {
    using PriceConverter for uint256;

    enum WithdrawalState {
        OPEN,
        CLOSED
    }

    struct UserParameters {
        address depositor;
        uint256 amountDeposited;
        uint256 depositTime;
        uint256 duration;
        bytes32 depositId;
        WithdrawalState state;
    }

    // state Variables
    address public WETH = 0x5f207d42F869fd1c71d7f0f81a2A67Fc20FF7323; // Sepolia Weth
    uint256 public constant MINIMUM_AMOUNT = 0.02 * 10 ** 18;
    uint256 public MAXIMUM_AMOUNT = 10 * 10 ** 18;
    address[] private s_funders;
    WithdrawalState private s_withdrawalState;
    uint256 private s_lastTimeStamp;
    uint256 private totalAmountToWithdraw;
    address[] public supportedTokenAddress;

    mapping(bytes32 => UserParameters) private s_idToUserParameters;
    mapping(address => bytes32[]) private s_addressToIds;
    mapping(bytes32 => uint256) private s_idsToAmountToWithdraw;
    mapping(address => bool) public isSupported;
    mapping(address => address) public tokenToPriceFeed;

    AggregatorV3Interface private s_priceFeed;
    uint256 private s_funderInvestment;

    //Interest Variables
    uint256 private counterId;

    receive() external payable {}

    fallback() external payable {}

    event UserDeposited(
        address indexed depositor,
        bytes32 indexed depositId
    );
    event UserWithdrawed(
        uint256 indexed totalToWithdraw,
        address indexed user
    );

    constructor(
        address pricedFeedAdress
    )
        // uint256 minimumAmount,
        // uint256 maximumAmount
        Ownable(msg.sender)
    {
        s_priceFeed = AggregatorV3Interface(pricedFeedAdress);
      
    }

    function deposit(
        address tokenAddress,
        uint256 amount,
        uint256 interval
    ) external nonReentrant {
        if (amount < MINIMUM_AMOUNT) {
            revert withdrawalContract__NotEnoughAmount();
        }
        if (amount > MAXIMUM_AMOUNT) {
            revert withdrawalContract__AmountIsTooMuch();
        }
        // if (!isSupported[tokenAddress]) {
        //     revert withdrawalContract__InvalidTokenAddress();
        // }

        if (amount > msg.sender.balance) {
            revert withdrawalContract__AmountExceeded();
        }

        if (tokenAddress == WETH) {
            IWETH(tokenAddress).transferFrom(msg.sender, address(this), amount);
        } else {
            IERC20(tokenAddress).transferFrom(
                msg.sender,
                address(this),
                amount
            );
        }

        // Increment counter id by 1
        counterId++;

        // Generate a new ID
        bytes32 depositId = keccak256(
            abi.encodePacked(msg.sender, counterId, s_lastTimeStamp)
        );

        // Create a new user parameter

        UserParameters memory parameter = UserParameters({
            depositor: msg.sender,
            amountDeposited: amount,
            depositTime: block.timestamp,
            duration: interval,
            depositId: depositId,
            state: WithdrawalState.OPEN
        });

        // Store the user parameter
        s_idToUserParameters[depositId] = parameter;
        s_addressToIds[msg.sender].push(depositId);
        s_funders.push(msg.sender);

        // Emit an event
        emit UserDeposited(msg.sender, depositId);
    }

    function withdraw(address tokenAddress, bytes32 depositId) external {
        UserParameters memory parameters = s_idToUserParameters[depositId];

        // Check if the caller of this function is the depositor
        if (parameters.depositor != msg.sender) {
            revert WithdrawalContract__NotDepositor();
        }

        // Check if the deposit has not been closed
        if (parameters.state == WithdrawalState.CLOSED) {
            revert WithdrawalContract__DepositAlreadyClosed();
        }

        // Check if the deposit is ripe.
        if (block.timestamp < parameters.depositTime + parameters.duration) {
            revert WithdrawalContract__NotRiped();
        }

        // Calculate interest on the deposit
        uint256 interest = getInterest(
            parameters.amountDeposited,
            parameters.duration
        );

        // Check if the contract has enough eth to transfer to the depositor
        totalAmountToWithdraw = interest + parameters.amountDeposited;

        if (tokenAddress == WETH) {
            require(
                address(this).balance >= totalAmountToWithdraw,
                "Insufficient Balance"
            );
            IWETH(tokenAddress).withdraw(totalAmountToWithdraw);

            // Withdraw the deposited amount + the interest
            IWETH(tokenAddress).withdraw(totalAmountToWithdraw);
            (bool success, ) = msg.sender.call{value: totalAmountToWithdraw}(
                ""
            );
            require(success, "TrasferFailed");
        } else {
            IERC20 token = IERC20(tokenAddress);
            require(
                token.balanceOf(address(this)) >= totalAmountToWithdraw,
                "Insufficient Balance"
            );
            token.transfer(msg.sender, totalAmountToWithdraw);
        }

        // Close the deposit
        s_idToUserParameters[depositId].state = WithdrawalState.CLOSED;
        s_idsToAmountToWithdraw[depositId] = totalAmountToWithdraw;

        // Emit an event
        emit UserWithdrawed(totalAmountToWithdraw, msg.sender);
    }

    function getInterest(
        uint256 amount,
        uint256 duration
    )  public pure returns  (uint256)  {
        // UserParameters memory parameter;
        // amount = parameter.amountDeposited;
        // duration= parameter.duration;
        /*

            After 10 days, 2%
            After 20 days, 4%
            After 30 days, 10%
        */
        uint256 interest = 0;

        if (duration >= 30 days) {
            interest = (10 * amount) / 100;
        } else if (duration >= 20 days) {
            interest = (4 * amount) / 100;
        } else if (duration >= 10 days) {
            interest = (2 * amount) / 100;
        }
        return interest;
    }

    function checkIfSupported(address tokenAddress) public view returns(int256) {
        for (uint i = 0; i < supportedTokenAddress.length; i++) {
            address currentTokenAddress = supportedTokenAddress[i];
            if(currentTokenAddress == tokenAddress){
                return int256(i);
            }

        }
        return -1;

    }

    function setSupportedTokenAddress(
        address[] memory tokenAddress
    ) external onlyOwner {
        for (uint i = 0; i < tokenAddress.length; i++) {
            address currentTokenAddress = tokenAddress[i];
            int256 index = checkIfSupported(currentTokenAddress);
         if (index < 0) {
            supportedTokenAddress.push(currentTokenAddress);

         } else if (index >= 0) {
            isSupported[currentTokenAddress] = true;
            
         }
        }
    }

 function setTokenToPriceFeed(address tokenAddress, address priceFeed) external  onlyOwner{
    tokenToPriceFeed[tokenAddress] = priceFeed;
 }

    function getFunders(uint256 index) external view returns (address) {
        return s_funders[index];
    }

    function getWithdrawalState() external view returns (WithdrawalState) {
        return s_withdrawalState;
    }

    function getUserInterest(
        bytes32 depositId
    ) external view returns (uint256) {
        UserParameters memory parameters = s_idToUserParameters[depositId];

        return getInterest(parameters.amountDeposited, parameters.duration);
    }

    function getPriceFeed() external view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }

    function getParameters(
        bytes32 depositId
    ) external view returns (UserParameters memory parameter) {
        return s_idToUserParameters[depositId];
    }

    function getDepositId(
        address user
    ) external view returns (bytes32[] memory) {
        return s_addressToIds[user];
    }
}

