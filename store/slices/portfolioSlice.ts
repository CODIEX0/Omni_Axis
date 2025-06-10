import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Asset {
  id: string;
  name: string;
  type: 'real-estate' | 'art' | 'commodities' | 'luxury';
  image: string;
  tokens: number;
  tokenPrice: number;
  currentValue: number;
  investedAmount: number;
  returnAmount: number;
  returnPercentage: number;
  change24h: number;
  allocation: number;
  location?: string;
  description?: string;
}

export interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'dividend' | 'transfer';
  assetId: string;
  assetName: string;
  tokens?: number;
  price?: number;
  amount: number;
  date: string;
  status: 'pending' | 'confirmed' | 'failed';
  txHash?: string;
}

export interface PortfolioSummary {
  totalValue: number;
  totalInvested: number;
  totalReturns: number;
  returnPercentage: number;
  change24h: number;
  changeAmount: number;
}

interface PortfolioState {
  summary: PortfolioSummary;
  assets: Asset[];
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: PortfolioState = {
  summary: {
    totalValue: 0,
    totalInvested: 0,
    totalReturns: 0,
    returnPercentage: 0,
    change24h: 0,
    changeAmount: 0,
  },
  assets: [],
  transactions: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Mock data
const mockAssets: Asset[] = [
  {
    id: '1',
    name: 'Manhattan Office Building',
    type: 'real-estate',
    image: 'https://images.pexels.com/photos/2380794/pexels-photo-2380794.jpeg?auto=compress&cs=tinysrgb&w=400',
    tokens: 120,
    tokenPrice: 125.50,
    currentValue: 15060.00,
    investedAmount: 12000.00,
    returnAmount: 3060.00,
    returnPercentage: 25.5,
    change24h: 2.3,
    allocation: 12.0,
    location: 'New York, NY',
  },
  {
    id: '2',
    name: 'Contemporary Art Collection',
    type: 'art',
    image: 'https://images.pexels.com/photos/1572386/pexels-photo-1572386.jpeg?auto=compress&cs=tinysrgb&w=400',
    tokens: 85,
    tokenPrice: 89.75,
    currentValue: 7628.75,
    investedAmount: 6800.00,
    returnAmount: 828.75,
    returnPercentage: 12.2,
    change24h: 5.7,
    allocation: 6.1,
    location: 'London, UK',
  },
];

const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'buy',
    assetId: '1',
    assetName: 'Manhattan Office Building',
    tokens: 50,
    price: 125.50,
    amount: 6275.00,
    date: '2024-01-15T14:30:00Z',
    status: 'confirmed',
    txHash: '0x1234567890abcdef',
  },
  {
    id: '2',
    type: 'dividend',
    assetId: '2',
    assetName: 'Art Collection #247',
    amount: 125.50,
    date: '2024-01-14T09:00:00Z',
    status: 'confirmed',
    txHash: '0xabcdef1234567890',
  },
];

// Async thunks
export const fetchPortfolio = createAsyncThunk(
  'portfolio/fetchPortfolio',
  async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const totalValue = mockAssets.reduce((sum, asset) => sum + asset.currentValue, 0);
    const totalInvested = mockAssets.reduce((sum, asset) => sum + asset.investedAmount, 0);
    const totalReturns = totalValue - totalInvested;
    const returnPercentage = (totalReturns / totalInvested) * 100;

    const summary: PortfolioSummary = {
      totalValue,
      totalInvested,
      totalReturns,
      returnPercentage,
      change24h: 3.2,
      changeAmount: 3896.30,
    };

    return {
      summary,
      assets: mockAssets,
      transactions: mockTransactions,
    };
  }
);

export const buyAsset = createAsyncThunk(
  'portfolio/buyAsset',
  async ({ assetId, tokens, price }: { assetId: string; tokens: number; price: number }) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: 'buy',
      assetId,
      assetName: 'Asset Name',
      tokens,
      price,
      amount: tokens * price,
      date: new Date().toISOString(),
      status: 'confirmed',
      txHash: '0x' + Math.random().toString(16).substr(2, 40),
    };

    return transaction;
  }
);

export const sellAsset = createAsyncThunk(
  'portfolio/sellAsset',
  async ({ assetId, tokens, price }: { assetId: string; tokens: number; price: number }) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: 'sell',
      assetId,
      assetName: 'Asset Name',
      tokens,
      price,
      amount: tokens * price,
      date: new Date().toISOString(),
      status: 'confirmed',
      txHash: '0x' + Math.random().toString(16).substr(2, 40),
    };

    return transaction;
  }
);

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      state.transactions.unshift(action.payload);
    },
    updateAssetPrice: (state, action: PayloadAction<{ assetId: string; price: number }>) => {
      const asset = state.assets.find(a => a.id === action.payload.assetId);
      if (asset) {
        asset.tokenPrice = action.payload.price;
        asset.currentValue = asset.tokens * action.payload.price;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Portfolio
      .addCase(fetchPortfolio.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPortfolio.fulfilled, (state, action) => {
        state.isLoading = false;
        state.summary = action.payload.summary;
        state.assets = action.payload.assets;
        state.transactions = action.payload.transactions;
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchPortfolio.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch portfolio';
      })
      // Buy Asset
      .addCase(buyAsset.fulfilled, (state, action) => {
        state.transactions.unshift(action.payload);
      })
      // Sell Asset
      .addCase(sellAsset.fulfilled, (state, action) => {
        state.transactions.unshift(action.payload);
      });
  },
});

export const { clearError, addTransaction, updateAssetPrice } = portfolioSlice.actions;
export default portfolioSlice.reducer;