import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface MarketplaceAsset {
  id: string;
  name: string;
  type: 'real-estate' | 'art' | 'commodities' | 'luxury';
  location: string;
  image: string;
  price: number;
  tokenPrice: number;
  totalTokens: number;
  availableTokens: number;
  roi: number;
  change24h: number;
  category: string;
  verified: boolean;
  rating: number;
  investors: number;
  description?: string;
  minimumInvestment?: number;
  expectedROI?: number;
  duration?: number;
}

export interface MarketplaceFilters {
  category: string;
  priceRange: [number, number];
  roiRange: [number, number];
  verified: boolean | null;
  sortBy: 'trending' | 'price-high' | 'price-low' | 'roi' | 'change';
}

interface MarketplaceState {
  assets: MarketplaceAsset[];
  filteredAssets: MarketplaceAsset[];
  filters: MarketplaceFilters;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: MarketplaceState = {
  assets: [],
  filteredAssets: [],
  filters: {
    category: 'all',
    priceRange: [0, 10000],
    roiRange: [0, 50],
    verified: null,
    sortBy: 'trending',
  },
  searchQuery: '',
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Mock data
const mockAssets: MarketplaceAsset[] = [
  {
    id: '1',
    name: 'Manhattan Office Building',
    type: 'real-estate',
    location: 'New York, NY',
    image: 'https://images.pexels.com/photos/2380794/pexels-photo-2380794.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 2500000,
    tokenPrice: 125.50,
    totalTokens: 20000,
    availableTokens: 5500,
    roi: 8.5,
    change24h: 2.3,
    category: 'real-estate',
    verified: true,
    rating: 4.8,
    investors: 245,
    description: 'Prime commercial real estate in Manhattan financial district',
    minimumInvestment: 1000,
    expectedROI: 8.5,
    duration: 5,
  },
  {
    id: '2',
    name: 'Contemporary Art Collection',
    type: 'art',
    location: 'London, UK',
    image: 'https://images.pexels.com/photos/1572386/pexels-photo-1572386.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 850000,
    tokenPrice: 85.00,
    totalTokens: 10000,
    availableTokens: 2300,
    roi: 12.3,
    change24h: 5.7,
    category: 'art',
    verified: true,
    rating: 4.9,
    investors: 128,
    description: 'Curated collection of contemporary artworks from emerging artists',
    minimumInvestment: 500,
    expectedROI: 12.3,
    duration: 3,
  },
  {
    id: '3',
    name: 'Gold Mining Rights',
    type: 'commodities',
    location: 'Nevada, USA',
    image: 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 1200000,
    tokenPrice: 60.00,
    totalTokens: 20000,
    availableTokens: 8900,
    roi: 6.8,
    change24h: -1.2,
    category: 'commodities',
    verified: true,
    rating: 4.6,
    investors: 89,
    description: 'Mining rights for gold extraction in proven Nevada deposits',
    minimumInvestment: 2000,
    expectedROI: 6.8,
    duration: 10,
  },
  {
    id: '4',
    name: 'Luxury Watch Collection',
    type: 'luxury',
    location: 'Geneva, Switzerland',
    image: 'https://images.pexels.com/photos/1697214/pexels-photo-1697214.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 650000,
    tokenPrice: 65.00,
    totalTokens: 10000,
    availableTokens: 4200,
    roi: 15.2,
    change24h: 8.1,
    category: 'luxury',
    verified: true,
    rating: 4.7,
    investors: 156,
    description: 'Rare vintage watches from prestigious Swiss manufacturers',
    minimumInvestment: 1500,
    expectedROI: 15.2,
    duration: 2,
  },
];

// Async thunks
export const fetchMarketplaceAssets = createAsyncThunk(
  'marketplace/fetchAssets',
  async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return mockAssets;
  }
);

export const searchAssets = createAsyncThunk(
  'marketplace/searchAssets',
  async (query: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockAssets.filter(asset => 
      asset.name.toLowerCase().includes(query.toLowerCase()) ||
      asset.location.toLowerCase().includes(query.toLowerCase()) ||
      asset.type.toLowerCase().includes(query.toLowerCase())
    );
  }
);

const marketplaceSlice = createSlice({
  name: 'marketplace',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<MarketplaceFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.filteredAssets = applyFilters(state.assets, state.filters, state.searchQuery);
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      state.filteredAssets = applyFilters(state.assets, state.filters, action.payload);
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.searchQuery = '';
      state.filteredAssets = state.assets;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Assets
      .addCase(fetchMarketplaceAssets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMarketplaceAssets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.assets = action.payload;
        state.filteredAssets = applyFilters(action.payload, state.filters, state.searchQuery);
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchMarketplaceAssets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch assets';
      })
      // Search Assets
      .addCase(searchAssets.fulfilled, (state, action) => {
        state.filteredAssets = action.payload;
      });
  },
});

// Helper function to apply filters
function applyFilters(
  assets: MarketplaceAsset[], 
  filters: MarketplaceFilters, 
  searchQuery: string
): MarketplaceAsset[] {
  let filtered = [...assets];

  // Apply search query
  if (searchQuery) {
    filtered = filtered.filter(asset => 
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Apply category filter
  if (filters.category !== 'all') {
    filtered = filtered.filter(asset => asset.category === filters.category);
  }

  // Apply verified filter
  if (filters.verified !== null) {
    filtered = filtered.filter(asset => asset.verified === filters.verified);
  }

  // Apply price range filter
  filtered = filtered.filter(asset => 
    asset.tokenPrice >= filters.priceRange[0] && 
    asset.tokenPrice <= filters.priceRange[1]
  );

  // Apply ROI range filter
  filtered = filtered.filter(asset => 
    asset.roi >= filters.roiRange[0] && 
    asset.roi <= filters.roiRange[1]
  );

  // Apply sorting
  filtered.sort((a, b) => {
    switch (filters.sortBy) {
      case 'price-high':
        return b.tokenPrice - a.tokenPrice;
      case 'price-low':
        return a.tokenPrice - b.tokenPrice;
      case 'roi':
        return b.roi - a.roi;
      case 'change':
        return b.change24h - a.change24h;
      default: // trending
        return b.investors - a.investors;
    }
  });

  return filtered;
}

export const { setFilters, setSearchQuery, clearFilters, clearError } = marketplaceSlice.actions;
export default marketplaceSlice.reducer;