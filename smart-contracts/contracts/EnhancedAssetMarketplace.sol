// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./DecentralizedKYC.sol";
import "./ChainlinkPriceOracle.sol";

/**
 * @title EnhancedAssetMarketplace
 * @dev Enhanced marketplace for trading tokenized assets with price oracle integration
 */
contract EnhancedAssetMarketplace is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public constant MARKET_ADMIN_ROLE = keccak256("MARKET_ADMIN_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");

    DecentralizedKYC public kycContract;
    ChainlinkPriceOracle public priceOracle;

    enum ListingType { FIXED_PRICE, AUCTION, DUTCH_AUCTION }
    enum ListingStatus { ACTIVE, SOLD, CANCELLED, EXPIRED }

    struct Listing {
        uint256 listingId;
        address seller;
        address tokenContract;
        uint256 amount;
        uint256 pricePerToken;
        ListingType listingType;
        ListingStatus status;
        uint256 startTime;
        uint256 endTime;
        uint256 minBidIncrement;
        address highestBidder;
        uint256 highestBid;
        bool requiresKYC;
        string metadataURI;
    }

    struct Bid {
        address bidder;
        uint256 amount;
        uint256 timestamp;
    }

    struct Escrow {
        uint256 amount;
        address buyer;
        address seller;
        bool completed;
        uint256 createdAt;
        uint256 releaseTime;
    }

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Bid[]) public listingBids;
    mapping(uint256 => Escrow) public escrows;
    mapping(address => uint256[]) public userListings;
    mapping(address => uint256[]) public userBids;

    uint256 public nextListingId = 1;
    uint256 public nextEscrowId = 1;

    // Platform fee (in basis points, e.g., 250 = 2.5%)
    uint256 public platformFeeRate = 250;
    address public feeRecipient;

    // Trading limits
    uint256 public minListingDuration = 1 hours;
    uint256 public maxListingDuration = 30 days;
    uint256 public escrowTimeout = 7 days;

    event ListingCreated(
        uint256 indexed listingId,
        address indexed seller,
        address indexed tokenContract,
        uint256 amount,
        uint256 pricePerToken,
        ListingType listingType
    );

    event BidPlaced(
        uint256 indexed listingId,
        address indexed bidder,
        uint256 amount
    );

    event ListingSold(
        uint256 indexed listingId,
        address indexed buyer,
        uint256 totalPrice
    );

    event ListingCancelled(uint256 indexed listingId);
    event EscrowCreated(uint256 indexed escrowId, address buyer, address seller, uint256 amount);
    event EscrowReleased(uint256 indexed escrowId);

    constructor(address admin, address _feeRecipient) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MARKET_ADMIN_ROLE, admin);
        _grantRole(COMPLIANCE_ROLE, admin);
        feeRecipient = _feeRecipient;
    }

    function setKYCContract(address _kycContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        kycContract = DecentralizedKYC(_kycContract);
    }

    function setPriceOracle(address _priceOracle) external onlyRole(DEFAULT_ADMIN_ROLE) {
        priceOracle = ChainlinkPriceOracle(_priceOracle);
    }

    modifier onlyKYCVerified(address user) {
        require(address(kycContract) != address(0), "KYC contract not set");
        require(kycContract.isKYCVerified(user), "AssetMarketplace: User not KYC verified");
        _;
    }

    function createListing(
        address tokenContract,
        uint256 amount,
        uint256 pricePerToken,
        ListingType listingType,
        uint256 duration,
        uint256 minBidIncrement,
        bool requiresKYC,
        string memory metadataURI
    ) external onlyKYCVerified(msg.sender) nonReentrant whenNotPaused {
        require(tokenContract != address(0), "Invalid token contract");
        require(amount > 0, "Amount must be positive");
        require(pricePerToken > 0, "Price must be positive");
        require(duration >= minListingDuration && duration <= maxListingDuration, "Invalid duration");

        IERC20 token = IERC20(tokenContract);
        require(token.balanceOf(msg.sender) >= amount, "Insufficient token balance");
        require(token.allowance(msg.sender, address(this)) >= amount, "Insufficient allowance");

        uint256 listingId = nextListingId++;
        uint256 endTime = block.timestamp + duration;

        listings[listingId] = Listing({
            listingId: listingId,
            seller: msg.sender,
            tokenContract: tokenContract,
            amount: amount,
            pricePerToken: pricePerToken,
            listingType: listingType,
            status: ListingStatus.ACTIVE,
            startTime: block.timestamp,
            endTime: endTime,
            minBidIncrement: minBidIncrement,
            highestBidder: address(0),
            highestBid: 0,
            requiresKYC: requiresKYC,
            metadataURI: metadataURI
        });

        userListings[msg.sender].push(listingId);

        // Lock tokens in escrow
        token.safeTransferFrom(msg.sender, address(this), amount);

        emit ListingCreated(listingId, msg.sender, tokenContract, amount, pricePerToken, listingType);
    }

    function buyFixedPrice(uint256 listingId) external payable nonReentrant whenNotPaused {
        Listing storage listing = listings[listingId];
        require(listing.status == ListingStatus.ACTIVE, "Listing not active");
        require(listing.listingType == ListingType.FIXED_PRICE, "Not a fixed price listing");
        require(block.timestamp <= listing.endTime, "Listing expired");
        
        if (listing.requiresKYC && address(kycContract) != address(0)) {
            require(kycContract.isKYCVerified(msg.sender), "Buyer not KYC verified");
        }

        uint256 totalPrice = listing.amount * listing.pricePerToken;
        require(msg.value >= totalPrice, "Insufficient payment");

        // Calculate platform fee
        uint256 platformFee = (totalPrice * platformFeeRate) / 10000;
        uint256 sellerAmount = totalPrice - platformFee;

        listing.status = ListingStatus.SOLD;
        listing.highestBidder = msg.sender;
        listing.highestBid = totalPrice;

        _completeSale(listingId, msg.sender, totalPrice, sellerAmount, platformFee);

        // Refund excess payment
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }
    }

    function placeBid(uint256 listingId) external payable nonReentrant whenNotPaused {
        Listing storage listing = listings[listingId];
        require(listing.status == ListingStatus.ACTIVE, "Listing not active");
        require(listing.listingType == ListingType.AUCTION, "Not an auction listing");
        require(block.timestamp <= listing.endTime, "Auction ended");
        require(msg.sender != listing.seller, "Cannot bid on own listing");
        
        if (listing.requiresKYC && address(kycContract) != address(0)) {
            require(kycContract.isKYCVerified(msg.sender), "Bidder not KYC verified");
        }

        uint256 minBid = listing.highestBid + listing.minBidIncrement;
        if (listing.highestBid == 0) {
            minBid = listing.pricePerToken * listing.amount;
        }
        
        require(msg.value >= minBid, "Bid too low");

        // Refund previous highest bidder
        if (listing.highestBidder != address(0)) {
            payable(listing.highestBidder).transfer(listing.highestBid);
        }

        listing.highestBidder = msg.sender;
        listing.highestBid = msg.value;

        listingBids[listingId].push(Bid({
            bidder: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp
        }));

        userBids[msg.sender].push(listingId);

        emit BidPlaced(listingId, msg.sender, msg.value);
    }

    function finalizeAuction(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.status == ListingStatus.ACTIVE, "Listing not active");
        require(listing.listingType == ListingType.AUCTION, "Not an auction");
        require(block.timestamp > listing.endTime, "Auction still active");
        
        if (listing.highestBidder != address(0)) {
            uint256 totalPrice = listing.highestBid;
            uint256 platformFee = (totalPrice * platformFeeRate) / 10000;
            uint256 sellerAmount = totalPrice - platformFee;
            
            listing.status = ListingStatus.SOLD;
            _completeSale(listingId, listing.highestBidder, totalPrice, sellerAmount, platformFee);
        } else {
            // No bids, return tokens to seller
            listing.status = ListingStatus.EXPIRED;
            IERC20(listing.tokenContract).safeTransfer(listing.seller, listing.amount);
        }
    }

    function _completeSale(
        uint256 listingId,
        address buyer,
        uint256 totalPrice,
        uint256 sellerAmount,
        uint256 platformFee
    ) internal {
        Listing storage listing = listings[listingId];
        
        // Transfer tokens to buyer
        IERC20(listing.tokenContract).safeTransfer(buyer, listing.amount);
        
        // Transfer payment to seller
        payable(listing.seller).transfer(sellerAmount);
        
        // Transfer platform fee
        payable(feeRecipient).transfer(platformFee);
        
        emit ListingSold(listingId, buyer, totalPrice);
    }

    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender || hasRole(MARKET_ADMIN_ROLE, msg.sender), "Unauthorized");
        require(listing.status == ListingStatus.ACTIVE, "Listing not active");
        
        if (listing.listingType == ListingType.AUCTION && listing.highestBidder != address(0)) {
            // Refund highest bidder
            payable(listing.highestBidder).transfer(listing.highestBid);
        }
        
        listing.status = ListingStatus.CANCELLED;
        
        // Return tokens to seller
        IERC20(listing.tokenContract).safeTransfer(listing.seller, listing.amount);
        
        emit ListingCancelled(listingId);
    }

    // View functions
    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }

    function getListingBids(uint256 listingId) external view returns (Bid[] memory) {
        return listingBids[listingId];
    }

    function getUserListings(address user) external view returns (uint256[] memory) {
        return userListings[user];
    }

    function getUserBids(address user) external view returns (uint256[] memory) {
        return userBids[user];
    }

    // Admin functions
    function updatePlatformFee(uint256 newFeeRate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newFeeRate <= 1000, "Fee too high"); // Max 10%
        platformFeeRate = newFeeRate;
    }

    function updateFeeRecipient(address newRecipient) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newRecipient != address(0), "Invalid address");
        feeRecipient = newRecipient;
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
}
