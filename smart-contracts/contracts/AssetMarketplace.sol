// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title AssetMarketplace
 * @dev Decentralized marketplace for trading asset-backed tokens
 * Supports auctions, direct sales, and escrow functionality
 */
contract AssetMarketplace is ReentrancyGuard, AccessControl, Pausable {

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    // Listing types
    enum ListingType { FIXED_PRICE, AUCTION }
    enum ListingStatus { ACTIVE, SOLD, CANCELLED, EXPIRED }

    // Listing structure
    struct Listing {
        uint256 id;
        address seller;
        address tokenContract;
        uint256 tokenAmount;
        uint256 pricePerToken; // In wei
        ListingType listingType;
        ListingStatus status;
        uint256 startTime;
        uint256 endTime;
        uint256 highestBid;
        address highestBidder;
        bool escrowRequired;
        uint256 createdAt;
    }

    // Bid structure for auctions
    struct Bid {
        address bidder;
        uint256 amount;
        uint256 timestamp;
        bool withdrawn;
    }

    // Escrow structure
    struct Escrow {
        address buyer;
        address seller;
        uint256 amount;
        bool buyerConfirmed;
        bool sellerConfirmed;
        bool disputed;
        uint256 createdAt;
        uint256 timeoutAt;
    }

    uint256 private _nextListingId = 1;
    uint256 private _nextEscrowId = 1;

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Bid[]) public listingBids;
    mapping(uint256 => Escrow) public escrows;
    mapping(address => uint256[]) public userListings;
    mapping(address => uint256) public userBalances; // For bid withdrawals

    // Platform fee (in basis points, e.g., 250 = 2.5%)
    uint256 public platformFeeRate = 250;
    address public feeRecipient;

    // Events
    event ListingCreated(
        uint256 indexed listingId,
        address indexed seller,
        address indexed tokenContract,
        uint256 tokenAmount,
        uint256 pricePerToken,
        ListingType listingType
    );

    event ListingSold(
        uint256 indexed listingId,
        address indexed buyer,
        uint256 totalPrice
    );

    event BidPlaced(
        uint256 indexed listingId,
        address indexed bidder,
        uint256 bidAmount
    );

    event BidWithdrawn(
        uint256 indexed listingId,
        address indexed bidder,
        uint256 bidAmount
    );

    event EscrowCreated(
        uint256 indexed escrowId,
        uint256 indexed listingId,
        address buyer,
        address seller,
        uint256 amount
    );

    event EscrowConfirmed(
        uint256 indexed escrowId,
        address indexed confirmer,
        bool buyerConfirmed,
        bool sellerConfirmed
    );

    event EscrowReleased(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        uint256 amount
    );

    constructor(address admin, address _feeRecipient) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev Create a new asset listing
     * @param tokenContract Address of the asset token contract
     * @param tokenAmount Amount of tokens to sell
     * @param pricePerToken Price per token in wei
     * @param listingType Type of listing (fixed price or auction)
     * @param duration Duration of the listing in seconds
     * @param escrowRequired Whether escrow is required for this listing
     */
    function createListing(
        address tokenContract,
        uint256 tokenAmount,
        uint256 pricePerToken,
        ListingType listingType,
        uint256 duration,
        bool escrowRequired
    ) external whenNotPaused returns (uint256) {
        require(tokenContract != address(0), "Invalid token contract");
        require(tokenAmount > 0, "Token amount must be greater than 0");
        require(pricePerToken > 0, "Price must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");

        // Check if seller has enough tokens and approval
        IERC20 token = IERC20(tokenContract);
        require(token.balanceOf(msg.sender) >= tokenAmount, "Insufficient token balance");
        require(token.allowance(msg.sender, address(this)) >= tokenAmount, "Insufficient allowance");

        uint256 listingId = _nextListingId++;

        listings[listingId] = Listing({
            id: listingId,
            seller: msg.sender,
            tokenContract: tokenContract,
            tokenAmount: tokenAmount,
            pricePerToken: pricePerToken,
            listingType: listingType,
            status: ListingStatus.ACTIVE,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            highestBid: 0,
            highestBidder: address(0),
            escrowRequired: escrowRequired,
            createdAt: block.timestamp
        });

        userListings[msg.sender].push(listingId);

        // Transfer tokens to marketplace for escrow
        token.transferFrom(msg.sender, address(this), tokenAmount);

        emit ListingCreated(
            listingId,
            msg.sender,
            tokenContract,
            tokenAmount,
            pricePerToken,
            listingType
        );

        return listingId;
    }

    /**
     * @dev Buy tokens from a fixed-price listing
     * @param listingId ID of the listing to buy from
     */
    function buyFixedPrice(uint256 listingId) external payable nonReentrant whenNotPaused {
        Listing storage listing = listings[listingId];
        require(listing.status == ListingStatus.ACTIVE, "Listing not active");
        require(listing.listingType == ListingType.FIXED_PRICE, "Not a fixed price listing");
        require(block.timestamp <= listing.endTime, "Listing expired");
        
        uint256 totalPrice = listing.pricePerToken * listing.tokenAmount;
        require(msg.value >= totalPrice, "Insufficient payment");

        // Calculate platform fee
        uint256 platformFee = (totalPrice * platformFeeRate) / 10000;
        uint256 sellerAmount = totalPrice - platformFee;

        if (listing.escrowRequired) {
            // Create escrow
            _createEscrow(listingId, msg.sender, listing.seller, totalPrice);
        } else {
            // Direct transfer
            _completeSale(listingId, msg.sender, totalPrice, sellerAmount, platformFee);
        }

        // Refund excess payment
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }
    }

    /**
     * @dev Place a bid on an auction listing
     * @param listingId ID of the listing to bid on
     */
    function placeBid(uint256 listingId) external payable nonReentrant whenNotPaused {
        Listing storage listing = listings[listingId];
        require(listing.status == ListingStatus.ACTIVE, "Listing not active");
        require(listing.listingType == ListingType.AUCTION, "Not an auction listing");
        require(block.timestamp <= listing.endTime, "Auction expired");
        require(msg.value > listing.highestBid, "Bid too low");
        require(msg.sender != listing.seller, "Seller cannot bid");

        // Return previous highest bid to bidder
        if (listing.highestBidder != address(0)) {
            userBalances[listing.highestBidder] += listing.highestBid;
        }

        // Update highest bid
        listing.highestBid = msg.value;
        listing.highestBidder = msg.sender;

        // Record the bid
        listingBids[listingId].push(Bid({
            bidder: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp,
            withdrawn: false
        }));

        emit BidPlaced(listingId, msg.sender, msg.value);
    }

    /**
     * @dev Finalize an auction (can be called by anyone after auction ends)
     * @param listingId ID of the auction to finalize
     */
    function finalizeAuction(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.status == ListingStatus.ACTIVE, "Listing not active");
        require(listing.listingType == ListingType.AUCTION, "Not an auction");
        require(block.timestamp > listing.endTime, "Auction still active");

        if (listing.highestBidder == address(0)) {
            // No bids, cancel listing
            listing.status = ListingStatus.EXPIRED;
            IERC20(listing.tokenContract).transfer(listing.seller, listing.tokenAmount);
        } else {
            // Auction has winner
            uint256 totalPrice = listing.highestBid;
            uint256 platformFee = (totalPrice * platformFeeRate) / 10000;
            uint256 sellerAmount = totalPrice - platformFee;

            if (listing.escrowRequired) {
                _createEscrow(listingId, listing.highestBidder, listing.seller, totalPrice);
            } else {
                _completeSale(listingId, listing.highestBidder, totalPrice, sellerAmount, platformFee);
            }
        }
    }

    /**
     * @dev Withdraw a bid (only for non-winning bids)
     * @param listingId ID of the listing
     */
    function withdrawBid(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(msg.sender != listing.highestBidder, "Cannot withdraw winning bid");
        
        uint256 amount = userBalances[msg.sender];
        require(amount > 0, "No balance to withdraw");
        
        userBalances[msg.sender] = 0;
        payable(msg.sender).transfer(amount);

        emit BidWithdrawn(listingId, msg.sender, amount);
    }

    /**
     * @dev Create an escrow for a sale
     */
    function _createEscrow(
        uint256 listingId,
        address buyer,
        address seller,
        uint256 amount
    ) internal {
        uint256 escrowId = _nextEscrowId++;

        escrows[escrowId] = Escrow({
            buyer: buyer,
            seller: seller,
            amount: amount,
            buyerConfirmed: false,
            sellerConfirmed: false,
            disputed: false,
            createdAt: block.timestamp,
            timeoutAt: block.timestamp + 7 days // 7 day timeout
        });

        emit EscrowCreated(escrowId, listingId, buyer, seller, amount);
    }

    /**
     * @dev Confirm escrow (by buyer or seller)
     * @param escrowId ID of the escrow to confirm
     */
    function confirmEscrow(uint256 escrowId) external {
        Escrow storage escrow = escrows[escrowId];
        require(
            msg.sender == escrow.buyer || msg.sender == escrow.seller,
            "Not authorized"
        );
        require(!escrow.disputed, "Escrow is disputed");

        if (msg.sender == escrow.buyer) {
            escrow.buyerConfirmed = true;
        } else {
            escrow.sellerConfirmed = true;
        }

        emit EscrowConfirmed(
            escrowId,
            msg.sender,
            escrow.buyerConfirmed,
            escrow.sellerConfirmed
        );

        // If both confirmed, release escrow
        if (escrow.buyerConfirmed && escrow.sellerConfirmed) {
            _releaseEscrow(escrowId);
        }
    }

    /**
     * @dev Release escrow funds
     */
    function _releaseEscrow(uint256 escrowId) internal {
        Escrow storage escrow = escrows[escrowId];
        
        uint256 platformFee = (escrow.amount * platformFeeRate) / 10000;
        uint256 sellerAmount = escrow.amount - platformFee;

        // Transfer funds
        payable(escrow.seller).transfer(sellerAmount);
        payable(feeRecipient).transfer(platformFee);

        emit EscrowReleased(escrowId, escrow.buyer, escrow.seller, escrow.amount);
    }

    /**
     * @dev Complete a sale
     */
    function _completeSale(
        uint256 listingId,
        address buyer,
        uint256 totalPrice,
        uint256 sellerAmount,
        uint256 platformFee
    ) internal {
        Listing storage listing = listings[listingId];
        listing.status = ListingStatus.SOLD;

        // Transfer tokens to buyer
        IERC20(listing.tokenContract).transfer(buyer, listing.tokenAmount);

        // Transfer funds
        payable(listing.seller).transfer(sellerAmount);
        payable(feeRecipient).transfer(platformFee);

        emit ListingSold(listingId, buyer, totalPrice);
    }

    /**
     * @dev Cancel a listing (only by seller)
     * @param listingId ID of the listing to cancel
     */
    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(msg.sender == listing.seller, "Not the seller");
        require(listing.status == ListingStatus.ACTIVE, "Listing not active");
        
        if (listing.listingType == ListingType.AUCTION) {
            require(listing.highestBidder == address(0), "Cannot cancel auction with bids");
        }

        listing.status = ListingStatus.CANCELLED;
        
        // Return tokens to seller
        IERC20(listing.tokenContract).transfer(listing.seller, listing.tokenAmount);
    }

    /**
     * @dev Set platform fee rate (only admin)
     * @param newFeeRate New fee rate in basis points
     */
    function setPlatformFeeRate(uint256 newFeeRate) external onlyRole(ADMIN_ROLE) {
        require(newFeeRate <= 1000, "Fee rate too high"); // Max 10%
        platformFeeRate = newFeeRate;
    }

    /**
     * @dev Set fee recipient (only admin)
     * @param newFeeRecipient New fee recipient address
     */
    function setFeeRecipient(address newFeeRecipient) external onlyRole(ADMIN_ROLE) {
        require(newFeeRecipient != address(0), "Invalid address");
        feeRecipient = newFeeRecipient;
    }

    /**
     * @dev Pause the marketplace (only admin)
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the marketplace (only admin)
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Get listing details
     * @param listingId ID of the listing
     */
    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }

    /**
     * @dev Get user's listings
     * @param user Address of the user
     */
    function getUserListings(address user) external view returns (uint256[] memory) {
        return userListings[user];
    }

    /**
     * @dev Get bids for a listing
     * @param listingId ID of the listing
     */
    function getListingBids(uint256 listingId) external view returns (Bid[] memory) {
        return listingBids[listingId];
    }
}
