// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title DecentralizedKYC
 * @dev Decentralized KYC/AML service with privacy-preserving identity verification
 * Integrates with open-source identity verification systems
 */
contract DecentralizedKYC is AccessControl, ReentrancyGuard, Pausable, EIP712 {
    using ECDSA for bytes32;

    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");
    bytes32 public constant REGULATOR_ROLE = keccak256("REGULATOR_ROLE");

    // KYC status levels
    enum KYCLevel { NONE, BASIC, ENHANCED, INSTITUTIONAL }
    enum AMLRisk { NONE, LOW, MEDIUM, HIGH, CRITICAL }

    struct KYCRecord {
        KYCLevel level;
        AMLRisk riskRating;
        uint256 verifiedAt;
        uint256 expiresAt;
        address verifier;
        string ipfsHash; // Encrypted document hash on IPFS
        bool isActive;
        mapping(string => bool) jurisdictions; // Approved jurisdictions
    }

    struct Verifier {
        bool isActive;
        string name;
        string licenseNumber;
        string[] supportedJurisdictions;
        uint256 totalVerifications;
        uint256 reputationScore; // Out of 1000
    }

    // Storage
    mapping(address => KYCRecord) public kycRecords;
    mapping(address => Verifier) public verifiers;
    mapping(address => bool) public blacklistedAddresses;
    mapping(string => address[]) public jurisdictionUsers; // jurisdiction => users
    
    address[] public allVerifiedUsers;
    address[] public allVerifiers;

    // Privacy settings
    mapping(address => bool) public privacyOptOut; // Users can opt out of data sharing
    mapping(address => mapping(address => bool)) public dataAccessPermissions;

    // EIP712 for signature verification
    bytes32 private constant VERIFY_TYPEHASH = keccak256("Verify(address user,uint8 level,uint8 risk,uint256 expiresAt,string jurisdiction,string ipfsHash,uint256 nonce)");
    mapping(address => uint256) public nonces;

    // Events
    event KYCVerified(
        address indexed user,
        KYCLevel level,
        AMLRisk riskRating,
        address indexed verifier,
        uint256 expiresAt
    );
    
    event KYCUpdated(
        address indexed user,
        KYCLevel oldLevel,
        KYCLevel newLevel,
        AMLRisk oldRisk,
        AMLRisk newRisk
    );
    
    event KYCRevoked(address indexed user, address indexed revoker, string reason);
    event VerifierRegistered(address indexed verifier, string name);
    event VerifierDeactivated(address indexed verifier);
    event AddressBlacklisted(address indexed addr, string reason);
    event JurisdictionApproved(address indexed user, string jurisdiction);

    constructor(string memory name, string memory version) EIP712(name, version) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGULATOR_ROLE, msg.sender);
        _grantRole(COMPLIANCE_ROLE, msg.sender);
    }

    /**
     * @dev Register a new KYC verifier
     */
    function registerVerifier(
        address verifierAddr,
        string memory name,
        string memory licenseNumber,
        string[] memory supportedJurisdictions
    ) external onlyRole(REGULATOR_ROLE) {
        require(verifierAddr != address(0), "Invalid verifier address");
        require(!verifiers[verifierAddr].isActive, "Verifier already registered");

        Verifier storage verifier = verifiers[verifierAddr];
        verifier.isActive = true;
        verifier.name = name;
        verifier.licenseNumber = licenseNumber;
        verifier.supportedJurisdictions = supportedJurisdictions;
        verifier.reputationScore = 500; // Start with neutral reputation

        allVerifiers.push(verifierAddr);
        _grantRole(VERIFIER_ROLE, verifierAddr);

        emit VerifierRegistered(verifierAddr, name);
    }

    /**
     * @dev Verify KYC for a user with signature-based verification
     */
    function verifyKYC(
        address user,
        KYCLevel level,
        AMLRisk riskRating,
        uint256 expiresAt,
        string memory jurisdiction,
        string memory ipfsHash,
        bytes memory signature
    ) external onlyRole(VERIFIER_ROLE) whenNotPaused {
        require(user != address(0), "Invalid user address");
        require(verifiers[msg.sender].isActive, "Verifier not active");
        require(expiresAt > block.timestamp, "Invalid expiration date");
        require(!blacklistedAddresses[user], "User is blacklisted");

        // Verify signature
        bytes32 structHash = keccak256(
            abi.encode(
                VERIFY_TYPEHASH,
                user,
                uint8(level),
                uint8(riskRating),
                expiresAt,
                keccak256(bytes(jurisdiction)),
                keccak256(bytes(ipfsHash)),
                nonces[user]
            )
        );
        
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);
        require(signer == user, "Invalid signature");

        nonces[user]++;

        KYCRecord storage record = kycRecords[user];
        KYCLevel oldLevel = record.level;
        AMLRisk oldRisk = record.riskRating;

        // Update KYC record
        record.level = level;
        record.riskRating = riskRating;
        record.verifiedAt = block.timestamp;
        record.expiresAt = expiresAt;
        record.verifier = msg.sender;
        record.ipfsHash = ipfsHash;
        record.isActive = true;
        record.jurisdictions[jurisdiction] = true;

        // Add to jurisdiction mapping
        jurisdictionUsers[jurisdiction].push(user);

        // Add to verified users if first time
        if (oldLevel == KYCLevel.NONE) {
            allVerifiedUsers.push(user);
        }

        // Update verifier stats
        verifiers[msg.sender].totalVerifications++;

        emit KYCVerified(user, level, riskRating, msg.sender, expiresAt);
        
        if (oldLevel != level || oldRisk != riskRating) {
            emit KYCUpdated(user, oldLevel, level, oldRisk, riskRating);
        }

        emit JurisdictionApproved(user, jurisdiction);
    }

    /**
     * @dev Revoke KYC for a user
     */
    function revokeKYC(address user, string memory reason) external {
        require(
            hasRole(COMPLIANCE_ROLE, msg.sender) || 
            hasRole(REGULATOR_ROLE, msg.sender) ||
            kycRecords[user].verifier == msg.sender,
            "Unauthorized to revoke KYC"
        );

        kycRecords[user].isActive = false;
        emit KYCRevoked(user, msg.sender, reason);
    }

    /**
     * @dev Blacklist an address
     */
    function blacklistAddress(address addr, string memory reason) external onlyRole(COMPLIANCE_ROLE) {
        blacklistedAddresses[addr] = true;
        kycRecords[addr].isActive = false;
        emit AddressBlacklisted(addr, reason);
    }

    /**
     * @dev Check if user is KYC verified and compliant
     */
    function isKYCVerified(address user) external view returns (bool) {
        KYCRecord storage record = kycRecords[user];
        return record.isActive && 
               record.expiresAt > block.timestamp && 
               !blacklistedAddresses[user] &&
               record.level != KYCLevel.NONE;
    }

    /**
     * @dev Check if user meets minimum KYC level
     */
    function meetsKYCLevel(address user, KYCLevel requiredLevel) external view returns (bool) {
        KYCRecord storage record = kycRecords[user];
        return record.isActive && 
               record.expiresAt > block.timestamp && 
               !blacklistedAddresses[user] &&
               record.level >= requiredLevel;
    }

    /**
     * @dev Check AML risk level
     */
    function getAMLRisk(address user) external view returns (AMLRisk) {
        return kycRecords[user].riskRating;
    }

    /**
     * @dev Check if user is approved for jurisdiction
     */
    function isApprovedForJurisdiction(address user, string memory jurisdiction) external view returns (bool) {
        return kycRecords[user].jurisdictions[jurisdiction];
    }

    /**
     * @dev Get KYC record information (respecting privacy settings)
     */
    function getKYCRecord(address user) external view returns (
        KYCLevel level,
        AMLRisk riskRating,
        uint256 verifiedAt,
        uint256 expiresAt,
        address verifier,
        bool isActive
    ) {
        require(
            msg.sender == user || 
            hasRole(COMPLIANCE_ROLE, msg.sender) ||
            hasRole(REGULATOR_ROLE, msg.sender) ||
            dataAccessPermissions[user][msg.sender],
            "Unauthorized access to KYC data"
        );

        KYCRecord storage record = kycRecords[user];
        return (
            record.level,
            record.riskRating,
            record.verifiedAt,
            record.expiresAt,
            record.verifier,
            record.isActive
        );
    }

    /**
     * @dev Grant data access permission to another address
     */
    function grantDataAccess(address accessor) external {
        dataAccessPermissions[msg.sender][accessor] = true;
    }

    /**
     * @dev Revoke data access permission
     */
    function revokeDataAccess(address accessor) external {
        dataAccessPermissions[msg.sender][accessor] = false;
    }

    /**
     * @dev Set privacy opt-out status
     */
    function setPrivacyOptOut(bool optOut) external {
        privacyOptOut[msg.sender] = optOut;
    }

    /**
     * @dev Get verifier information
     */
    function getVerifier(address verifierAddr) external view returns (Verifier memory) {
        return verifiers[verifierAddr];
    }

    /**
     * @dev Get all verified users count
     */
    function getVerifiedUsersCount() external view returns (uint256) {
        return allVerifiedUsers.length;
    }

    /**
     * @dev Get users by jurisdiction (only for authorized entities)
     */
    function getUsersByJurisdiction(string memory jurisdiction) external view onlyRole(REGULATOR_ROLE) returns (address[] memory) {
        return jurisdictionUsers[jurisdiction];
    }

    /**
     * @dev Emergency pause
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Update verifier reputation score
     */
    function updateVerifierReputation(address verifierAddr, uint256 newScore) external onlyRole(REGULATOR_ROLE) {
        require(newScore <= 1000, "Score must be <= 1000");
        verifiers[verifierAddr].reputationScore = newScore;
    }

    /**
     * @dev Deactivate verifier
     */
    function deactivateVerifier(address verifierAddr) external onlyRole(REGULATOR_ROLE) {
        verifiers[verifierAddr].isActive = false;
        emit VerifierDeactivated(verifierAddr);
    }

    /**
     * @dev Admin function to set KYC status directly (for testing)
     */
    function adminSetKYC(
        address user,
        KYCLevel level,
        AMLRisk riskRating,
        uint256 expiresAt,
        string memory jurisdiction,
        string memory ipfsHash
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(user != address(0), "Invalid user address");
        require(expiresAt > block.timestamp, "Invalid expiration date");

        KYCRecord storage record = kycRecords[user];
        KYCLevel oldLevel = record.level;

        // Update KYC record
        record.level = level;
        record.riskRating = riskRating;
        record.verifiedAt = block.timestamp;
        record.expiresAt = expiresAt;
        record.verifier = msg.sender;
        record.ipfsHash = ipfsHash;
        record.isActive = true;
        record.jurisdictions[jurisdiction] = true;

        // Add to jurisdiction mapping
        jurisdictionUsers[jurisdiction].push(user);

        // Add to verified users if first time
        if (oldLevel == KYCLevel.NONE) {
            allVerifiedUsers.push(user);
        }

        emit KYCVerified(user, level, riskRating, msg.sender, expiresAt);
        emit JurisdictionApproved(user, jurisdiction);
    }
}
