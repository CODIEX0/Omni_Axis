// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title CommunityEscrow
 * @dev Escrow contract for community micro-tasks with automated payment release
 * Features:
 * - Multi-token support (ETH, USDC, OAX)
 * - Automated escrow and release mechanism
 * - Dispute resolution system
 * - Fee collection for platform sustainability
 */
contract CommunityEscrow is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant TASK_MANAGER_ROLE = keccak256("TASK_MANAGER_ROLE");
    bytes32 public constant DISPUTE_RESOLVER_ROLE = keccak256("DISPUTE_RESOLVER_ROLE");
    bytes32 public constant FEE_MANAGER_ROLE = keccak256("FEE_MANAGER_ROLE");

    enum TaskStatus { CREATED, ASSIGNED, SUBMITTED, COMPLETED, DISPUTED, CANCELLED }
    enum DisputeStatus { NONE, RAISED, RESOLVED }

    struct Task {
        uint256 taskId;
        address poster;
        address assignee;
        address paymentToken; // address(0) for ETH
        uint256 reward;
        uint256 platformFee;
        TaskStatus status;
        uint256 deadline;
        uint256 createdAt;
        string metadataHash; // IPFS hash for task details
    }

    struct Dispute {
        uint256 taskId;
        address initiator;
        DisputeStatus status;
        uint256 createdAt;
        uint256 resolvedAt;
        address resolver;
        string reason;
        string resolution;
    }

    mapping(uint256 => Task) public tasks;
    mapping(uint256 => Dispute) public disputes;
    mapping(address => bool) public supportedTokens;
    
    uint256 public nextTaskId = 1;
    uint256 public platformFeeRate = 250; // 2.5% in basis points
    address public feeRecipient;
    
    // Reputation system
    mapping(address => uint256) public userReputation;
    mapping(address => uint256) public completedTasks;
    mapping(address => uint256) public totalEarnings;

    // Events
    event TaskCreated(
        uint256 indexed taskId,
        address indexed poster,
        address paymentToken,
        uint256 reward,
        uint256 deadline,
        string metadataHash
    );
    
    event TaskAssigned(uint256 indexed taskId, address indexed assignee);
    event TaskSubmitted(uint256 indexed taskId, string proofHash);
    event TaskCompleted(uint256 indexed taskId, uint256 payout);
    event TaskCancelled(uint256 indexed taskId, uint256 refund);
    
    event DisputeRaised(uint256 indexed taskId, address indexed initiator, string reason);
    event DisputeResolved(uint256 indexed taskId, address indexed resolver, string resolution);
    
    event ReputationUpdated(address indexed user, uint256 newReputation);
    event PlatformFeeUpdated(uint256 newFeeRate);

    constructor(address _feeRecipient) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(TASK_MANAGER_ROLE, msg.sender);
        _grantRole(DISPUTE_RESOLVER_ROLE, msg.sender);
        _grantRole(FEE_MANAGER_ROLE, msg.sender);
        
        feeRecipient = _feeRecipient;
        
        // Enable ETH by default
        supportedTokens[address(0)] = true;
    }

    /**
     * @dev Create a new task with escrow
     * @param paymentToken Token address (address(0) for ETH)
     * @param reward Reward amount
     * @param deadline Task deadline timestamp
     * @param metadataHash IPFS hash containing task details
     */
    function createTask(
        address paymentToken,
        uint256 reward,
        uint256 deadline,
        string memory metadataHash
    ) external payable nonReentrant returns (uint256 taskId) {
        require(supportedTokens[paymentToken], "Token not supported");
        require(reward > 0, "Reward must be greater than 0");
        require(deadline > block.timestamp, "Deadline must be in the future");
        require(bytes(metadataHash).length > 0, "Metadata hash required");

        uint256 platformFee = (reward * platformFeeRate) / 10000;
        uint256 totalAmount = reward + platformFee;

        taskId = nextTaskId++;

        tasks[taskId] = Task({
            taskId: taskId,
            poster: msg.sender,
            assignee: address(0),
            paymentToken: paymentToken,
            reward: reward,
            platformFee: platformFee,
            status: TaskStatus.CREATED,
            deadline: deadline,
            createdAt: block.timestamp,
            metadataHash: metadataHash
        });

        // Handle payment
        if (paymentToken == address(0)) {
            require(msg.value >= totalAmount, "Insufficient ETH sent");
            
            // Refund excess ETH
            if (msg.value > totalAmount) {
                (bool success, ) = payable(msg.sender).call{value: msg.value - totalAmount}("");
                require(success, "ETH refund failed");
            }
        } else {
            IERC20(paymentToken).safeTransferFrom(msg.sender, address(this), totalAmount);
        }

        emit TaskCreated(taskId, msg.sender, paymentToken, reward, deadline, metadataHash);
    }

    /**
     * @dev Assign task to a worker
     * @param taskId Task ID
     * @param assignee Worker address
     */
    function assignTask(uint256 taskId, address assignee) external onlyRole(TASK_MANAGER_ROLE) {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.CREATED, "Task not available for assignment");
        require(assignee != address(0), "Invalid assignee address");
        require(assignee != task.poster, "Poster cannot be assignee");

        task.assignee = assignee;
        task.status = TaskStatus.ASSIGNED;

        emit TaskAssigned(taskId, assignee);
    }

    /**
     * @dev Submit proof of work for a task
     * @param taskId Task ID
     * @param proofHash IPFS hash of proof of work
     */
    function submitTask(uint256 taskId, string memory proofHash) external {
        Task storage task = tasks[taskId];
        require(task.assignee == msg.sender, "Not assigned to this task");
        require(task.status == TaskStatus.ASSIGNED, "Task not in assigned status");
        require(block.timestamp <= task.deadline, "Task deadline passed");
        require(bytes(proofHash).length > 0, "Proof hash required");

        task.status = TaskStatus.SUBMITTED;

        emit TaskSubmitted(taskId, proofHash);
    }

    /**
     * @dev Complete task and release payment
     * @param taskId Task ID
     */
    function completeTask(uint256 taskId) external onlyRole(TASK_MANAGER_ROLE) {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.SUBMITTED, "Task not submitted");

        task.status = TaskStatus.COMPLETED;

        // Update reputation and stats
        userReputation[task.assignee] += 10; // Base reputation points
        completedTasks[task.assignee] += 1;
        totalEarnings[task.assignee] += task.reward;

        // Release payment
        if (task.paymentToken == address(0)) {
            (bool success, ) = payable(task.assignee).call{value: task.reward}("");
            require(success, "ETH payment failed");
            
            // Transfer platform fee
            (bool feeSuccess, ) = payable(feeRecipient).call{value: task.platformFee}("");
            require(feeSuccess, "Fee transfer failed");
        } else {
            IERC20(task.paymentToken).safeTransfer(task.assignee, task.reward);
            IERC20(task.paymentToken).safeTransfer(feeRecipient, task.platformFee);
        }

        emit TaskCompleted(taskId, task.reward);
        emit ReputationUpdated(task.assignee, userReputation[task.assignee]);
    }

    /**
     * @dev Cancel task and refund poster
     * @param taskId Task ID
     */
    function cancelTask(uint256 taskId) external {
        Task storage task = tasks[taskId];
        require(
            task.poster == msg.sender || hasRole(TASK_MANAGER_ROLE, msg.sender),
            "Not authorized to cancel"
        );
        require(
            task.status == TaskStatus.CREATED || 
            task.status == TaskStatus.ASSIGNED ||
            block.timestamp > task.deadline,
            "Cannot cancel task in current status"
        );

        task.status = TaskStatus.CANCELLED;
        uint256 refundAmount = task.reward + task.platformFee;

        // Refund poster
        if (task.paymentToken == address(0)) {
            (bool success, ) = payable(task.poster).call{value: refundAmount}("");
            require(success, "ETH refund failed");
        } else {
            IERC20(task.paymentToken).safeTransfer(task.poster, refundAmount);
        }

        emit TaskCancelled(taskId, refundAmount);
    }

    /**
     * @dev Raise a dispute for a task
     * @param taskId Task ID
     * @param reason Dispute reason
     */
    function raiseDispute(uint256 taskId, string memory reason) external {
        Task storage task = tasks[taskId];
        require(
            task.poster == msg.sender || task.assignee == msg.sender,
            "Not authorized to raise dispute"
        );
        require(
            task.status == TaskStatus.SUBMITTED || task.status == TaskStatus.ASSIGNED,
            "Cannot dispute task in current status"
        );
        require(disputes[taskId].status == DisputeStatus.NONE, "Dispute already exists");

        task.status = TaskStatus.DISPUTED;
        
        disputes[taskId] = Dispute({
            taskId: taskId,
            initiator: msg.sender,
            status: DisputeStatus.RAISED,
            createdAt: block.timestamp,
            resolvedAt: 0,
            resolver: address(0),
            reason: reason,
            resolution: ""
        });

        emit DisputeRaised(taskId, msg.sender, reason);
    }

    /**
     * @dev Resolve a dispute
     * @param taskId Task ID
     * @param resolution Resolution description
     * @param favorPoster True if ruling in favor of poster, false for assignee
     */
    function resolveDispute(
        uint256 taskId,
        string memory resolution,
        bool favorPoster
    ) external onlyRole(DISPUTE_RESOLVER_ROLE) {
        Task storage task = tasks[taskId];
        Dispute storage dispute = disputes[taskId];
        
        require(task.status == TaskStatus.DISPUTED, "Task not in dispute");
        require(dispute.status == DisputeStatus.RAISED, "Dispute not active");

        dispute.status = DisputeStatus.RESOLVED;
        dispute.resolvedAt = block.timestamp;
        dispute.resolver = msg.sender;
        dispute.resolution = resolution;

        uint256 totalAmount = task.reward + task.platformFee;

        if (favorPoster) {
            // Refund poster
            task.status = TaskStatus.CANCELLED;
            
            if (task.paymentToken == address(0)) {
                (bool success, ) = payable(task.poster).call{value: totalAmount}("");
                require(success, "ETH refund failed");
            } else {
                IERC20(task.paymentToken).safeTransfer(task.poster, totalAmount);
            }
        } else {
            // Pay assignee
            task.status = TaskStatus.COMPLETED;
            
            // Update reputation and stats
            userReputation[task.assignee] += 5; // Reduced points for disputed task
            completedTasks[task.assignee] += 1;
            totalEarnings[task.assignee] += task.reward;

            if (task.paymentToken == address(0)) {
                (bool success, ) = payable(task.assignee).call{value: task.reward}("");
                require(success, "ETH payment failed");
                
                (bool feeSuccess, ) = payable(feeRecipient).call{value: task.platformFee}("");
                require(feeSuccess, "Fee transfer failed");
            } else {
                IERC20(task.paymentToken).safeTransfer(task.assignee, task.reward);
                IERC20(task.paymentToken).safeTransfer(feeRecipient, task.platformFee);
            }

            emit ReputationUpdated(task.assignee, userReputation[task.assignee]);
        }

        emit DisputeResolved(taskId, msg.sender, resolution);
    }

    /**
     * @dev Add supported payment token
     * @param token Token address
     */
    function addSupportedToken(address token) external onlyRole(DEFAULT_ADMIN_ROLE) {
        supportedTokens[token] = true;
    }

    /**
     * @dev Remove supported payment token
     * @param token Token address
     */
    function removeSupportedToken(address token) external onlyRole(DEFAULT_ADMIN_ROLE) {
        supportedTokens[token] = false;
    }

    /**
     * @dev Update platform fee rate
     * @param newFeeRate New fee rate in basis points
     */
    function updatePlatformFeeRate(uint256 newFeeRate) external onlyRole(FEE_MANAGER_ROLE) {
        require(newFeeRate <= 1000, "Fee rate cannot exceed 10%");
        platformFeeRate = newFeeRate;
        emit PlatformFeeUpdated(newFeeRate);
    }

    /**
     * @dev Update fee recipient
     * @param newFeeRecipient New fee recipient address
     */
    function updateFeeRecipient(address newFeeRecipient) external onlyRole(FEE_MANAGER_ROLE) {
        require(newFeeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = newFeeRecipient;
    }

    /**
     * @dev Get task details
     * @param taskId Task ID
     * @return Task struct
     */
    function getTask(uint256 taskId) external view returns (Task memory) {
        return tasks[taskId];
    }

    /**
     * @dev Get dispute details
     * @param taskId Task ID
     * @return Dispute struct
     */
    function getDispute(uint256 taskId) external view returns (Dispute memory) {
        return disputes[taskId];
    }

    /**
     * @dev Get user statistics
     * @param user User address
     * @return reputation User reputation score
     * @return completed Number of completed tasks
     * @return earnings Total earnings
     */
    function getUserStats(address user) external view returns (
        uint256 reputation,
        uint256 completed,
        uint256 earnings
    ) {
        return (
            userReputation[user],
            completedTasks[user],
            totalEarnings[user]
        );
    }

    /**
     * @dev Emergency withdrawal function
     * @param token Token address (address(0) for ETH)
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(
        address token,
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (token == address(0)) {
            (bool success, ) = payable(msg.sender).call{value: amount}("");
            require(success, "ETH withdrawal failed");
        } else {
            IERC20(token).safeTransfer(msg.sender, amount);
        }
    }
}