// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title ChainlinkPriceOracle
 * @dev Oracle contract for fetching real-world asset prices using Chainlink
 * Features:
 * - Multiple price feed support
 * - Price validation and staleness checks
 * - Emergency price override capability
 * - Historical price tracking
 */
contract ChainlinkPriceOracle is AccessControl {
    bytes32 public constant ORACLE_MANAGER_ROLE = keccak256("ORACLE_MANAGER_ROLE");
    bytes32 public constant PRICE_UPDATER_ROLE = keccak256("PRICE_UPDATER_ROLE");

    struct PriceFeed {
        AggregatorV3Interface aggregator;
        uint256 heartbeat; // Maximum time between updates (seconds)
        uint8 decimals;
        bool active;
        string description;
    }

    struct PriceData {
        uint256 price;
        uint256 timestamp;
        uint80 roundId;
    }

    mapping(address => PriceFeed) public priceFeeds; // asset token => price feed
    mapping(address => PriceData) public latestPrices; // asset token => latest price
    mapping(address => mapping(uint256 => PriceData)) public historicalPrices; // asset => timestamp => price
    
    // Emergency override prices (when Chainlink feeds are unavailable)
    mapping(address => uint256) public emergencyPrices;
    mapping(address => bool) public emergencyMode;
    
    uint256 public constant PRICE_PRECISION = 1e18;
    uint256 public defaultHeartbeat = 3600; // 1 hour default

    // Events
    event PriceFeedAdded(address indexed assetToken, address indexed aggregator, string description);
    event PriceFeedUpdated(address indexed assetToken, address indexed aggregator);
    event PriceFeedRemoved(address indexed assetToken);
    event PriceUpdated(address indexed assetToken, uint256 price, uint256 timestamp);
    event EmergencyPriceSet(address indexed assetToken, uint256 price);
    event EmergencyModeToggled(address indexed assetToken, bool enabled);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_MANAGER_ROLE, msg.sender);
        _grantRole(PRICE_UPDATER_ROLE, msg.sender);
    }

    /**
     * @dev Add a new price feed for an asset token
     * @param assetToken Address of the asset token
     * @param aggregator Chainlink aggregator address
     * @param heartbeat Maximum time between updates
     * @param description Human-readable description
     */
    function addPriceFeed(
        address assetToken,
        address aggregator,
        uint256 heartbeat,
        string memory description
    ) external onlyRole(ORACLE_MANAGER_ROLE) {
        require(assetToken != address(0), "Invalid asset token");
        require(aggregator != address(0), "Invalid aggregator");
        require(heartbeat > 0, "Invalid heartbeat");

        AggregatorV3Interface priceFeed = AggregatorV3Interface(aggregator);
        uint8 decimals = priceFeed.decimals();

        priceFeeds[assetToken] = PriceFeed({
            aggregator: priceFeed,
            heartbeat: heartbeat,
            decimals: decimals,
            active: true,
            description: description
        });

        emit PriceFeedAdded(assetToken, aggregator, description);
        
        // Update price immediately
        _updatePrice(assetToken);
    }

    /**
     * @dev Update price feed aggregator
     * @param assetToken Address of the asset token
     * @param newAggregator New aggregator address
     */
    function updatePriceFeed(
        address assetToken,
        address newAggregator
    ) external onlyRole(ORACLE_MANAGER_ROLE) {
        require(priceFeeds[assetToken].active, "Price feed not found");
        require(newAggregator != address(0), "Invalid aggregator");

        priceFeeds[assetToken].aggregator = AggregatorV3Interface(newAggregator);
        priceFeeds[assetToken].decimals = AggregatorV3Interface(newAggregator).decimals();

        emit PriceFeedUpdated(assetToken, newAggregator);
        
        // Update price with new feed
        _updatePrice(assetToken);
    }

    /**
     * @dev Remove a price feed
     * @param assetToken Address of the asset token
     */
    function removePriceFeed(address assetToken) external onlyRole(ORACLE_MANAGER_ROLE) {
        require(priceFeeds[assetToken].active, "Price feed not found");
        
        priceFeeds[assetToken].active = false;
        emit PriceFeedRemoved(assetToken);
    }

    /**
     * @dev Update price for a specific asset token
     * @param assetToken Address of the asset token
     */
    function updatePrice(address assetToken) external onlyRole(PRICE_UPDATER_ROLE) {
        _updatePrice(assetToken);
    }

    /**
     * @dev Update prices for multiple asset tokens
     * @param assetTokens Array of asset token addresses
     */
    function updatePrices(address[] calldata assetTokens) external onlyRole(PRICE_UPDATER_ROLE) {
        for (uint256 i = 0; i < assetTokens.length; i++) {
            _updatePrice(assetTokens[i]);
        }
    }

    /**
     * @dev Internal function to update price from Chainlink
     * @param assetToken Address of the asset token
     */
    function _updatePrice(address assetToken) internal {
        PriceFeed storage feed = priceFeeds[assetToken];
        require(feed.active, "Price feed not active");

        if (emergencyMode[assetToken]) {
            // Use emergency price if in emergency mode
            uint256 emergencyPrice = emergencyPrices[assetToken];
            require(emergencyPrice > 0, "Emergency price not set");
            
            latestPrices[assetToken] = PriceData({
                price: emergencyPrice,
                timestamp: block.timestamp,
                roundId: 0
            });
            
            emit PriceUpdated(assetToken, emergencyPrice, block.timestamp);
            return;
        }

        try feed.aggregator.latestRoundData() returns (
            uint80 roundId,
            int256 price,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) {
            require(price > 0, "Invalid price from oracle");
            require(updatedAt > 0, "Invalid timestamp from oracle");
            require(block.timestamp - updatedAt <= feed.heartbeat, "Price data is stale");

            // Convert price to 18 decimals
            uint256 normalizedPrice = uint256(price);
            if (feed.decimals < 18) {
                normalizedPrice = normalizedPrice * (10 ** (18 - feed.decimals));
            } else if (feed.decimals > 18) {
                normalizedPrice = normalizedPrice / (10 ** (feed.decimals - 18));
            }

            latestPrices[assetToken] = PriceData({
                price: normalizedPrice,
                timestamp: updatedAt,
                roundId: roundId
            });

            // Store historical price (rounded to hour)
            uint256 hourTimestamp = (updatedAt / 3600) * 3600;
            historicalPrices[assetToken][hourTimestamp] = latestPrices[assetToken];

            emit PriceUpdated(assetToken, normalizedPrice, updatedAt);
        } catch {
            // If Chainlink call fails, revert unless emergency mode is available
            require(emergencyPrices[assetToken] > 0, "Oracle call failed and no emergency price");
            
            // Automatically enable emergency mode
            emergencyMode[assetToken] = true;
            emit EmergencyModeToggled(assetToken, true);
            
            // Recursively call to use emergency price
            _updatePrice(assetToken);
        }
    }

    /**
     * @dev Set emergency price for an asset token
     * @param assetToken Address of the asset token
     * @param price Emergency price (18 decimals)
     */
    function setEmergencyPrice(
        address assetToken,
        uint256 price
    ) external onlyRole(ORACLE_MANAGER_ROLE) {
        require(price > 0, "Invalid emergency price");
        
        emergencyPrices[assetToken] = price;
        emit EmergencyPriceSet(assetToken, price);
    }

    /**
     * @dev Toggle emergency mode for an asset token
     * @param assetToken Address of the asset token
     * @param enabled Whether to enable emergency mode
     */
    function toggleEmergencyMode(
        address assetToken,
        bool enabled
    ) external onlyRole(ORACLE_MANAGER_ROLE) {
        emergencyMode[assetToken] = enabled;
        emit EmergencyModeToggled(assetToken, enabled);
        
        if (!enabled) {
            // Update price from Chainlink when exiting emergency mode
            _updatePrice(assetToken);
        }
    }

    /**
     * @dev Get latest price for an asset token
     * @param assetToken Address of the asset token
     * @return price Latest price (18 decimals)
     * @return timestamp Timestamp of the price
     */
    function getLatestPrice(address assetToken) external view returns (uint256 price, uint256 timestamp) {
        PriceData memory priceData = latestPrices[assetToken];
        require(priceData.timestamp > 0, "Price not available");
        
        return (priceData.price, priceData.timestamp);
    }

    /**
     * @dev Get historical price for an asset token at a specific timestamp
     * @param assetToken Address of the asset token
     * @param timestamp Timestamp to query (will be rounded to nearest hour)
     * @return price Historical price (18 decimals)
     * @return actualTimestamp Actual timestamp of the price data
     */
    function getHistoricalPrice(
        address assetToken,
        uint256 timestamp
    ) external view returns (uint256 price, uint256 actualTimestamp) {
        uint256 hourTimestamp = (timestamp / 3600) * 3600;
        PriceData memory priceData = historicalPrices[assetToken][hourTimestamp];
        
        require(priceData.timestamp > 0, "Historical price not available");
        return (priceData.price, priceData.timestamp);
    }

    /**
     * @dev Check if price data is fresh
     * @param assetToken Address of the asset token
     * @return True if price is fresh, false otherwise
     */
    function isPriceFresh(address assetToken) external view returns (bool) {
        PriceFeed memory feed = priceFeeds[assetToken];
        PriceData memory priceData = latestPrices[assetToken];
        
        if (!feed.active || priceData.timestamp == 0) {
            return false;
        }
        
        return block.timestamp - priceData.timestamp <= feed.heartbeat;
    }

    /**
     * @dev Get price feed information
     * @param assetToken Address of the asset token
     * @return aggregator Aggregator address
     * @return heartbeat Maximum time between updates
     * @return decimals Price decimals
     * @return active Whether the feed is active
     * @return description Feed description
     */
    function getPriceFeedInfo(address assetToken) external view returns (
        address aggregator,
        uint256 heartbeat,
        uint8 decimals,
        bool active,
        string memory description
    ) {
        PriceFeed memory feed = priceFeeds[assetToken];
        return (
            address(feed.aggregator),
            feed.heartbeat,
            feed.decimals,
            feed.active,
            feed.description
        );
    }

    /**
     * @dev Update default heartbeat
     * @param newHeartbeat New default heartbeat in seconds
     */
    function updateDefaultHeartbeat(uint256 newHeartbeat) external onlyRole(ORACLE_MANAGER_ROLE) {
        require(newHeartbeat > 0, "Invalid heartbeat");
        defaultHeartbeat = newHeartbeat;
    }
}