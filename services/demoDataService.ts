import { demoAccountService, DemoAccount } from './demoAccounts';

export interface DemoAsset {
  id: string;
  title: string;
  description: string;
  assetType: 'real_estate' | 'art' | 'commodities' | 'collectibles' | 'bonds' | 'equity';
  estimatedValue: number;
  listingPrice: number;
  tokenId: string;
  totalTokens: number;
  availableTokens: number;
  minimumInvestment: number;
  expectedROI: number;
  duration: number;
  status: 'pending' | 'approved' | 'active' | 'sold_out';
  ownerName: string;
  ownerId: string;
  imageUrls: string[];
  location?: string;
  createdAt: string;
  updatedAt: string;
  features: string[];
  riskLevel: 'low' | 'medium' | 'high';
  yieldType: 'rental' | 'appreciation' | 'dividend' | 'interest';
}

export interface DemoTransaction {
  id: string;
  userId: string;
  assetId: string;
  assetTitle: string;
  type: 'buy' | 'sell' | 'mint' | 'transfer' | 'dividend';
  amount: number;
  tokenAmount: number;
  price: number;
  status: 'pending' | 'confirmed' | 'failed';
  txHash: string;
  createdAt: string;
  gasUsed?: number;
  gasFee?: number;
}

export interface DemoPortfolio {
  totalValue: number;
  totalInvested: number;
  totalReturns: number;
  change24h: string;
  changeAmount: number;
  assetCount: number;
  assets: {
    assetId: string;
    assetTitle: string;
    assetType: string;
    tokenAmount: number;
    currentValue: number;
    investedAmount: number;
    returns: number;
    returnsPercentage: number;
    lastUpdated: string;
  }[];
  recentActivity: {
    id: string;
    type: string;
    title: string;
    subtitle: string;
    amount: number;
    time: string;
    status: string;
  }[];
}

class DemoDataService {
  private demoAssets: DemoAsset[] = [
    {
      id: 'asset-001',
      title: 'Manhattan Office Building',
      description: 'Prime commercial real estate in Manhattan financial district with high rental yield and appreciation potential. This 25-story office building features modern amenities, excellent location, and stable tenant base.',
      assetType: 'real_estate',
      estimatedValue: 2500000,
      listingPrice: 125.50,
      tokenId: 'MNHT001',
      totalTokens: 20000,
      availableTokens: 15000,
      minimumInvestment: 1000,
      expectedROI: 8.5,
      duration: 5,
      status: 'active',
      ownerName: 'PropertyDev Holdings LLC',
      ownerId: 'issuer-001',
      imageUrls: [
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400',
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400',
        'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400'
      ],
      location: 'Manhattan, New York',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-06-15T14:30:00Z',
      features: ['Prime Location', 'Stable Tenants', 'Modern Amenities', 'High Yield'],
      riskLevel: 'medium',
      yieldType: 'rental'
    },
    {
      id: 'asset-002',
      title: 'Contemporary Art Collection',
      description: 'Curated collection of contemporary artworks from emerging and established artists with strong market performance and gallery representation.',
      assetType: 'art',
      estimatedValue: 850000,
      listingPrice: 42.75,
      tokenId: 'ART002',
      totalTokens: 20000,
      availableTokens: 12000,
      minimumInvestment: 500,
      expectedROI: 12.0,
      duration: 3,
      status: 'active',
      ownerName: 'Art Gallery LLC',
      ownerId: 'issuer-001',
      imageUrls: [
        'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
        'https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=400'
      ],
      location: 'Chelsea, New York',
      createdAt: '2024-02-20T09:00:00Z',
      updatedAt: '2024-06-10T16:45:00Z',
      features: ['Curated Collection', 'Gallery Representation', 'Emerging Artists', 'High Growth'],
      riskLevel: 'high',
      yieldType: 'appreciation'
    },
    {
      id: 'asset-003',
      title: 'Gold Mining Rights',
      description: 'Mining rights for gold extraction in proven Nevada deposits with established infrastructure and experienced mining operations team.',
      assetType: 'commodities',
      estimatedValue: 1200000,
      listingPrice: 60.00,
      tokenId: 'GOLD003',
      totalTokens: 20000,
      availableTokens: 8000,
      minimumInvestment: 2000,
      expectedROI: 15.0,
      duration: 7,
      status: 'active',
      ownerName: 'Mining Ventures Inc',
      ownerId: 'issuer-001',
      imageUrls: [
        'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=400',
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400'
      ],
      location: 'Nevada, USA',
      createdAt: '2024-03-10T11:30:00Z',
      updatedAt: '2024-06-12T09:15:00Z',
      features: ['Proven Deposits', 'Established Infrastructure', 'Experienced Team', 'Commodity Exposure'],
      riskLevel: 'high',
      yieldType: 'appreciation'
    },
    {
      id: 'asset-004',
      title: 'Vintage Watch Collection',
      description: 'Rare vintage watches from prestigious Swiss manufacturers with authenticated provenance and strong collector demand.',
      assetType: 'collectibles',
      estimatedValue: 450000,
      listingPrice: 22.50,
      tokenId: 'WATCH004',
      totalTokens: 20000,
      availableTokens: 18000,
      minimumInvestment: 250,
      expectedROI: 10.0,
      duration: 4,
      status: 'active',
      ownerName: 'Timepiece Collectors Ltd',
      ownerId: 'issuer-001',
      imageUrls: [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
        'https://images.unsplash.com/photo-1594534475808-b18fc33b045e?w=400'
      ],
      location: 'Geneva, Switzerland',
      createdAt: '2024-04-05T14:20:00Z',
      updatedAt: '2024-06-08T12:00:00Z',
      features: ['Authenticated Provenance', 'Swiss Manufacturers', 'Collector Demand', 'Luxury Market'],
      riskLevel: 'medium',
      yieldType: 'appreciation'
    },
    {
      id: 'asset-005',
      title: 'Corporate Bonds Portfolio',
      description: 'Diversified portfolio of investment-grade corporate bonds from Fortune 500 companies with stable returns.',
      assetType: 'bonds',
      estimatedValue: 1000000,
      listingPrice: 50.00,
      tokenId: 'BOND005',
      totalTokens: 20000,
      availableTokens: 16000,
      minimumInvestment: 1000,
      expectedROI: 6.5,
      duration: 3,
      status: 'active',
      ownerName: 'Fixed Income Partners',
      ownerId: 'issuer-001',
      imageUrls: [
        'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400'
      ],
      location: 'New York, USA',
      createdAt: '2024-05-01T08:00:00Z',
      updatedAt: '2024-06-14T10:30:00Z',
      features: ['Investment Grade', 'Fortune 500', 'Stable Returns', 'Diversified'],
      riskLevel: 'low',
      yieldType: 'interest'
    }
  ];

  private generateDemoTransactions(userId: string): DemoTransaction[] {
    const baseTransactions: Omit<DemoTransaction, 'id' | 'userId' | 'createdAt' | 'txHash'>[] = [
      {
        assetId: 'asset-001',
        assetTitle: 'Manhattan Office Building',
        type: 'buy',
        amount: 6275,
        tokenAmount: 50,
        price: 125.50,
        status: 'confirmed',
        gasUsed: 21000,
        gasFee: 15.50
      },
      {
        assetId: 'asset-002',
        assetTitle: 'Contemporary Art Collection',
        type: 'dividend',
        amount: 125.50,
        tokenAmount: 0,
        price: 0,
        status: 'confirmed',
        gasUsed: 18000,
        gasFee: 12.30
      },
      {
        assetId: 'asset-003',
        assetTitle: 'Gold Mining Rights',
        type: 'sell',
        amount: 1500,
        tokenAmount: 25,
        price: 60.00,
        status: 'confirmed',
        gasUsed: 25000,
        gasFee: 18.75
      },
      {
        assetId: 'asset-004',
        assetTitle: 'Vintage Watch Collection',
        type: 'buy',
        amount: 450,
        tokenAmount: 20,
        price: 22.50,
        status: 'pending',
        gasUsed: 22000,
        gasFee: 14.20
      }
    ];

    return baseTransactions.map((tx, index) => ({
      ...tx,
      id: `tx-${userId}-${index + 1}`,
      userId,
      createdAt: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)).toISOString(),
      txHash: `0x${Math.random().toString(16).substr(2, 64)}`
    }));
  }

  private generateDemoPortfolio(userId: string): DemoPortfolio {
    const assets = [
      {
        assetId: 'asset-001',
        assetTitle: 'Manhattan Office Building',
        assetType: 'Real Estate',
        tokenAmount: 50,
        currentValue: 6500.00,
        investedAmount: 6275.00,
        returns: 225.00,
        returnsPercentage: 3.6,
        lastUpdated: '2024-06-15T10:00:00Z'
      },
      {
        assetId: 'asset-002',
        assetTitle: 'Contemporary Art Collection',
        assetType: 'Art',
        tokenAmount: 30,
        currentValue: 1350.00,
        investedAmount: 1282.50,
        returns: 67.50,
        returnsPercentage: 5.3,
        lastUpdated: '2024-06-15T10:00:00Z'
      },
      {
        assetId: 'asset-004',
        assetTitle: 'Vintage Watch Collection',
        assetType: 'Collectibles',
        tokenAmount: 20,
        currentValue: 480.00,
        investedAmount: 450.00,
        returns: 30.00,
        returnsPercentage: 6.7,
        lastUpdated: '2024-06-15T10:00:00Z'
      }
    ];

    const totalValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
    const totalInvested = assets.reduce((sum, asset) => sum + asset.investedAmount, 0);
    const totalReturns = totalValue - totalInvested;

    return {
      totalValue,
      totalInvested,
      totalReturns,
      change24h: '2.8',
      changeAmount: 230.50,
      assetCount: assets.length,
      assets,
      recentActivity: [
        {
          id: '1',
          type: 'buy',
          title: 'Purchased 50 tokens',
          subtitle: 'Manhattan Office Building',
          amount: 6275,
          time: '2 hours ago',
          status: 'confirmed',
        },
        {
          id: '2',
          type: 'transfer',
          title: 'Dividend received',
          subtitle: 'Art Collection #247',
          amount: 125.50,
          time: '1 day ago',
          status: 'confirmed',
        },
        {
          id: '3',
          type: 'sell',
          title: 'Sold 25 tokens',
          subtitle: 'Gold Mining Rights',
          amount: 1500,
          time: '3 days ago',
          status: 'confirmed',
        },
      ]
    };
  }

  /**
   * Get all demo assets
   */
  getDemoAssets(): DemoAsset[] {
    return this.demoAssets;
  }

  /**
   * Get demo assets by type
   */
  getDemoAssetsByType(assetType: string): DemoAsset[] {
    if (assetType === 'all') return this.demoAssets;
    return this.demoAssets.filter(asset => asset.assetType === assetType);
  }

  /**
   * Get demo asset by ID
   */
  getDemoAssetById(id: string): DemoAsset | null {
    return this.demoAssets.find(asset => asset.id === id) || null;
  }

  /**
   * Get demo portfolio for user
   */
  getDemoPortfolio(userId: string): DemoPortfolio {
    return this.generateDemoPortfolio(userId);
  }

  /**
   * Get demo transactions for user
   */
  getDemoTransactions(userId: string): DemoTransaction[] {
    return this.generateDemoTransactions(userId);
  }

  /**
   * Get demo dashboard data for user
   */
  getDemoDashboardData(demoAccount: DemoAccount) {
    const portfolio = this.generateDemoPortfolio(demoAccount.id);
    
    return {
      user: {
        firstName: demoAccount.profile.firstName,
        lastName: demoAccount.profile.lastName,
        email: demoAccount.email,
        avatar: demoAccount.profile.profileImage,
      },
      portfolio: {
        totalValue: portfolio.totalValue,
        totalInvested: portfolio.totalInvested,
        totalReturns: portfolio.totalReturns,
        change24h: portfolio.change24h,
        changeAmount: portfolio.changeAmount,
        assetCount: portfolio.assetCount,
      },
      recentActivity: portfolio.recentActivity,
      marketInsights: [
        {
          category: 'Real Estate',
          change: '+12.5%',
          period: 'This month',
          icon: 'Building',
          color: '#1E40AF',
        },
        {
          category: 'Art & Collectibles',
          change: '+8.7%',
          period: 'This month',
          icon: 'Palette',
          color: '#8B5CF6',
        },
        {
          category: 'Commodities',
          change: '+5.2%',
          period: 'This month',
          icon: 'DollarSign',
          color: '#F59E0B',
        },
      ],
    };
  }

  /**
   * Simulate asset purchase
   */
  simulateAssetPurchase(assetId: string, tokenAmount: number, userId: string): {
    success: boolean;
    transaction?: DemoTransaction;
    error?: string;
  } {
    const asset = this.getDemoAssetById(assetId);
    if (!asset) {
      return { success: false, error: 'Asset not found' };
    }

    if (tokenAmount > asset.availableTokens) {
      return { success: false, error: 'Insufficient tokens available' };
    }

    const totalCost = tokenAmount * asset.listingPrice;
    
    // Simulate successful purchase
    const transaction: DemoTransaction = {
      id: `tx-${Date.now()}`,
      userId,
      assetId,
      assetTitle: asset.title,
      type: 'buy',
      amount: totalCost,
      tokenAmount,
      price: asset.listingPrice,
      status: 'confirmed',
      txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      createdAt: new Date().toISOString(),
      gasUsed: 21000,
      gasFee: 15.50
    };

    // Update available tokens
    asset.availableTokens -= tokenAmount;

    return { success: true, transaction };
  }

  /**
   * Simulate asset tokenization
   */
  simulateAssetTokenization(assetData: any, userId: string): {
    success: boolean;
    tokenId?: string;
    error?: string;
  } {
    // Simulate successful tokenization
    const tokenId = `TOKEN${Date.now()}`;
    
    const newAsset: DemoAsset = {
      id: `asset-${Date.now()}`,
      title: assetData.title,
      description: assetData.description,
      assetType: assetData.assetType,
      estimatedValue: assetData.estimatedValue,
      listingPrice: assetData.estimatedValue / 20000, // Default to 20k tokens
      tokenId,
      totalTokens: 20000,
      availableTokens: 20000,
      minimumInvestment: assetData.minimumInvestment || 1000,
      expectedROI: assetData.expectedROI || 8.0,
      duration: assetData.duration || 5,
      status: 'pending',
      ownerName: 'Demo User',
      ownerId: userId,
      imageUrls: assetData.imageUris || [],
      location: assetData.location,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      features: ['Demo Asset', 'Tokenized', 'Pending Approval'],
      riskLevel: 'medium',
      yieldType: 'appreciation'
    };

    // Add to demo assets (in real app, this would be saved to database)
    this.demoAssets.push(newAsset);

    return { success: true, tokenId };
  }

  /**
   * Get demo market statistics
   */
  getDemoMarketStats() {
    const totalAssets = this.demoAssets.length;
    const totalValue = this.demoAssets.reduce((sum, asset) => sum + asset.estimatedValue, 0);
    const totalTokens = this.demoAssets.reduce((sum, asset) => sum + asset.totalTokens, 0);
    const activeAssets = this.demoAssets.filter(asset => asset.status === 'active').length;

    return {
      totalAssets,
      totalValue,
      totalTokens,
      activeAssets,
      averageROI: 9.2,
      totalInvestors: 1247,
      monthlyGrowth: 15.3
    };
  }

  /**
   * Get demo KYC status
   */
  getDemoKYCStatus(userId: string) {
    return {
      status: 'verified',
      level: 'enhanced',
      completedAt: '2024-01-15T10:00:00Z',
      documents: [
        { type: 'identity', status: 'approved', uploadedAt: '2024-01-15T09:00:00Z' },
        { type: 'address', status: 'approved', uploadedAt: '2024-01-15T09:15:00Z' },
        { type: 'income', status: 'approved', uploadedAt: '2024-01-15T09:30:00Z' }
      ]
    };
  }
}

export const demoDataService = new DemoDataService();
export default demoDataService;