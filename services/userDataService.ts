import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';
import { portfolioService } from './portfolioService';

export interface UserDashboardData {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  portfolio: {
    totalValue: number;
    totalInvested: number;
    totalReturns: number;
    change24h: string;
    changeAmount: number;
    assetCount: number;
  };
  recentActivity: any[];
  marketInsights: any[];
}

export const userDataService = {
  // Get comprehensive dashboard data for real users
  async getDashboardData(user: User, profile: any): Promise<UserDashboardData> {
    try {
      // Get portfolio data
      const portfolioData = await portfolioService.getInvestmentSummary(user.id);
      
      // Get recent activity
      const recentActivity = await this.getRecentActivity(user.id);
      
      // Get market insights (this could be from external API or calculated)
      const marketInsights = await this.getMarketInsights();

      return {
        user: {
          firstName: profile?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'User',
          lastName: profile?.full_name?.split(' ').slice(1).join(' ') || '',
          email: user.email || '',
          avatar: profile?.avatar_url,
        },
        portfolio: portfolioData,
        recentActivity,
        marketInsights,
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      return this.getDefaultDashboardData(user, profile);
    }
  },

  // Get recent user activity
  async getRecentActivity(userId: string) {
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          *,
          assets!inner(title, asset_type)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching recent activity:', error);
        return [];
      }

      return transactions?.map(tx => ({
        id: tx.id,
        type: tx.transaction_type,
        title: this.getActivityTitle(tx.transaction_type, tx.amount),
        subtitle: tx.assets?.title || 'Unknown Asset',
        amount: tx.amount,
        time: this.formatTimeAgo(tx.created_at),
        status: tx.status,
      })) || [];
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return [];
    }
  },

  // Get market insights (mock data for now, could be real market data)
  async getMarketInsights() {
    // This could fetch real market data from external APIs
    return [
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
    ];
  },

  // Get user's assets for marketplace
  async getUserAssets(userId: string) {
    try {
      const { data: assets, error } = await supabase
        .from('assets')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user assets:', error);
        return [];
      }

      return assets || [];
    } catch (error) {
      console.error('Error getting user assets:', error);
      return [];
    }
  },

  // Get marketplace assets (all listed assets)
  async getMarketplaceAssets() {
    try {
      const { data: assets, error } = await supabase
        .from('assets')
        .select(`
          *,
          user_profiles!inner(full_name)
        `)
        .eq('is_listed', true)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching marketplace assets:', error);
        return [];
      }

      return assets?.map(asset => ({
        id: asset.id,
        title: asset.title,
        description: asset.description,
        assetType: asset.asset_type,
        estimatedValue: asset.estimated_value,
        listingPrice: asset.listing_price,
        imageUrls: asset.image_urls || [],
        ownerName: asset.user_profiles?.full_name || 'Unknown',
        status: asset.status,
        createdAt: asset.created_at,
      })) || [];
    } catch (error) {
      console.error('Error getting marketplace assets:', error);
      return [];
    }
  },

  // Helper functions
  getActivityTitle(type: string, amount: number): string {
    switch (type) {
      case 'buy':
        return `Purchased tokens`;
      case 'sell':
        return `Sold tokens`;
      case 'mint':
        return `Minted new tokens`;
      case 'transfer':
        return `Transferred tokens`;
      default:
        return `Transaction`;
    }
  },

  formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} weeks ago`;
  },

  // Default data for when real data is not available
  getDefaultDashboardData(user: User, profile: any): UserDashboardData {
    return {
      user: {
        firstName: profile?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'User',
        lastName: profile?.full_name?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        avatar: profile?.avatar_url,
      },
      portfolio: {
        totalValue: 0,
        totalInvested: 0,
        totalReturns: 0,
        change24h: '0.00',
        changeAmount: 0,
        assetCount: 0,
      },
      recentActivity: [],
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
  },
};