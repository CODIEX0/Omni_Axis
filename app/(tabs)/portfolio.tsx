import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, TrendingDown, DollarSign, Percent, ChartPie as PieChart, ChartBar as BarChart3, Calendar, Eye, EyeOff, ChevronRight } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { portfolioService } from '../../services/portfolioService';
import { demoDataService } from '../../services/demoDataService';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

const { width } = Dimensions.get('window');

export default function PortfolioScreen() {
  const { user, profile, isDemoMode, demoAccount } = useAuth();
  const [hideBalance, setHideBalance] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('1M');
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPortfolioData();
  }, [user, profile, isDemoMode, demoAccount]);

  const loadPortfolioData = async () => {
    try {
      setLoading(true);
      
      if (isDemoMode && demoAccount) {
        // Use demo portfolio data from service
        const demoPortfolio = demoDataService.getDemoPortfolio(demoAccount.id);
        const demoTransactions = demoDataService.getDemoTransactions(demoAccount.id);
        
        setPortfolioData({
          totalValue: demoPortfolio.totalValue,
          totalInvested: demoPortfolio.totalInvested,
          totalReturns: demoPortfolio.totalReturns,
          returnPercentage: ((demoPortfolio.totalReturns / demoPortfolio.totalInvested) * 100).toFixed(1),
          change24h: parseFloat(demoPortfolio.change24h),
          changeAmount: demoPortfolio.changeAmount,
          holdings: demoPortfolio.assets.map((asset, index) => ({
            id: index + 1,
            name: asset.assetTitle,
            type: asset.assetType,
            image: `https://images.unsplash.com/photo-${1486406146926 + index}?w=400`,
            tokens: asset.tokenAmount,
            tokenPrice: asset.currentValue / asset.tokenAmount,
            currentValue: asset.currentValue,
            investedAmount: asset.investedAmount,
            returnAmount: asset.returns,
            returnPercentage: asset.returnsPercentage,
            change24h: Math.random() * 10 - 5, // Random for demo
            allocation: ((asset.currentValue / demoPortfolio.totalValue) * 100).toFixed(1),
          })),
          transactions: demoTransactions.slice(0, 3).map(tx => ({
            id: tx.id,
            type: tx.type,
            asset: tx.assetTitle,
            tokens: tx.tokenAmount,
            price: tx.price,
            total: tx.amount,
            amount: tx.amount,
            date: new Date(tx.createdAt).toISOString().split('T')[0],
            time: new Date(tx.createdAt).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
          })),
        });
      } else if (user) {
        // Load real portfolio data
        const summary = await portfolioService.getInvestmentSummary(user.id);
        const portfolio = await portfolioService.getUserPortfolio(user.id);
        
        setPortfolioData({
          totalValue: summary.totalValue,
          totalInvested: summary.totalInvested,
          totalReturns: summary.totalReturns,
          returnPercentage: summary.totalReturns > 0 ? 
            ((summary.totalReturns / summary.totalInvested) * 100).toFixed(1) : 0,
          change24h: parseFloat(summary.change24h),
          changeAmount: summary.changeAmount,
          holdings: portfolio.assets.map((asset: any, index: number) => ({
            id: asset.id,
            name: asset.title,
            type: asset.asset_type.replace('_', ' ').toUpperCase(),
            image: asset.image_urls?.[0] || 'https://images.pexels.com/photos/2380794/pexels-photo-2380794.jpeg?auto=compress&cs=tinysrgb&w=400',
            tokens: 1, // This would come from blockchain data
            tokenPrice: asset.estimated_value,
            currentValue: asset.estimated_value,
            investedAmount: asset.estimated_value * 0.8, // Mock data
            returnAmount: asset.estimated_value * 0.2, // Mock data
            returnPercentage: 20, // Mock data
            change24h: Math.random() * 10 - 5, // Mock data
            allocation: (asset.estimated_value / summary.totalValue * 100).toFixed(1),
          })),
          transactions: portfolio.transactions.slice(0, 3).map((tx: any) => ({
            id: tx.id,
            type: tx.transaction_type,
            asset: tx.assets?.title || 'Unknown Asset',
            tokens: 1, // Mock data
            price: tx.amount,
            total: tx.amount,
            amount: tx.amount,
            date: new Date(tx.created_at).toISOString().split('T')[0],
            time: new Date(tx.created_at).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
          })),
        });
      }
    } catch (error) {
      console.error('Error loading portfolio data:', error);
      // Set default empty data
      setPortfolioData({
        totalValue: 0,
        totalInvested: 0,
        totalReturns: 0,
        returnPercentage: 0,
        change24h: 0,
        changeAmount: 0,
        holdings: [],
        transactions: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading portfolio..." />;
  }

  if (!portfolioData) {
    return <LoadingSpinner message="Loading portfolio..." />;
  }

  const periods = ['1D', '1W', '1M', '3M', '1Y', 'All'];

  // Calculate allocation data from holdings
  const allocationData = portfolioData.holdings.reduce((acc: any[], holding: any) => {
    const existingCategory = acc.find(item => item.category === holding.type);
    if (existingCategory) {
      existingCategory.percentage += parseFloat(holding.allocation);
    } else {
      acc.push({
        category: holding.type,
        percentage: parseFloat(holding.allocation),
        color: getColorForCategory(holding.type),
      });
    }
    return acc;
  }, []);

  function getColorForCategory(category: string): string {
    const colors: { [key: string]: string } = {
      'Real Estate': '#1E40AF',
      'REAL_ESTATE': '#1E40AF',
      'Art & Collectibles': '#8B5CF6',
      'ART': '#8B5CF6',
      'Commodities': '#F59E0B',
      'COMMODITIES': '#F59E0B',
      'Luxury Goods': '#EF4444',
      'COLLECTIBLES': '#EF4444',
    };
    return colors[category] || '#6B7280';
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Portfolio</Text>
          <TouchableOpacity onPress={() => setHideBalance(!hideBalance)}>
            {hideBalance ? (
              <EyeOff color="#1F2937" size={24} />
            ) : (
              <Eye color="#1F2937" size={24} />
            )}
          </TouchableOpacity>
        </View>

        {/* Portfolio Summary */}
        <LinearGradient
          colors={['#1E40AF', '#3B82F6']}
          style={styles.summaryCard}
        >
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Total Portfolio Value</Text>
            <View style={styles.changeIndicator}>
              <TrendingUp color="#10B981" size={16} />
              <Text style={styles.changeText}>
                +{portfolioData.change24h}%
              </Text>
            </View>
          </View>
          
          <Text style={styles.totalValue}>
            {hideBalance ? '••••••••' : `$${portfolioData.totalValue.toLocaleString()}`}
          </Text>
          
          <View style={styles.summaryStats}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Total Invested</Text>
              <Text style={styles.statValue}>
                {hideBalance ? '••••••••' : `$${portfolioData.totalInvested.toLocaleString()}`}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Total Returns</Text>
              <Text style={[styles.statValue, styles.positiveReturn]}>
                {hideBalance ? '••••••••' : `+$${portfolioData.totalReturns.toLocaleString()}`}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Performance Chart */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Performance</Text>
            <View style={styles.periodSelector}>
              {periods.map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.periodButton,
                    selectedPeriod === period && styles.periodButtonActive
                  ]}
                  onPress={() => setSelectedPeriod(period)}
                >
                  <Text style={[
                    styles.periodButtonText,
                    selectedPeriod === period && styles.periodButtonTextActive
                  ]}>
                    {period}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.chartPlaceholder}>
            <BarChart3 color="#6B7280" size={48} />
            <Text style={styles.chartPlaceholderText}>
              Performance chart would be displayed here
            </Text>
          </View>
        </View>

        {/* Asset Allocation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Asset Allocation</Text>
          
          <View style={styles.allocationContainer}>
            <View style={styles.allocationChart}>
              <PieChart color="#6B7280" size={120} />
              <View style={styles.allocationCenter}>
                <Text style={styles.allocationCenterText}>Portfolio</Text>
                <Text style={styles.allocationCenterSubtext}>Breakdown</Text>
              </View>
            </View>
            
            <View style={styles.allocationLegend}>
              {allocationData.map((item: any, index: number) => (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                  <View style={styles.legendContent}>
                    <Text style={styles.legendLabel}>{item.category}</Text>
                    <Text style={styles.legendPercentage}>{item.percentage}%</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Holdings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Holdings</Text>
          
          <View style={styles.holdingsContainer}>
            {portfolioData.holdings.map((holding: any) => (
              <TouchableOpacity key={holding.id} style={styles.holdingCard}>
                <Image source={{ uri: holding.image }} style={styles.holdingImage} />
                
                <View style={styles.holdingInfo}>
                  <Text style={styles.holdingType}>{holding.type}</Text>
                  <Text style={styles.holdingName} numberOfLines={1}>
                    {holding.name}
                  </Text>
                  <Text style={styles.holdingTokens}>
                    {holding.tokens} tokens @ ${holding.tokenPrice}
                  </Text>
                </View>

                <View style={styles.holdingMetrics}>
                  <Text style={styles.holdingValue}>
                    ${holding.currentValue.toLocaleString()}
                  </Text>
                  <View style={styles.holdingReturn}>
                    {holding.returnPercentage >= 0 ? (
                      <TrendingUp color="#10B981" size={12} />
                    ) : (
                      <TrendingDown color="#EF4444" size={12} />
                    )}
                    <Text style={[
                      styles.holdingReturnText,
                      { color: holding.returnPercentage >= 0 ? '#10B981' : '#EF4444' }
                    ]}>
                      {holding.returnPercentage >= 0 ? '+' : ''}{holding.returnPercentage}%
                    </Text>
                  </View>
                  <Text style={styles.holdingAllocation}>
                    {holding.allocation}% of portfolio
                  </Text>
                </View>

                <ChevronRight color="#6B7280" size={20} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.transactionsContainer}>
            {portfolioData.transactions.map((transaction: any) => (
              <TouchableOpacity key={transaction.id} style={styles.transactionItem}>
                <View style={[
                  styles.transactionIcon,
                  { 
                    backgroundColor: 
                      transaction.type === 'buy' ? '#10B981' :
                      transaction.type === 'sell' ? '#EF4444' : '#F59E0B'
                  }
                ]}>
                  {transaction.type === 'buy' ? (
                    <TrendingUp color="#FFFFFF" size={16} />
                  ) : transaction.type === 'sell' ? (
                    <TrendingDown color="#FFFFFF" size={16} />
                  ) : (
                    <DollarSign color="#FFFFFF" size={16} />
                  )}
                </View>
                
                <View style={styles.transactionContent}>
                  <Text style={styles.transactionTitle}>
                    {transaction.type === 'buy' ? 'Purchased' :
                     transaction.type === 'sell' ? 'Sold' : 'Dividend received'}
                    {transaction.tokens && ` ${transaction.tokens} tokens`}
                  </Text>
                  <Text style={styles.transactionAsset}>{transaction.asset}</Text>
                  <Text style={styles.transactionDate}>
                    {transaction.date} at {transaction.time}
                  </Text>
                </View>
                
                <Text style={styles.transactionAmount}>
                  {transaction.type === 'dividend' ? 
                    `+${transaction.amount}` :
                    `${transaction.total?.toLocaleString()}`
                  }
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  summaryCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  changeText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#10B981',
    marginLeft: 4,
  },
  totalValue: {
    fontSize: 36,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  positiveReturn: {
    color: '#10B981',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1E40AF',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  periodButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  periodButtonTextActive: {
    color: '#1F2937',
  },
  chartPlaceholder: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    marginHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartPlaceholderText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
  },
  allocationContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  allocationChart: {
    position: 'relative',
    marginRight: 20,
  },
  allocationCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -30 }, { translateY: -20 }],
    alignItems: 'center',
  },
  allocationCenterText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  allocationCenterSubtext: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  allocationLegend: {
    flex: 1,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  legendContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
  },
  legendPercentage: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  holdingsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  holdingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  holdingImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
  },
  holdingInfo: {
    flex: 1,
  },
  holdingType: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  holdingName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  holdingTokens: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  holdingMetrics: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  holdingValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  holdingReturn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  holdingReturnText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 4,
  },
  holdingAllocation: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  transactionsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  transactionContent: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 2,
  },
  transactionAsset: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  transactionAmount: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
});