// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title AssetToken
 * @dev ERC20 compliant security token for real-world asset tokenization
 * Supports role-based access control, compliance features, and asset management
 */
contract AssetToken is ERC20, AccessControl, ReentrancyGuard, Pausable {

    // Role definitions
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant REGULATOR_ROLE = keccak256("REGULATOR_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");

    // Asset metadata structure
    struct AssetMetadata {
        string assetType; // "real-estate", "invoice", "bond", etc.
        string description;
        string location;
        uint256 totalValue; // Asset valuation in USD (with 18 decimals)
        uint256 createdAt;
        string ipfsHash; // IPFS hash for asset documentation
        bool verified; // Regulatory verification status
        address verifier; // Address of the verifying regulator
        address issuer; // Address of the asset issuer
    }

    // Asset tracking
    mapping(uint256 => AssetMetadata) public assets;
    mapping(address => bool) public kycVerified;
    mapping(address => uint256) public kycExpirationDate;
    mapping(uint256 => uint256) public assetTokenSupply; // Asset ID to token supply
    
    uint256 private _nextAssetId = 1;
    
    // Events
    event AssetTokenized(
        uint256 indexed assetId,
        address indexed issuer,
        uint256 totalTokens,
        string assetType
    );
    
    event KYCVerified(address indexed user, uint256 expirationDate);
    event KYCRevoked(address indexed user);
    event AssetVerified(uint256 indexed assetId, address indexed verifier);
    
    // Compliance events
    event TransferRestricted(address indexed from, address indexed to, uint256 amount, string reason);
    event ComplianceRuleUpdated(string rule, bool status);

    // Modifiers
    modifier onlyKYCVerified(address account) {
        require(
            kycVerified[account] && kycExpirationDate[account] > block.timestamp,
            "AssetToken: account not KYC verified or expired"
        );
        _;
    }

    constructor(
        string memory name,
        string memory symbol,
        address admin
    ) ERC20(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        
        // Add initial roles
        _grantRole(ISSUER_ROLE, admin);
        _grantRole(REGULATOR_ROLE, admin);
        _grantRole(COMPLIANCE_ROLE, admin);
    }

    /**
     * @dev Tokenize a new asset
     * @param to Recipient of the asset tokens
     * @param assetMetadata Metadata describing the asset
     * @param tokenAmount Number of tokens to mint for this asset
     */
    function tokenizeAsset(
        address to,
        AssetMetadata memory assetMetadata,
        uint256 tokenAmount
    ) external onlyRole(ISSUER_ROLE) onlyKYCVerified(to) whenNotPaused returns (uint256) {
        require(tokenAmount > 0, "AssetToken: token amount must be greater than 0");
        require(bytes(assetMetadata.assetType).length > 0, "AssetToken: asset type required");
        
        uint256 assetId = _nextAssetId++;
        
        // Store asset metadata
        assetMetadata.createdAt = block.timestamp;
        assetMetadata.issuer = msg.sender;
        assets[assetId] = assetMetadata;
        assetTokenSupply[assetId] = tokenAmount;
        
        // Mint tokens to the specified address
        _mint(to, tokenAmount);
        
        emit AssetTokenized(assetId, msg.sender, tokenAmount, assetMetadata.assetType);
        
        return assetId;
    }

    /**
     * @dev Verify KYC for a user
     * @param user Address to verify
     * @param expirationDate KYC expiration timestamp
     */
    function verifyKYC(address user, uint256 expirationDate) external onlyRole(COMPLIANCE_ROLE) {
        require(user != address(0), "AssetToken: invalid user address");
        require(expirationDate > block.timestamp, "AssetToken: expiration date must be in future");
        
        kycVerified[user] = true;
        kycExpirationDate[user] = expirationDate;
        
        emit KYCVerified(user, expirationDate);
    }

    /**
     * @dev Revoke KYC for a user
     * @param user Address to revoke KYC
     */
    function revokeKYC(address user) external onlyRole(COMPLIANCE_ROLE) {
        kycVerified[user] = false;
        kycExpirationDate[user] = 0;
        
        emit KYCRevoked(user);
    }

    /**
     * @dev Verify an asset by a regulator
     * @param assetId Asset ID to verify
     */
    function verifyAsset(uint256 assetId) external onlyRole(REGULATOR_ROLE) {
        require(assetId < _nextAssetId, "AssetToken: asset does not exist");
        
        assets[assetId].verified = true;
        assets[assetId].verifier = msg.sender;
        
        emit AssetVerified(assetId, msg.sender);
    }

    /**
     * @dev Get asset metadata
     * @param assetId Asset ID to query
     */
    function getAssetMetadata(uint256 assetId) external view returns (AssetMetadata memory) {
        require(assetId < _nextAssetId, "AssetToken: asset does not exist");
        return assets[assetId];
    }

    /**
     * @dev Get current asset count
     */
    function getAssetCount() external view returns (uint256) {
        return _nextAssetId - 1;
    }

    /**
     * @dev Override update to include KYC and compliance checks
     */
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        // Skip checks for minting (from == address(0))
        if (from != address(0)) {
            require(
                kycVerified[from] && kycExpirationDate[from] > block.timestamp,
                "AssetToken: sender not KYC verified"
            );
        }
        
        if (to != address(0)) {
            require(
                kycVerified[to] && kycExpirationDate[to] > block.timestamp,
                "AssetToken: recipient not KYC verified"
            );
        }

        super._update(from, to, amount);
    }

    /**
     * @dev Pause all token transfers (emergency function)
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause all token transfers
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Emergency function to force transfer (for regulatory compliance)
     * @param from Source address
     * @param to Destination address
     * @param amount Amount to transfer
     */
    function forceTransfer(
        address from,
        address to,
        uint256 amount
    ) external onlyRole(REGULATOR_ROLE) {
        _transfer(from, to, amount);
    }

    /**
     * @dev Check if address has issuer role
     * @param account Address to check
     */
    function isIssuer(address account) external view returns (bool) {
        return hasRole(ISSUER_ROLE, account);
    }

    /**
     * @dev Check if address has regulator role
     * @param account Address to check
     */
    function isRegulator(address account) external view returns (bool) {
        return hasRole(REGULATOR_ROLE, account);
    }

    /**
     * @dev Check if address has compliance officer role
     * @param account Address to check
     */
    function isComplianceOfficer(address account) external view returns (bool) {
        return hasRole(COMPLIANCE_ROLE, account);
    }
}
