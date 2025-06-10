// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./AssetToken.sol";

/**
 * @title Marketplace
 * @dev Decentralized marketplace for trading asset tokens
 * Features:
 * - Order book for buy/sell orders
 * - Market and limit orders
 * - Fee collection mechanism
 * - Order matching engine
 * - Price discovery
 */
contract Marketplace is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant FEE_MANAGER_ROLE = keccak256("FEE_MANAGER_ROLE");

    enum OrderType { MARKET, LIMIT }
    enum OrderSide { BUY, SELL }
    enum OrderStatus { ACTIVE, FILLED, CANCELLED, EXPIRED }

    struct Order {
        uint256 orderId;
        address trader;
        address assetToken;
        OrderSide side;
        OrderType orderType;
        uint256 amount;
        uint256 price; // Price per token in wei
        uint256 filled;
        uint256 timestamp;
        uint256 expiryTime;
        OrderStatus status;
    }

    struct Trade {
        uint256 tradeId;
        uint256 buyOrderId;
        uint256 sellOrderId;
        address buyer;
        address seller;
        address assetToken;
        uint256 amount;
        uint256 price;
        uint256 timestamp;
    }

    // State variables
    uint256 public nextOrderId = 1;
    uint256 public nextTradeId = 1;
    
    mapping(uint256 => Order) public orders;
    mapping(address => uint256[]) public userOrders;
    mapping(address => uint256[]) public assetOrders;
    
    Trade[] public trades;
    mapping(address => uint256[]) public userTrades;
    
    // Fee structure (basis points, 1 bp = 0.01%)
    uint256 public tradingFee = 250; // 2.5%
    address public feeRecipient;
    
    // Order book storage
    mapping(address => uint256[]) public buyOrders; // Sorted by price (highest first)
    mapping(address => uint256[]) public sellOrders; // Sorted by price (lowest first)

    // Events
    event OrderPlaced(
        uint256 indexed orderId,
        address indexed trader,
        address indexed assetToken,
        OrderSide side,
        OrderType orderType,
        uint256 amount,
        uint256 price
    );
    
    event OrderFilled(
        uint256 indexed orderId,
        uint256 filledAmount,
        uint256 remainingAmount
    );
    
    event OrderCancelled(uint256 indexed orderId);
    
    event TradeExecuted(
        uint256 indexed tradeId,
        uint256 indexed buyOrderId,
        uint256 indexed sellOrderId,
        address buyer,
        address seller,
        address assetToken,
        uint256 amount,
        uint256 price
    );
    
    event TradingFeeUpdated(uint256 newFee);
    event FeeRecipientUpdated(address newRecipient);

    constructor(address _feeRecipient) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        _grantRole(FEE_MANAGER_ROLE, msg.sender);
        
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev Place a buy order
     * @param assetToken Address of the asset token
     * @param amount Amount of tokens to buy
     * @param price Price per token (for limit orders)
     * @param orderType Type of order (MARKET or LIMIT)
     * @param expiryTime Expiry timestamp (0 for no expiry)
     */
    function placeBuyOrder(
        address assetToken,
        uint256 amount,
        uint256 price,
        OrderType orderType,
        uint256 expiryTime
    ) external payable nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(assetToken != address(0), "Invalid asset token address");
        
        if (orderType == OrderType.LIMIT) {
            require(price > 0, "Price must be greater than 0 for limit orders");
        }
        
        uint256 totalCost = orderType == OrderType.MARKET ? msg.value : amount * price;
        require(msg.value >= totalCost, "Insufficient ETH sent");

        uint256 orderId = nextOrderId++;
        
        orders[orderId] = Order({
            orderId: orderId,
            trader: msg.sender,
            assetToken: assetToken,
            side: OrderSide.BUY,
            orderType: orderType,
            amount: amount,
            price: price,
            filled: 0,
            timestamp: block.timestamp,
            expiryTime: expiryTime,
            status: OrderStatus.ACTIVE
        });

        userOrders[msg.sender].push(orderId);
        assetOrders[assetToken].push(orderId);

        if (orderType == OrderType.LIMIT) {
            _insertBuyOrder(assetToken, orderId);
        }

        emit OrderPlaced(orderId, msg.sender, assetToken, OrderSide.BUY, orderType, amount, price);

        // Try to match the order immediately
        _matchOrder(orderId);
    }

    /**
     * @dev Place a sell order
     * @param assetToken Address of the asset token
     * @param amount Amount of tokens to sell
     * @param price Price per token (for limit orders)
     * @param orderType Type of order (MARKET or LIMIT)
     * @param expiryTime Expiry timestamp (0 for no expiry)
     */
    function placeSellOrder(
        address assetToken,
        uint256 amount,
        uint256 price,
        OrderType orderType,
        uint256 expiryTime
    ) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(assetToken != address(0), "Invalid asset token address");
        
        if (orderType == OrderType.LIMIT) {
            require(price > 0, "Price must be greater than 0 for limit orders");
        }

        // Transfer tokens to escrow
        IERC20(assetToken).safeTransferFrom(msg.sender, address(this), amount);

        uint256 orderId = nextOrderId++;
        
        orders[orderId] = Order({
            orderId: orderId,
            trader: msg.sender,
            assetToken: assetToken,
            side: OrderSide.SELL,
            orderType: orderType,
            amount: amount,
            price: price,
            filled: 0,
            timestamp: block.timestamp,
            expiryTime: expiryTime,
            status: OrderStatus.ACTIVE
        });

        userOrders[msg.sender].push(orderId);
        assetOrders[assetToken].push(orderId);

        if (orderType == OrderType.LIMIT) {
            _insertSellOrder(assetToken, orderId);
        }

        emit OrderPlaced(orderId, msg.sender, assetToken, OrderSide.SELL, orderType, amount, price);

        // Try to match the order immediately
        _matchOrder(orderId);
    }

    /**
     * @dev Cancel an active order
     * @param orderId ID of the order to cancel
     */
    function cancelOrder(uint256 orderId) external nonReentrant {
        Order storage order = orders[orderId];
        require(order.trader == msg.sender, "Not order owner");
        require(order.status == OrderStatus.ACTIVE, "Order not active");

        order.status = OrderStatus.CANCELLED;

        // Refund remaining amount
        uint256 remainingAmount = order.amount - order.filled;
        
        if (order.side == OrderSide.BUY) {
            uint256 refundAmount = remainingAmount * order.price;
            if (refundAmount > 0) {
                (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
                require(success, "Refund failed");
            }
            _removeBuyOrder(order.assetToken, orderId);
        } else {
            if (remainingAmount > 0) {
                IERC20(order.assetToken).safeTransfer(msg.sender, remainingAmount);
            }
            _removeSellOrder(order.assetToken, orderId);
        }

        emit OrderCancelled(orderId);
    }

    /**
     * @dev Match an order with existing orders in the order book
     * @param orderId ID of the order to match
     */
    function _matchOrder(uint256 orderId) internal {
        Order storage order = orders[orderId];
        
        if (order.side == OrderSide.BUY) {
            _matchBuyOrder(orderId);
        } else {
            _matchSellOrder(orderId);
        }
    }

    /**
     * @dev Match a buy order with sell orders
     * @param buyOrderId ID of the buy order
     */
    function _matchBuyOrder(uint256 buyOrderId) internal {
        Order storage buyOrder = orders[buyOrderId];
        uint256[] storage sellOrderIds = sellOrders[buyOrder.assetToken];
        
        uint256 i = 0;
        while (i < sellOrderIds.length && buyOrder.filled < buyOrder.amount) {
            uint256 sellOrderId = sellOrderIds[i];
            Order storage sellOrder = orders[sellOrderId];
            
            if (sellOrder.status != OrderStatus.ACTIVE) {
                i++;
                continue;
            }
            
            // Check if orders can be matched
            bool canMatch = false;
            uint256 tradePrice = 0;
            
            if (buyOrder.orderType == OrderType.MARKET) {
                canMatch = true;
                tradePrice = sellOrder.price;
            } else if (sellOrder.orderType == OrderType.MARKET) {
                canMatch = true;
                tradePrice = buyOrder.price;
            } else if (buyOrder.price >= sellOrder.price) {
                canMatch = true;
                tradePrice = sellOrder.price; // Seller gets their asking price
            }
            
            if (canMatch) {
                uint256 buyRemaining = buyOrder.amount - buyOrder.filled;
                uint256 sellRemaining = sellOrder.amount - sellOrder.filled;
                uint256 tradeAmount = buyRemaining < sellRemaining ? buyRemaining : sellRemaining;
                
                _executeTrade(buyOrderId, sellOrderId, tradeAmount, tradePrice);
                
                if (sellOrder.filled == sellOrder.amount) {
                    sellOrder.status = OrderStatus.FILLED;
                    _removeSellOrder(buyOrder.assetToken, sellOrderId);
                }
            }
            
            i++;
        }
        
        if (buyOrder.filled == buyOrder.amount) {
            buyOrder.status = OrderStatus.FILLED;
        }
    }

    /**
     * @dev Match a sell order with buy orders
     * @param sellOrderId ID of the sell order
     */
    function _matchSellOrder(uint256 sellOrderId) internal {
        Order storage sellOrder = orders[sellOrderId];
        uint256[] storage buyOrderIds = buyOrders[sellOrder.assetToken];
        
        uint256 i = 0;
        while (i < buyOrderIds.length && sellOrder.filled < sellOrder.amount) {
            uint256 buyOrderId = buyOrderIds[i];
            Order storage buyOrder = orders[buyOrderId];
            
            if (buyOrder.status != OrderStatus.ACTIVE) {
                i++;
                continue;
            }
            
            // Check if orders can be matched
            bool canMatch = false;
            uint256 tradePrice = 0;
            
            if (sellOrder.orderType == OrderType.MARKET) {
                canMatch = true;
                tradePrice = buyOrder.price;
            } else if (buyOrder.orderType == OrderType.MARKET) {
                canMatch = true;
                tradePrice = sellOrder.price;
            } else if (buyOrder.price >= sellOrder.price) {
                canMatch = true;
                tradePrice = sellOrder.price; // Seller gets their asking price
            }
            
            if (canMatch) {
                uint256 buyRemaining = buyOrder.amount - buyOrder.filled;
                uint256 sellRemaining = sellOrder.amount - sellOrder.filled;
                uint256 tradeAmount = buyRemaining < sellRemaining ? buyRemaining : sellRemaining;
                
                _executeTrade(buyOrderId, sellOrderId, tradeAmount, tradePrice);
                
                if (buyOrder.filled == buyOrder.amount) {
                    buyOrder.status = OrderStatus.FILLED;
                    _removeBuyOrder(sellOrder.assetToken, buyOrderId);
                }
            }
            
            i++;
        }
        
        if (sellOrder.filled == sellOrder.amount) {
            sellOrder.status = OrderStatus.FILLED;
        }
    }

    /**
     * @dev Execute a trade between two orders
     * @param buyOrderId ID of the buy order
     * @param sellOrderId ID of the sell order
     * @param amount Amount of tokens to trade
     * @param price Price per token
     */
    function _executeTrade(
        uint256 buyOrderId,
        uint256 sellOrderId,
        uint256 amount,
        uint256 price
    ) internal {
        Order storage buyOrder = orders[buyOrderId];
        Order storage sellOrder = orders[sellOrderId];
        
        uint256 totalValue = amount * price;
        uint256 fee = (totalValue * tradingFee) / 10000;
        uint256 sellerReceives = totalValue - fee;
        
        // Update order filled amounts
        buyOrder.filled += amount;
        sellOrder.filled += amount;
        
        // Transfer tokens to buyer
        IERC20(buyOrder.assetToken).safeTransfer(buyOrder.trader, amount);
        
        // Transfer ETH to seller (minus fee)
        (bool success, ) = payable(sellOrder.trader).call{value: sellerReceives}("");
        require(success, "Payment to seller failed");
        
        // Transfer fee to fee recipient
        if (fee > 0) {
            (bool feeSuccess, ) = payable(feeRecipient).call{value: fee}("");
            require(feeSuccess, "Fee transfer failed");
        }
        
        // Record trade
        uint256 tradeId = nextTradeId++;
        trades.push(Trade({
            tradeId: tradeId,
            buyOrderId: buyOrderId,
            sellOrderId: sellOrderId,
            buyer: buyOrder.trader,
            seller: sellOrder.trader,
            assetToken: buyOrder.assetToken,
            amount: amount,
            price: price,
            timestamp: block.timestamp
        }));
        
        userTrades[buyOrder.trader].push(tradeId);
        userTrades[sellOrder.trader].push(tradeId);
        
        emit TradeExecuted(
            tradeId,
            buyOrderId,
            sellOrderId,
            buyOrder.trader,
            sellOrder.trader,
            buyOrder.assetToken,
            amount,
            price
        );
        
        emit OrderFilled(buyOrderId, amount, buyOrder.amount - buyOrder.filled);
        emit OrderFilled(sellOrderId, amount, sellOrder.amount - sellOrder.filled);
    }

    /**
     * @dev Insert buy order into sorted order book
     * @param assetToken Asset token address
     * @param orderId Order ID to insert
     */
    function _insertBuyOrder(address assetToken, uint256 orderId) internal {
        uint256[] storage orderIds = buyOrders[assetToken];
        Order storage newOrder = orders[orderId];
        
        // Insert in descending price order (highest price first)
        uint256 insertIndex = orderIds.length;
        for (uint256 i = 0; i < orderIds.length; i++) {
            if (orders[orderIds[i]].price < newOrder.price) {
                insertIndex = i;
                break;
            }
        }
        
        orderIds.push(0);
        for (uint256 i = orderIds.length - 1; i > insertIndex; i--) {
            orderIds[i] = orderIds[i - 1];
        }
        orderIds[insertIndex] = orderId;
    }

    /**
     * @dev Insert sell order into sorted order book
     * @param assetToken Asset token address
     * @param orderId Order ID to insert
     */
    function _insertSellOrder(address assetToken, uint256 orderId) internal {
        uint256[] storage orderIds = sellOrders[assetToken];
        Order storage newOrder = orders[orderId];
        
        // Insert in ascending price order (lowest price first)
        uint256 insertIndex = orderIds.length;
        for (uint256 i = 0; i < orderIds.length; i++) {
            if (orders[orderIds[i]].price > newOrder.price) {
                insertIndex = i;
                break;
            }
        }
        
        orderIds.push(0);
        for (uint256 i = orderIds.length - 1; i > insertIndex; i--) {
            orderIds[i] = orderIds[i - 1];
        }
        orderIds[insertIndex] = orderId;
    }

    /**
     * @dev Remove buy order from order book
     * @param assetToken Asset token address
     * @param orderId Order ID to remove
     */
    function _removeBuyOrder(address assetToken, uint256 orderId) internal {
        uint256[] storage orderIds = buyOrders[assetToken];
        for (uint256 i = 0; i < orderIds.length; i++) {
            if (orderIds[i] == orderId) {
                orderIds[i] = orderIds[orderIds.length - 1];
                orderIds.pop();
                break;
            }
        }
    }

    /**
     * @dev Remove sell order from order book
     * @param assetToken Asset token address
     * @param orderId Order ID to remove
     */
    function _removeSellOrder(address assetToken, uint256 orderId) internal {
        uint256[] storage orderIds = sellOrders[assetToken];
        for (uint256 i = 0; i < orderIds.length; i++) {
            if (orderIds[i] == orderId) {
                orderIds[i] = orderIds[orderIds.length - 1];
                orderIds.pop();
                break;
            }
        }
    }

    // View functions
    function getBuyOrders(address assetToken) external view returns (uint256[] memory) {
        return buyOrders[assetToken];
    }

    function getSellOrders(address assetToken) external view returns (uint256[] memory) {
        return sellOrders[assetToken];
    }

    function getUserOrders(address user) external view returns (uint256[] memory) {
        return userOrders[user];
    }

    function getUserTrades(address user) external view returns (uint256[] memory) {
        return userTrades[user];
    }

    function getAssetOrders(address assetToken) external view returns (uint256[] memory) {
        return assetOrders[assetToken];
    }

    function getTotalTrades() external view returns (uint256) {
        return trades.length;
    }

    // Admin functions
    function updateTradingFee(uint256 newFee) external onlyRole(FEE_MANAGER_ROLE) {
        require(newFee <= 1000, "Fee cannot exceed 10%"); // Max 10%
        tradingFee = newFee;
        emit TradingFeeUpdated(newFee);
    }

    function updateFeeRecipient(address newRecipient) external onlyRole(FEE_MANAGER_ROLE) {
        require(newRecipient != address(0), "Invalid recipient address");
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(newRecipient);
    }

    // Emergency functions
    function emergencyWithdraw(address token, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (token == address(0)) {
            (bool success, ) = payable(msg.sender).call{value: amount}("");
            require(success, "ETH withdrawal failed");
        } else {
            IERC20(token).safeTransfer(msg.sender, amount);
        }
    }
}