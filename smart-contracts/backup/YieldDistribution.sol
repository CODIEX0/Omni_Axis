// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title YieldDistribution
 * @dev Contract for distributing yield to OAX token stakers
 * Features:
 * - Multiple staking pools with different APY rates
 * - Proportional yield distribution based on stake amount
 * - Flexible staking and unstaking with optional lock periods
 * - Compound interest calculation
 */
contract YieldDistribution is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant POOL_MANAGER_ROLE = keccak256("POOL_MANAGER_ROLE");
    bytes32 public constant YIELD_DISTRIBUTOR_ROLE = keccak256("YIELD_DISTRIBUTOR_ROLE");

    struct StakingPool {
        uint256 poolId;
        string name;
        string description;
        IERC20 stakingToken;
        IERC20 rewardToken;
        uint256 apy; // Annual Percentage Yield in basis points (e.g., 1250 = 12.5%)
        uint256 totalStaked;
        uint256 minStakeAmount;
        uint256 lockPeriod; // Lock period in seconds (0 = no lock)
        bool active;
        uint256 createdAt;
    }

    struct UserStake {
        uint256 amount;
        uint256 stakedAt;
        uint256 lastClaimAt;
        uint256 accumulatedRewards;
        uint256 unlockTime;
    }

    mapping(uint256 => StakingPool) public stakingPools;
    mapping(uint256 => mapping(address => UserStake)) public userStakes;
    mapping(address => uint256[]) public userPoolIds;
    
    uint256 public nextPoolId = 1;
    uint256 public constant SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
    uint256 public constant BASIS_POINTS = 10000;

    // Events
    event PoolCreated(
        uint256 indexed poolId,
        string name,
        address stakingToken,
        address rewardToken,
        uint256 apy,
        uint256 minStakeAmount,
        uint256 lockPeriod
    );
    
    event PoolUpdated(uint256 indexed poolId, uint256 newApy, bool active);
    
    event Staked(
        uint256 indexed poolId,
        address indexed user,
        uint256 amount,
        uint256 unlockTime
    );
    
    event Unstaked(
        uint256 indexed poolId,
        address indexed user,
        uint256 amount
    );
    
    event RewardsClaimed(
        uint256 indexed poolId,
        address indexed user,
        uint256 amount
    );
    
    event YieldDistributed(
        uint256 indexed poolId,
        uint256 totalAmount,
        uint256 timestamp
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(POOL_MANAGER_ROLE, msg.sender);
        _grantRole(YIELD_DISTRIBUTOR_ROLE, msg.sender);
    }

    /**
     * @dev Create a new staking pool
     * @param name Pool name
     * @param description Pool description
     * @param stakingToken Token to be staked
     * @param rewardToken Token for rewards
     * @param apy Annual percentage yield in basis points
     * @param minStakeAmount Minimum stake amount
     * @param lockPeriod Lock period in seconds
     */
    function createPool(
        string memory name,
        string memory description,
        address stakingToken,
        address rewardToken,
        uint256 apy,
        uint256 minStakeAmount,
        uint256 lockPeriod
    ) external onlyRole(POOL_MANAGER_ROLE) returns (uint256 poolId) {
        require(stakingToken != address(0), "Invalid staking token");
        require(rewardToken != address(0), "Invalid reward token");
        require(apy > 0 && apy <= 10000, "APY must be between 0.01% and 100%");
        require(minStakeAmount > 0, "Minimum stake must be greater than 0");

        poolId = nextPoolId++;

        stakingPools[poolId] = StakingPool({
            poolId: poolId,
            name: name,
            description: description,
            stakingToken: IERC20(stakingToken),
            rewardToken: IERC20(rewardToken),
            apy: apy,
            totalStaked: 0,
            minStakeAmount: minStakeAmount,
            lockPeriod: lockPeriod,
            active: true,
            createdAt: block.timestamp
        });

        emit PoolCreated(
            poolId,
            name,
            stakingToken,
            rewardToken,
            apy,
            minStakeAmount,
            lockPeriod
        );
    }

    /**
     * @dev Stake tokens in a pool
     * @param poolId Pool ID
     * @param amount Amount to stake
     */
    function stake(uint256 poolId, uint256 amount) external nonReentrant {
        StakingPool storage pool = stakingPools[poolId];
        require(pool.active, "Pool is not active");
        require(amount >= pool.minStakeAmount, "Amount below minimum stake");

        UserStake storage userStake = userStakes[poolId][msg.sender];

        // Claim pending rewards before updating stake
        if (userStake.amount > 0) {
            _claimRewards(poolId, msg.sender);
        } else {
            // First time staking in this pool
            userPoolIds[msg.sender].push(poolId);
        }

        // Transfer tokens to contract
        pool.stakingToken.safeTransferFrom(msg.sender, address(this), amount);

        // Update user stake
        userStake.amount += amount;
        userStake.stakedAt = block.timestamp;
        userStake.lastClaimAt = block.timestamp;
        userStake.unlockTime = block.timestamp + pool.lockPeriod;

        // Update pool total
        pool.totalStaked += amount;

        emit Staked(poolId, msg.sender, amount, userStake.unlockTime);
    }

    /**
     * @dev Unstake tokens from a pool
     * @param poolId Pool ID
     * @param amount Amount to unstake
     */
    function unstake(uint256 poolId, uint256 amount) external nonReentrant {
        StakingPool storage pool = stakingPools[poolId];
        UserStake storage userStake = userStakes[poolId][msg.sender];

        require(userStake.amount >= amount, "Insufficient staked amount");
        require(
            block.timestamp >= userStake.unlockTime || !pool.active,
            "Tokens are still locked"
        );

        // Claim pending rewards
        _claimRewards(poolId, msg.sender);

        // Update user stake
        userStake.amount -= amount;

        // Update pool total
        pool.totalStaked -= amount;

        // Transfer tokens back to user
        pool.stakingToken.safeTransfer(msg.sender, amount);

        emit Unstaked(poolId, msg.sender, amount);
    }

    /**
     * @dev Claim accumulated rewards
     * @param poolId Pool ID
     */
    function claimRewards(uint256 poolId) external nonReentrant {
        _claimRewards(poolId, msg.sender);
    }

    /**
     * @dev Internal function to claim rewards
     * @param poolId Pool ID
     * @param user User address
     */
    function _claimRewards(uint256 poolId, address user) internal {
        StakingPool storage pool = stakingPools[poolId];
        UserStake storage userStake = userStakes[poolId][user];

        if (userStake.amount == 0) return;

        uint256 pendingRewards = calculatePendingRewards(poolId, user);
        
        if (pendingRewards > 0) {
            userStake.accumulatedRewards += pendingRewards;
            userStake.lastClaimAt = block.timestamp;

            // Transfer rewards
            pool.rewardToken.safeTransfer(user, pendingRewards);

            emit RewardsClaimed(poolId, user, pendingRewards);
        }
    }

    /**
     * @dev Calculate pending rewards for a user
     * @param poolId Pool ID
     * @param user User address
     * @return Pending rewards amount
     */
    function calculatePendingRewards(
        uint256 poolId,
        address user
    ) public view returns (uint256) {
        StakingPool storage pool = stakingPools[poolId];
        UserStake storage userStake = userStakes[poolId][user];

        if (userStake.amount == 0) return 0;

        uint256 stakingDuration = block.timestamp - userStake.lastClaimAt;
        uint256 annualReward = (userStake.amount * pool.apy) / BASIS_POINTS;
        uint256 reward = (annualReward * stakingDuration) / SECONDS_PER_YEAR;

        return reward;
    }

    /**
     * @dev Distribute yield to a pool (called by yield distributor)
     * @param poolId Pool ID
     * @param amount Amount to distribute
     */
    function distributeYield(
        uint256 poolId,
        uint256 amount
    ) external onlyRole(YIELD_DISTRIBUTOR_ROLE) {
        StakingPool storage pool = stakingPools[poolId];
        require(pool.active, "Pool is not active");
        require(amount > 0, "Amount must be greater than 0");

        // Transfer yield tokens to contract
        pool.rewardToken.safeTransferFrom(msg.sender, address(this), amount);

        emit YieldDistributed(poolId, amount, block.timestamp);
    }

    /**
     * @dev Update pool parameters
     * @param poolId Pool ID
     * @param newApy New APY in basis points
     * @param active Pool active status
     */
    function updatePool(
        uint256 poolId,
        uint256 newApy,
        bool active
    ) external onlyRole(POOL_MANAGER_ROLE) {
        StakingPool storage pool = stakingPools[poolId];
        require(pool.poolId != 0, "Pool does not exist");
        require(newApy > 0 && newApy <= 10000, "Invalid APY");

        pool.apy = newApy;
        pool.active = active;

        emit PoolUpdated(poolId, newApy, active);
    }

    /**
     * @dev Get pool information
     * @param poolId Pool ID
     * @return Pool struct
     */
    function getPool(uint256 poolId) external view returns (StakingPool memory) {
        return stakingPools[poolId];
    }

    /**
     * @dev Get user stake information
     * @param poolId Pool ID
     * @param user User address
     * @return UserStake struct
     */
    function getUserStake(
        uint256 poolId,
        address user
    ) external view returns (UserStake memory) {
        return userStakes[poolId][user];
    }

    /**
     * @dev Get all pool IDs that a user has staked in
     * @param user User address
     * @return Array of pool IDs
     */
    function getUserPoolIds(address user) external view returns (uint256[] memory) {
        return userPoolIds[user];
    }

    /**
     * @dev Get user's total staked amount across all pools
     * @param user User address
     * @param token Token address to check
     * @return Total staked amount
     */
    function getUserTotalStaked(
        address user,
        address token
    ) external view returns (uint256 totalStaked) {
        uint256[] memory poolIds = userPoolIds[user];
        
        for (uint256 i = 0; i < poolIds.length; i++) {
            StakingPool storage pool = stakingPools[poolIds[i]];
            if (address(pool.stakingToken) == token) {
                totalStaked += userStakes[poolIds[i]][user].amount;
            }
        }
    }

    /**
     * @dev Get user's total pending rewards across all pools
     * @param user User address
     * @param token Reward token address
     * @return Total pending rewards
     */
    function getUserTotalPendingRewards(
        address user,
        address token
    ) external view returns (uint256 totalRewards) {
        uint256[] memory poolIds = userPoolIds[user];
        
        for (uint256 i = 0; i < poolIds.length; i++) {
            StakingPool storage pool = stakingPools[poolIds[i]];
            if (address(pool.rewardToken) == token) {
                totalRewards += calculatePendingRewards(poolIds[i], user);
            }
        }
    }

    /**
     * @dev Emergency withdrawal function
     * @param token Token address
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(
        address token,
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        IERC20(token).safeTransfer(msg.sender, amount);
    }

    /**
     * @dev Get total number of pools
     * @return Number of pools
     */
    function getTotalPools() external view returns (uint256) {
        return nextPoolId - 1;
    }

    /**
     * @dev Check if user can unstake from a pool
     * @param poolId Pool ID
     * @param user User address
     * @return True if user can unstake
     */
    function canUnstake(uint256 poolId, address user) external view returns (bool) {
        StakingPool storage pool = stakingPools[poolId];
        UserStake storage userStake = userStakes[poolId][user];
        
        return block.timestamp >= userStake.unlockTime || !pool.active;
    }
}