// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ChainlinkPriceOracle
 * @dev Mock price oracle for development (in production, use actual Chainlink feeds)
 */
contract ChainlinkPriceOracle is AccessControl, Pausable {
    bytes32 public constant ORACLE_UPDATER_ROLE = keccak256("ORACLE_UPDATER_ROLE");

    struct PriceFeed {
        uint256 price;
        uint256 lastUpdated;
        uint8 decimals;
        string description;
        bool isActive;
    }

    mapping(bytes32 => PriceFeed) public priceFeeds;
    mapping(string => bytes32) public feedIds;
    bytes32[] public allFeeds;

    uint256 public constant STALENESS_THRESHOLD = 1 hours;

    event PriceUpdated(
        bytes32 indexed feedId,
        string indexed symbol,
        uint256 price,
        uint256 timestamp
    );

    event FeedAdded(bytes32 indexed feedId, string symbol, string description);
    event FeedStatusChanged(bytes32 indexed feedId, bool isActive);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_UPDATER_ROLE, msg.sender);

        // Initialize common price feeds
        _addPriceFeed("ETH/USD", "Ethereum Price Feed", 8);
        _addPriceFeed("BTC/USD", "Bitcoin Price Feed", 8);
        _addPriceFeed("USDC/USD", "USD Coin Price Feed", 8);
        _addPriceFeed("REAL_ESTATE/USD", "Real Estate Index", 8);

        // Set initial prices (mock data)
        _updatePrice("ETH/USD", 2000 * 10**8); // $2000
        _updatePrice("BTC/USD", 30000 * 10**8); // $30000
        _updatePrice("USDC/USD", 1 * 10**8); // $1
        _updatePrice("REAL_ESTATE/USD", 250000 * 10**8); // $250k per unit
    }

    function _addPriceFeed(
        string memory symbol,
        string memory description,
        uint8 decimals
    ) internal {
        bytes32 feedId = keccak256(abi.encodePacked(symbol));
        
        priceFeeds[feedId] = PriceFeed({
            price: 0,
            lastUpdated: 0,
            decimals: decimals,
            description: description,
            isActive: true
        });

        feedIds[symbol] = feedId;
        allFeeds.push(feedId);

        emit FeedAdded(feedId, symbol, description);
    }

    function addPriceFeed(
        string memory symbol,
        string memory description,
        uint8 decimals
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(feedIds[symbol] == bytes32(0), "PriceOracle: Feed already exists");
        _addPriceFeed(symbol, description, decimals);
    }

    function _updatePrice(string memory symbol, uint256 price) internal {
        bytes32 feedId = feedIds[symbol];
        require(feedId != bytes32(0), "PriceOracle: Feed not found");
        require(priceFeeds[feedId].isActive, "PriceOracle: Feed not active");

        priceFeeds[feedId].price = price;
        priceFeeds[feedId].lastUpdated = block.timestamp;

        emit PriceUpdated(feedId, symbol, price, block.timestamp);
    }

    function updatePrice(
        string memory symbol,
        uint256 price
    ) external onlyRole(ORACLE_UPDATER_ROLE) whenNotPaused {
        _updatePrice(symbol, price);
    }

    function updatePrices(
        string[] memory symbols,
        uint256[] memory prices
    ) external onlyRole(ORACLE_UPDATER_ROLE) whenNotPaused {
        require(symbols.length == prices.length, "PriceOracle: Arrays length mismatch");
        
        for (uint256 i = 0; i < symbols.length; i++) {
            _updatePrice(symbols[i], prices[i]);
        }
    }

    function getPrice(string memory symbol) external view returns (uint256 price, uint256 timestamp) {
        bytes32 feedId = feedIds[symbol];
        require(feedId != bytes32(0), "PriceOracle: Feed not found");
        
        PriceFeed memory feed = priceFeeds[feedId];
        require(feed.isActive, "PriceOracle: Feed not active");
        require(
            block.timestamp - feed.lastUpdated <= STALENESS_THRESHOLD,
            "PriceOracle: Price data stale"
        );

        return (feed.price, feed.lastUpdated);
    }

    function getLatestPrice(string memory symbol) external view returns (uint256) {
        (uint256 price, ) = this.getPrice(symbol);
        return price;
    }

    function getPriceWithDecimals(string memory symbol) external view returns (uint256 price, uint8 decimals) {
        bytes32 feedId = feedIds[symbol];
        require(feedId != bytes32(0), "PriceOracle: Feed not found");
        
        PriceFeed memory feed = priceFeeds[feedId];
        require(feed.isActive, "PriceOracle: Feed not active");

        return (feed.price, feed.decimals);
    }

    function isPriceStale(string memory symbol) external view returns (bool) {
        bytes32 feedId = feedIds[symbol];
        if (feedId == bytes32(0)) return true;
        
        PriceFeed memory feed = priceFeeds[feedId];
        return block.timestamp - feed.lastUpdated > STALENESS_THRESHOLD;
    }

    function setFeedStatus(string memory symbol, bool isActive) external onlyRole(DEFAULT_ADMIN_ROLE) {
        bytes32 feedId = feedIds[symbol];
        require(feedId != bytes32(0), "PriceOracle: Feed not found");
        
        priceFeeds[feedId].isActive = isActive;
        emit FeedStatusChanged(feedId, isActive);
    }

    function getFeedInfo(string memory symbol) external view returns (
        uint256 price,
        uint256 lastUpdated,
        uint8 decimals,
        string memory description,
        bool isActive
    ) {
        bytes32 feedId = feedIds[symbol];
        require(feedId != bytes32(0), "PriceOracle: Feed not found");
        
        PriceFeed memory feed = priceFeeds[feedId];
        return (feed.price, feed.lastUpdated, feed.decimals, feed.description, feed.isActive);
    }

    function getAllFeeds() external view returns (bytes32[] memory) {
        return allFeeds;
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
