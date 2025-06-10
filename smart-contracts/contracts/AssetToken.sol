// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title AssetToken
 * @dev ERC20 token representing fractional ownership of real-world assets
 * Features:
 * - Upgradeable contract using UUPS pattern
 * - Role-based access control
 * - Pausable functionality for emergency stops
 * - Dividend distribution mechanism
 * - Asset metadata storage
 */
contract AssetToken is 
    Initializable, 
    ERC20Upgradeable, 
    ERC20PausableUpgradeable, 
    AccessControlUpgradeable, 
    UUPSUpgradeable 
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant ASSET_MANAGER_ROLE = keccak256("ASSET_MANAGER_ROLE");

    struct AssetMetadata {
        string name;
        string description;
        string assetType; // real-estate, art, commodities, luxury
        string location;
        uint256 totalValue; // Total asset value in USD (scaled by 1e18)
        string ipfsHash; // IPFS hash for additional metadata and documents
        uint256 createdAt;
        bool verified;
    }

    struct DividendInfo {
        uint256 totalDividends;
        uint256 lastDividendPerToken;
        mapping(address => uint256) lastClaimedDividendPerToken;
        mapping(address => uint256) pendingDividends;
    }

    AssetMetadata public assetMetadata;
    DividendInfo public dividendInfo;
    
    uint256 public constant DIVIDEND_PRECISION = 1e18;
    
    // Events
    event AssetMetadataUpdated(string ipfsHash);
    event AssetVerified(bool verified);
    event DividendDistributed(uint256 amount, uint256 dividendPerToken);
    event DividendClaimed(address indexed holder, uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        address owner,
        AssetMetadata memory _assetMetadata
    ) public initializer {
        __ERC20_init(name, symbol);
        __ERC20Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, owner);
        _grantRole(MINTER_ROLE, owner);
        _grantRole(PAUSER_ROLE, owner);
        _grantRole(UPGRADER_ROLE, owner);
        _grantRole(ASSET_MANAGER_ROLE, owner);

        assetMetadata = _assetMetadata;
        assetMetadata.createdAt = block.timestamp;
        
        _mint(owner, totalSupply);
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function updateAssetMetadata(
        string memory ipfsHash
    ) public onlyRole(ASSET_MANAGER_ROLE) {
        assetMetadata.ipfsHash = ipfsHash;
        emit AssetMetadataUpdated(ipfsHash);
    }

    function verifyAsset(bool verified) public onlyRole(ASSET_MANAGER_ROLE) {
        assetMetadata.verified = verified;
        emit AssetVerified(verified);
    }

    /**
     * @dev Distribute dividends to all token holders
     * @param amount Total dividend amount to distribute
     */
    function distributeDividend(uint256 amount) external payable onlyRole(ASSET_MANAGER_ROLE) {
        require(amount > 0, "Dividend amount must be greater than 0");
        require(msg.value >= amount, "Insufficient ETH sent");
        
        uint256 totalSupply_ = totalSupply();
        require(totalSupply_ > 0, "No tokens in circulation");

        uint256 dividendPerToken = (amount * DIVIDEND_PRECISION) / totalSupply_;
        dividendInfo.lastDividendPerToken += dividendPerToken;
        dividendInfo.totalDividends += amount;

        emit DividendDistributed(amount, dividendPerToken);
    }

    /**
     * @dev Calculate pending dividends for a token holder
     * @param holder Address of the token holder
     * @return Pending dividend amount
     */
    function pendingDividends(address holder) public view returns (uint256) {
        uint256 balance = balanceOf(holder);
        if (balance == 0) return 0;

        uint256 lastClaimed = dividendInfo.lastClaimedDividendPerToken[holder];
        uint256 newDividendPerToken = dividendInfo.lastDividendPerToken - lastClaimed;
        
        return (balance * newDividendPerToken) / DIVIDEND_PRECISION + 
               dividendInfo.pendingDividends[holder];
    }

    /**
     * @dev Claim pending dividends
     */
    function claimDividends() external {
        uint256 pending = pendingDividends(msg.sender);
        require(pending > 0, "No dividends to claim");

        dividendInfo.lastClaimedDividendPerToken[msg.sender] = dividendInfo.lastDividendPerToken;
        dividendInfo.pendingDividends[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: pending}("");
        require(success, "Dividend transfer failed");

        emit DividendClaimed(msg.sender, pending);
    }

    /**
     * @dev Update pending dividends when tokens are transferred
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20Upgradeable, ERC20PausableUpgradeable) {
        super._beforeTokenTransfer(from, to, amount);

        // Update pending dividends for both sender and receiver
        if (from != address(0)) {
            dividendInfo.pendingDividends[from] = pendingDividends(from);
            dividendInfo.lastClaimedDividendPerToken[from] = dividendInfo.lastDividendPerToken;
        }
        
        if (to != address(0)) {
            dividendInfo.pendingDividends[to] = pendingDividends(to);
            dividendInfo.lastClaimedDividendPerToken[to] = dividendInfo.lastDividendPerToken;
        }
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(UPGRADER_ROLE)
        override
    {}

    // View functions for asset metadata
    function getAssetMetadata() external view returns (AssetMetadata memory) {
        return assetMetadata;
    }

    function getDividendInfo() external view returns (
        uint256 totalDividends,
        uint256 lastDividendPerToken
    ) {
        return (
            dividendInfo.totalDividends,
            dividendInfo.lastDividendPerToken
        );
    }

    // Required override for AccessControl
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}