// Mock Bank API Server for testing
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3002;

app.use(cors());
app.use(express.json());

// Mock database
let mockDatabase = {
  users: {
    'user123': {
      id: 'user123',
      accessToken: 'mock_access_token_123',
      refreshToken: 'mock_refresh_token_123'
    }
  },
  accounts: {
    'user123': [
      {
        id: 'acc_001',
        accountNumber: '**** **** 1234',
        accountType: 'checking',
        balance: 25000.00,
        currency: 'USD',
        isActive: true,
        kycStatus: 'verified'
      },
      {
        id: 'acc_002',
        accountNumber: '**** **** 5678',
        accountType: 'savings',
        balance: 50000.00,
        currency: 'USD',
        isActive: true,
        kycStatus: 'verified'
      }
    ]
  },
  orders: []
};

// Authentication endpoint
app.post('/auth/login', (req, res) => {
  const { userId, username, password } = req.body;
  
  // Mock authentication - in real world, this would validate credentials
  if (username && password) {
    const user = mockDatabase.users[userId] || {
      id: userId,
      accessToken: `mock_access_token_${Date.now()}`,
      refreshToken: `mock_refresh_token_${Date.now()}`
    };
    
    mockDatabase.users[userId] = user;
    
    res.json({
      accessToken: user.accessToken,
      refreshToken: user.refreshToken,
      expiresIn: 3600
    });
  } else {
    res.status(401).json({
      message: 'Invalid credentials',
      code: 'INVALID_CREDENTIALS'
    });
  }
});

// Get bank accounts
app.get('/accounts/:userId', (req, res) => {
  const { userId } = req.params;
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Invalid or missing authorization token',
      code: 'UNAUTHORIZED'
    });
  }
  
  const accounts = mockDatabase.accounts[userId] || [];
  res.json(accounts);
});

// Initiate fiat to token purchase
app.post('/orders/fiat-to-token', (req, res) => {
  const {
    userId,
    bankAccountId,
    fiatAmount,
    fiatCurrency,
    tokenContract,
    tokenAmount,
    walletAddress
  } = req.body;
  
  const order = {
    id: `order_${Date.now()}`,
    userId,
    bankAccountId,
    fiatAmount,
    fiatCurrency,
    tokenAmount,
    tokenContract,
    walletAddress,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  mockDatabase.orders.push(order);
  
  // Simulate processing delay
  setTimeout(() => {
    const orderIndex = mockDatabase.orders.findIndex(o => o.id === order.id);
    if (orderIndex !== -1) {
      mockDatabase.orders[orderIndex].status = 'completed';
      mockDatabase.orders[orderIndex].completedAt = new Date().toISOString();
      mockDatabase.orders[orderIndex].transactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    }
  }, 5000);
  
  res.json(order);
});

// Get order status
app.get('/orders/:orderId', (req, res) => {
  const { orderId } = req.params;
  const order = mockDatabase.orders.find(o => o.id === orderId);
  
  if (order) {
    res.json(order);
  } else {
    res.status(404).json({
      message: 'Order not found',
      code: 'ORDER_NOT_FOUND'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Mock Bank API'
  });
});

app.listen(port, () => {
  console.log(`Mock Bank API server running at http://localhost:${port}`);
  console.log('Available endpoints:');
  console.log('  POST /auth/login - User authentication');
  console.log('  GET /accounts/:userId - Get user bank accounts');
  console.log('  POST /orders/fiat-to-token - Create fiat to token order');
  console.log('  GET /orders/:orderId - Get order status');
  console.log('  GET /health - Health check');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down Mock Bank API server...');
  process.exit(0);
});

module.exports = app;
