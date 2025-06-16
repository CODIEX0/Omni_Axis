import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

export interface UserPortfolio {
  totalInvestments: number;
  portfolioAssets: number;
  totalReturns: number;
  assets: any[];
  transactions: any[];
}

export const portfolioService = {
  // Get user's portfolio data
  async getUserPortfolio(userId: string): Promise<UserPortfolio> {
    try {
      // Get user's assets
      const { data: assets, error: assetsError } = await supabase
        .from('assets')
        .select('*')
        .eq('owner_id', userId);

      if (assetsError) {
        console.error('Error fetching user assets:', assetsError);
      }

      // Get user's transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId);

      if (transactionsError) {
        console.error('Error fetching user transactions:', transactionsError);
      }

      // Calculate portfolio metrics
      const userAssets = assets || [];
      const userTransactions = transactions || [];

      // Calculate total investments (sum of all buy transactions)
      const totalInvestments = userTransactions
        .filter(tx => tx.transaction_type === 'buy' && tx.status === 'confirmed')
        .reduce((sum, tx) => sum + tx.amount, 0);

      // Calculate current portfolio value (sum of current asset values)
      const currentPortfolioValue = userAssets
        .filter(asset => asset.status === 'tokenized')
        .reduce((sum, asset) => sum + (asset.estimated_value || 0), 0);

      // Calculate total returns
      const totalReturns = currentPortfolioValue - totalInvestments;

      return {
        totalInvestments,
        portfolioAssets: userAssets.length,
        totalReturns,
        assets: userAssets,
        transactions: userTransactions,
      };
    } catch (error) {
      console.error('Error getting user portfolio:', error);
      return {
        totalInvestments: 0,
        portfolioAssets: 0,
        totalReturns: 0,
        assets: [],
        transactions: [],
      };
    }
  },

  // Get user's investment summary
  async getInvestmentSummary(userId: string) {
    try {
      const portfolio = await this.getUserPortfolio(userId);
      
      return {
        totalValue: portfolio.totalInvestments + portfolio.totalReturns,
        totalInvested: portfolio.totalInvestments,
        totalReturns: portfolio.totalReturns,
        assetCount: portfolio.portfolioAssets,
        change24h: portfolio.totalReturns > 0 ? 
          ((portfolio.totalReturns / portfolio.totalInvestments) * 100).toFixed(2) : '0.00',
        changeAmount: portfolio.totalReturns,
      };
    } catch (error) {
      console.error('Error getting investment summary:', error);
      return {
        totalValue: 0,
        totalInvested: 0,
        totalReturns: 0,
        assetCount: 0,
        change24h: '0.00',
        changeAmount: 0,
      };
    }
  },

  // Get user's asset performance
  async getAssetPerformance(userId: string) {
    try {
      const { data: assets, error } = await supabase
        .from('assets')
        .select(`
          *,
          transactions!inner(*)
        `)
        .eq('owner_id', userId);

      if (error) {
        console.error('Error fetching asset performance:', error);
        return [];
      }

      return assets?.map(asset => ({
        id: asset.id,
        name: asset.title,
        type: asset.asset_type,
        currentValue: asset.estimated_value,
        purchasePrice: asset.transactions
          ?.filter((tx: any) => tx.transaction_type === 'buy')
          ?.reduce((sum: number, tx: any) => sum + tx.amount, 0) || 0,
        performance: asset.estimated_value > 0 ? 
          (((asset.estimated_value - (asset.transactions
            ?.filter((tx: any) => tx.transaction_type === 'buy')
            ?.reduce((sum: number, tx: any) => sum + tx.amount, 0) || 0)) / 
            (asset.transactions
              ?.filter((tx: any) => tx.transaction_type === 'buy')
              ?.reduce((sum: number, tx: any) => sum + tx.amount, 0) || 1)) * 100).toFixed(2) : '0.00',
        status: asset.status,
      })) || [];
    } catch (error) {
      console.error('Error getting asset performance:', error);
      return [];
    }
  },
};