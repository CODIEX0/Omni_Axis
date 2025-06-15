// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title AssetTokenFactory
 * @dev Factory contract for creating and managing asset tokens
 */
contract AssetTokenFactory is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");

    address public kycContract;
    
    struct AssetInfo {
        string name;
        string symbol;
        address tokenAddress;
        address issuer;
        uint256 totalSupply;
        uint256 createdAt;
        bool isActive;
        string metadataURI;
    }

    mapping(bytes32 => AssetInfo) public assets;
    mapping(address => bytes32[]) public issuerAssets;
    bytes32[] public allAssets;
    
    uint256 public creationFee = 0.1 ether;
    address public feeRecipient;

    event AssetTokenCreated(
        bytes32 indexed assetId,
        address indexed tokenAddress,
        address indexed issuer,
        string name,
        string symbol
    );

    event AssetStatusUpdated(bytes32 indexed assetId, bool isActive);

    constructor(address _kycContract, address _feeRecipient) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(COMPLIANCE_ROLE, msg.sender);
        
        kycContract = _kycContract;
        feeRecipient = _feeRecipient;
    }

    function createAssetToken(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        string memory metadataURI
    ) external payable nonReentrant whenNotPaused {
        require(msg.value >= creationFee, "AssetTokenFactory: Insufficient fee");
        require(bytes(name).length > 0, "AssetTokenFactory: Name required");
        require(bytes(symbol).length > 0, "AssetTokenFactory: Symbol required");
        require(initialSupply > 0, "AssetTokenFactory: Initial supply must be positive");

        bytes32 assetId = keccak256(abi.encodePacked(name, symbol, msg.sender, block.timestamp));
        require(assets[assetId].tokenAddress == address(0), "AssetTokenFactory: Asset already exists");

        // For now, we'll store the asset info without creating the actual token
        // In a full implementation, you would deploy a new AssetToken contract here
        
        assets[assetId] = AssetInfo({
            name: name,
            symbol: symbol,
            tokenAddress: address(0), // Placeholder
            issuer: msg.sender,
            totalSupply: initialSupply,
            createdAt: block.timestamp,
            isActive: true,
            metadataURI: metadataURI
        });

        // Update mappings
        issuerAssets[msg.sender].push(assetId);
        allAssets.push(assetId);

        // Transfer creation fee
        payable(feeRecipient).transfer(msg.value);

        emit AssetTokenCreated(assetId, address(0), msg.sender, name, symbol);
    }

    function setAssetStatus(bytes32 assetId, bool isActive) external onlyRole(COMPLIANCE_ROLE) {
        require(assets[assetId].issuer != address(0), "AssetTokenFactory: Asset not found");
        assets[assetId].isActive = isActive;
        emit AssetStatusUpdated(assetId, isActive);
    }

    function updateCreationFee(uint256 newFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        creationFee = newFee;
    }

    function updateFeeRecipient(address newRecipient) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newRecipient != address(0), "AssetTokenFactory: Invalid address");
        feeRecipient = newRecipient;
    }

    function getAssetsByIssuer(address issuer) external view returns (bytes32[] memory) {
        return issuerAssets[issuer];
    }

    function getAllAssets() external view returns (bytes32[] memory) {
        return allAssets;
    }

    function getAssetInfo(bytes32 assetId) external view returns (AssetInfo memory) {
        return assets[assetId];
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // Emergency withdrawal
    function emergencyWithdraw() external onlyRole(DEFAULT_ADMIN_ROLE) {
        payable(msg.sender).transfer(address(this).balance);
    }
}
