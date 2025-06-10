import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface WalletBalance {
  symbol: string;
  name: string;
  balance: string;
  usdValue: number;
  change24h: number;
}

export interface WalletTransaction {
  id: string;
  type: 'send' | 'receive' | 'swap' | 'approve';
  from: string;
  to: string;
  amount: string;
  symbol: string;
  usdValue: number;
  gasUsed?: string;
  gasPrice?: string;
  txHash: string;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
}

interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  balances: WalletBalance[];
  transactions: WalletTransaction[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: WalletState = {
  isConnected: false,
  address: null,
  chainId: null,
  balances: [],
  transactions: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Mock data
const mockBalances: WalletBalance[] = [
  {
    symbol: 'ETH',
    name: 'Ethereum',
    balance: '2.5',
    usdValue: 4250.00,
    change24h: 3.2,
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    balance: '1500.00',
    usdValue: 1500.00,
    change24h: 0.1,
  },
  {
    symbol: 'MATIC',
    name: 'Polygon',
    balance: '850.0',
    usdValue: 680.00,
    change24h: -2.1,
  },
];

const mockTransactions: WalletTransaction[] = [
  {
    id: '1',
    type: 'receive',
    from: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b',
    to: '0x8ba1f109551bD432803012645Hac136c',
    amount: '0.5',
    symbol: 'ETH',
    usdValue: 850.00,
    gasUsed: '21000',
    gasPrice: '20',
    txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    timestamp: '2024-01-15T14:30:00Z',
    status: 'confirmed',
    blockNumber: 18950000,
  },
];

// Async thunks
export const connectWallet = createAsyncThunk(
  'wallet/connect',
  async () => {
    // Simulate wallet connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      address: '0x8ba1f109551bD432803012645Hac136c',
      chainId: 137, // Polygon
    };
  }
);

export const disconnectWallet = createAsyncThunk(
  'wallet/disconnect',
  async () => {
    // Simulate wallet disconnection
    await new Promise(resolve => setTimeout(resolve, 500));
    return {};
  }
);

export const fetchWalletData = createAsyncThunk(
  'wallet/fetchData',
  async () => {
    // Simulate API call to fetch wallet data
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      balances: mockBalances,
      transactions: mockTransactions,
    };
  }
);

export const sendTransaction = createAsyncThunk(
  'wallet/sendTransaction',
  async ({ 
    to, 
    amount, 
    symbol 
  }: { 
    to: string; 
    amount: string; 
    symbol: string; 
  }) => {
    // Simulate transaction sending
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const transaction: WalletTransaction = {
      id: Date.now().toString(),
      type: 'send',
      from: '0x8ba1f109551bD432803012645Hac136c',
      to,
      amount,
      symbol,
      usdValue: parseFloat(amount) * (symbol === 'ETH' ? 1700 : symbol === 'USDC' ? 1 : 0.8),
      gasUsed: '21000',
      gasPrice: '20',
      txHash: '0x' + Math.random().toString(16).substr(2, 64),
      timestamp: new Date().toISOString(),
      status: 'pending',
    };

    return transaction;
  }
);

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateTransactionStatus: (state, action: PayloadAction<{ 
      txHash: string; 
      status: 'pending' | 'confirmed' | 'failed';
      blockNumber?: number;
    }>) => {
      const transaction = state.transactions.find(tx => tx.txHash === action.payload.txHash);
      if (transaction) {
        transaction.status = action.payload.status;
        if (action.payload.blockNumber) {
          transaction.blockNumber = action.payload.blockNumber;
        }
      }
    },
    addTransaction: (state, action: PayloadAction<WalletTransaction>) => {
      state.transactions.unshift(action.payload);
    },
    updateBalance: (state, action: PayloadAction<{ symbol: string; balance: string; usdValue: number }>) => {
      const balance = state.balances.find(b => b.symbol === action.payload.symbol);
      if (balance) {
        balance.balance = action.payload.balance;
        balance.usdValue = action.payload.usdValue;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Connect Wallet
      .addCase(connectWallet.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(connectWallet.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isConnected = true;
        state.address = action.payload.address;
        state.chainId = action.payload.chainId;
        state.error = null;
      })
      .addCase(connectWallet.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to connect wallet';
      })
      // Disconnect Wallet
      .addCase(disconnectWallet.fulfilled, (state) => {
        state.isConnected = false;
        state.address = null;
        state.chainId = null;
        state.balances = [];
        state.transactions = [];
        state.error = null;
      })
      // Fetch Wallet Data
      .addCase(fetchWalletData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWalletData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.balances = action.payload.balances;
        state.transactions = action.payload.transactions;
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchWalletData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch wallet data';
      })
      // Send Transaction
      .addCase(sendTransaction.fulfilled, (state, action) => {
        state.transactions.unshift(action.payload);
      });
  },
});

export const { 
  clearError, 
  updateTransactionStatus, 
  addTransaction, 
  updateBalance 
} = walletSlice.actions;
export default walletSlice.reducer;