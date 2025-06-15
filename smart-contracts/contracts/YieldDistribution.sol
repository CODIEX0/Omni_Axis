// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title YieldDistribution
 * @dev Contract for distributing yields/dividends to token holders
 */
contract YieldDistribution is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant ASSET_MANAGER_ROLE = keccak256("ASSET_MANAGER_ROLE");

    struct Distribution {
        uint256 id;
        address assetToken;
        uint256 totalAmount;
        uint256 totalSupply;
        uint256 distributionDate;
        uint256 claimDeadline;
        string description;
        bool isActive;
        uint256 totalClaimed;
    }

    struct UserClaim {
        uint256 amount;
        bool claimed;
    }

    mapping(uint256 => Distribution) public distributions;
    mapping(uint256 => mapping(address => UserClaim)) public userClaims;
    mapping(address => uint256[]) public userDistributions;
    
    uint256 public nextDistributionId = 1;
    uint256 public defaultClaimPeriod = 365 days; // 1 year to claim
    
    event DistributionCreated(
        uint256 indexed distributionId,
        address indexed assetToken,
        uint256 totalAmount,
        string description
    );
    
    event YieldClaimed(
        uint256 indexed distributionId,
        address indexed user,
        uint256 amount
    );
    
    event DistributionClosed(uint256 indexed distributionId, uint256 unclaimedAmount);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(DISTRIBUTOR_ROLE, msg.sender);
        _grantRole(ASSET_MANAGER_ROLE, msg.sender);
    }

    function createDistribution(
        address assetToken,
        uint256 totalAmount,
        string memory description,
        uint256 customClaimPeriod
    ) external payable onlyRole(DISTRIBUTOR_ROLE) nonReentrant whenNotPaused {
        require(assetToken != address(0), "YieldDistribution: Invalid token address");
        require(totalAmount > 0, "YieldDistribution: Amount must be positive");
        require(msg.value >= totalAmount, "YieldDistribution: Insufficient ETH sent");

        IERC20 token = IERC20(assetToken);
        uint256 totalSupply = token.totalSupply();
        require(totalSupply > 0, "YieldDistribution: Token has no supply");

        uint256 claimPeriod = customClaimPeriod > 0 ? customClaimPeriod : defaultClaimPeriod;
        uint256 distributionId = nextDistributionId++;

        distributions[distributionId] = Distribution({
            id: distributionId,
            assetToken: assetToken,
            totalAmount: totalAmount,
            totalSupply: totalSupply,
            distributionDate: block.timestamp,
            claimDeadline: block.timestamp + claimPeriod,
            description: description,
            isActive: true,
            totalClaimed: 0
        });

        emit DistributionCreated(distributionId, assetToken, totalAmount, description);
    }

    function calculateUserShare(uint256 distributionId, address user) public view returns (uint256) {
        Distribution memory dist = distributions[distributionId];
        require(dist.assetToken != address(0), "YieldDistribution: Distribution not found");
        
        IERC20 token = IERC20(dist.assetToken);
        uint256 userBalance = token.balanceOf(user);
        
        if (userBalance == 0 || dist.totalSupply == 0) {
            return 0;
        }
        
        return (dist.totalAmount * userBalance) / dist.totalSupply;
    }

    function claimYield(uint256 distributionId) external nonReentrant whenNotPaused {
        Distribution storage dist = distributions[distributionId];
        require(dist.isActive, "YieldDistribution: Distribution not active");
        require(block.timestamp <= dist.claimDeadline, "YieldDistribution: Claim period expired");
        require(!userClaims[distributionId][msg.sender].claimed, "YieldDistribution: Already claimed");

        uint256 claimAmount = calculateUserShare(distributionId, msg.sender);
        require(claimAmount > 0, "YieldDistribution: No yield to claim");

        userClaims[distributionId][msg.sender] = UserClaim({
            amount: claimAmount,
            claimed: true
        });

        userDistributions[msg.sender].push(distributionId);
        dist.totalClaimed += claimAmount;

        payable(msg.sender).transfer(claimAmount);
        
        emit YieldClaimed(distributionId, msg.sender, claimAmount);
    }

    function batchClaimYield(uint256[] calldata distributionIds) external nonReentrant whenNotPaused {
        uint256 totalClaim = 0;
        
        for (uint256 i = 0; i < distributionIds.length; i++) {
            uint256 distributionId = distributionIds[i];
            Distribution storage dist = distributions[distributionId];
            
            if (!dist.isActive || 
                block.timestamp > dist.claimDeadline || 
                userClaims[distributionId][msg.sender].claimed) {
                continue;
            }

            uint256 claimAmount = calculateUserShare(distributionId, msg.sender);
            if (claimAmount == 0) {
                continue;
            }

            userClaims[distributionId][msg.sender] = UserClaim({
                amount: claimAmount,
                claimed: true
            });

            userDistributions[msg.sender].push(distributionId);
            dist.totalClaimed += claimAmount;
            totalClaim += claimAmount;

            emit YieldClaimed(distributionId, msg.sender, claimAmount);
        }

        require(totalClaim > 0, "YieldDistribution: No yield to claim");
        payable(msg.sender).transfer(totalClaim);
    }

    function closeDistribution(uint256 distributionId) external onlyRole(ASSET_MANAGER_ROLE) {
        Distribution storage dist = distributions[distributionId];
        require(dist.isActive, "YieldDistribution: Distribution already closed");
        require(block.timestamp > dist.claimDeadline, "YieldDistribution: Claim period not expired");

        dist.isActive = false;
        uint256 unclaimedAmount = dist.totalAmount - dist.totalClaimed;

        if (unclaimedAmount > 0) {
            payable(msg.sender).transfer(unclaimedAmount);
        }

        emit DistributionClosed(distributionId, unclaimedAmount);
    }

    function getUserDistributions(address user) external view returns (uint256[] memory) {
        return userDistributions[user];
    }

    function getUserClaimStatus(uint256 distributionId, address user) external view returns (uint256 amount, bool claimed) {
        UserClaim memory claim = userClaims[distributionId][user];
        if (claim.claimed) {
            return (claim.amount, true);
        }
        return (calculateUserShare(distributionId, user), false);
    }

    function getDistribution(uint256 distributionId) external view returns (Distribution memory) {
        return distributions[distributionId];
    }

    function setDefaultClaimPeriod(uint256 newPeriod) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newPeriod > 0, "YieldDistribution: Invalid period");
        defaultClaimPeriod = newPeriod;
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function emergencyWithdraw() external onlyRole(DEFAULT_ADMIN_ROLE) {
        payable(msg.sender).transfer(address(this).balance);
    }

    receive() external payable {}
}
