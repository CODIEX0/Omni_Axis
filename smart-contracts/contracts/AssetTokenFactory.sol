// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./AssetToken.sol";

/**
 * @title AssetTokenFactory
 * @dev Factory contract for creating new asset tokens using minimal proxy pattern
 * Features:
 * - Gas-efficient token deployment using clones
 * - Role-based access control for token creation
 * - Asset registry and management
 * - Fee collection mechanism
 */
contract AssetTokenFactory is AccessControl, ReentrancyGuard {
    bytes32 public constant ASSET_CREATOR_ROLE = keccak256("ASSET_CREATOR_ROLE");
    bytes32 public constant FEE_MANAGER_ROLE = keccak256("FEE_MANAGER_ROLE");

    address public immutable assetTokenImplementation;
    
    struct TokenInfo {
        address tokenAddress;
        address creator;
        string assetType;
        uint256 totalValue;
        uint256 createdAt;
        bool active;
    }

    mapping(address => TokenInfo) public tokenRegistry;
    address[] public allTokens;
    
    uint256 public creationFee = 0.1 ether; // Fee in native token (ETH/MATIC)
    address public feeRecipient;

    // Events
    event AssetTokenCreated(
        address indexed tokenAddress,
        address indexed creator,
        string name,
        string symbol,
        uint256 totalSupply,
        string assetType
    );
    event CreationFeeUpdated(uint256 newFee);
    event FeeRecipientUpdated(address newRecipient);
    event TokenStatusUpdated(address indexed tokenAddress, bool active);

    constructor(address _feeRecipient) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ASSET_CREATOR_ROLE, msg.sender);
        _grantRole(FEE_MANAGER_ROLE, msg.sender);
        
        feeRecipient = _feeRecipient;
        
        // Deploy the implementation contract
        assetTokenImplementation = address(new AssetToken());
    }

    /**
     * @dev Create a new asset token
     * @param name Token name
     * @param symbol Token symbol
     * @param totalSupply Total token supply
     * @param assetMetadata Asset metadata struct
     * @return tokenAddress Address of the created token
     */
    function createAssetToken(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        AssetToken.AssetMetadata memory assetMetadata
    ) external payable onlyRole(ASSET_CREATOR_ROLE) nonReentrant returns (address tokenAddress) {
        require(msg.value >= creationFee, "Insufficient creation fee");
        require(totalSupply > 0, "Total supply must be greater than 0");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(symbol).length > 0, "Symbol cannot be empty");

        // Create clone of implementation
        tokenAddress = Clones.clone(assetTokenImplementation);
        
        // Initialize the cloned contract
        AssetToken(tokenAddress).initialize(
            name,
            symbol,
            totalSupply,
            msg.sender,
            assetMetadata
        );

        // Register the token
        tokenRegistry[tokenAddress] = TokenInfo({
            tokenAddress: tokenAddress,
            creator: msg.sender,
            assetType: assetMetadata.assetType,
            totalValue: assetMetadata.totalValue,
            createdAt: block.timestamp,
            active: true
        });

        allTokens.push(tokenAddress);

        // Transfer creation fee
        if (msg.value > 0) {
            (bool success, ) = payable(feeRecipient).call{value: msg.value}("");
            require(success, "Fee transfer failed");
        }

        emit AssetTokenCreated(
            tokenAddress,
            msg.sender,
            name,
            symbol,
            totalSupply,
            assetMetadata.assetType
        );

        return tokenAddress;
    }

    /**
     * @dev Update creation fee
     * @param newFee New creation fee amount
     */
    function updateCreationFee(uint256 newFee) external onlyRole(FEE_MANAGER_ROLE) {
        creationFee = newFee;
        emit CreationFeeUpdated(newFee);
    }

    /**
     * @dev Update fee recipient
     * @param newRecipient New fee recipient address
     */
    function updateFeeRecipient(address newRecipient) external onlyRole(FEE_MANAGER_ROLE) {
        require(newRecipient != address(0), "Invalid recipient address");
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(newRecipient);
    }

    /**
     * @dev Update token status (active/inactive)
     * @param tokenAddress Token address
     * @param active New status
     */
    function updateTokenStatus(
        address tokenAddress, 
        bool active
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(tokenRegistry[tokenAddress].tokenAddress != address(0), "Token not found");
        tokenRegistry[tokenAddress].active = active;
        emit TokenStatusUpdated(tokenAddress, active);
    }

    /**
     * @dev Get all created tokens
     * @return Array of token addresses
     */
    function getAllTokens() external view returns (address[] memory) {
        return allTokens;
    }

    /**
     * @dev Get active tokens
     * @return Array of active token addresses
     */
    function getActiveTokens() external view returns (address[] memory) {
        uint256 activeCount = 0;
        
        // Count active tokens
        for (uint256 i = 0; i < allTokens.length; i++) {
            if (tokenRegistry[allTokens[i]].active) {
                activeCount++;
            }
        }

        // Create array of active tokens
        address[] memory activeTokens = new address[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allTokens.length; i++) {
            if (tokenRegistry[allTokens[i]].active) {
                activeTokens[index] = allTokens[i];
                index++;
            }
        }

        return activeTokens;
    }

    /**
     * @dev Get tokens by asset type
     * @param assetType Asset type to filter by
     * @return Array of token addresses
     */
    function getTokensByType(string memory assetType) external view returns (address[] memory) {
        uint256 count = 0;
        
        // Count matching tokens
        for (uint256 i = 0; i < allTokens.length; i++) {
            if (
                tokenRegistry[allTokens[i]].active &&
                keccak256(bytes(tokenRegistry[allTokens[i]].assetType)) == keccak256(bytes(assetType))
            ) {
                count++;
            }
        }

        // Create array of matching tokens
        address[] memory matchingTokens = new address[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allTokens.length; i++) {
            if (
                tokenRegistry[allTokens[i]].active &&
                keccak256(bytes(tokenRegistry[allTokens[i]].assetType)) == keccak256(bytes(assetType))
            ) {
                matchingTokens[index] = allTokens[i];
                index++;
            }
        }

        return matchingTokens;
    }

    /**
     * @dev Get tokens created by a specific address
     * @param creator Creator address
     * @return Array of token addresses
     */
    function getTokensByCreator(address creator) external view returns (address[] memory) {
        uint256 count = 0;
        
        // Count tokens by creator
        for (uint256 i = 0; i < allTokens.length; i++) {
            if (tokenRegistry[allTokens[i]].creator == creator) {
                count++;
            }
        }

        // Create array of creator's tokens
        address[] memory creatorTokens = new address[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allTokens.length; i++) {
            if (tokenRegistry[allTokens[i]].creator == creator) {
                creatorTokens[index] = allTokens[i];
                index++;
            }
        }

        return creatorTokens;
    }

    /**
     * @dev Get total number of tokens
     * @return Total token count
     */
    function getTotalTokenCount() external view returns (uint256) {
        return allTokens.length;
    }

    /**
     * @dev Check if a token is registered and active
     * @param tokenAddress Token address to check
     * @return True if token is registered and active
     */
    function isActiveToken(address tokenAddress) external view returns (bool) {
        return tokenRegistry[tokenAddress].tokenAddress != address(0) && 
               tokenRegistry[tokenAddress].active;
    }
}