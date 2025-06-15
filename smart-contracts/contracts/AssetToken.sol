// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title AssetToken
 * @dev Simple ERC20 token for representing real-world assets
 */
contract AssetToken is ERC20, AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");

    address public kycContract;
    address public complianceOfficer;
    
    mapping(address => bool) public kycVerified;
    mapping(address => uint256) public kycExpirationDate;

    event KYCStatusUpdated(address indexed user, bool verified, uint256 expirationDate);

    constructor(
        string memory name,
        string memory symbol,
        address _issuer,
        address _kycContract,
        address _complianceOfficer
    ) ERC20(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ISSUER_ROLE, _issuer);
        _grantRole(COMPLIANCE_ROLE, _complianceOfficer);
        
        kycContract = _kycContract;
        complianceOfficer = _complianceOfficer;
        
        // Pre-approve issuer for KYC to allow initial minting
        kycVerified[_issuer] = true;
        kycExpirationDate[_issuer] = block.timestamp + (365 * 24 * 60 * 60); // 1 year
        
        // Mint initial supply to issuer
        _mint(_issuer, 1000000 * 10**decimals());
    }

    modifier onlyKYCVerified(address user) {
        require(
            kycVerified[user] && kycExpirationDate[user] > block.timestamp,
            "AssetToken: user not KYC verified"
        );
        _;
    }

    function setKYCStatus(
        address user,
        bool verified,
        uint256 expirationDate
    ) external onlyRole(COMPLIANCE_ROLE) {
        kycVerified[user] = verified;
        kycExpirationDate[user] = expirationDate;
        emit KYCStatusUpdated(user, verified, expirationDate);
    }

    function mint(
        address to,
        uint256 amount
    ) external onlyRole(ISSUER_ROLE) onlyKYCVerified(to) {
        _mint(to, amount);
    }

    function _update(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        // Skip checks for minting/burning
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

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
