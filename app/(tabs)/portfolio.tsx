import React, { useState } from 'react';
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

const { width } = Dimensions.get('window');

export default function PortfolioScreen() {
  const [hideBalance, setHideBalance] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('1M');

  const portfolioData = {
    totalValue: 125480.50,
    totalInvested: 98500.00,
    totalReturns: 26980.50,
    returnPercentage: 27.4,
    change24h: 3.2,
    changeAmount: 3896.30,
  };

  const periods = ['1D', '1W', '1M', '3M', '1Y', 'All'];

  const holdings = [
    {
      id: 1,
      name: 'Manhattan Office Building',
      type: 'Real Estate',
      image: 'https://images.pexels.com/photos/2380794/pexels-photo-2380794.jpeg?auto=compress&cs=tinysrgb&w=400',
      tokens: 120,
      tokenPrice: 125.50,
      currentValue: 15060.00,
      investedAmount: 12000.00,
      returnAmount: 3060.00,
      returnPercentage: 25.5,
      change24h: 2.3,
      
      allocation: 12.0,
    },
    {
      id: 2,
      name: 'Contemporary Art Collection',
      type: 'Art & Collectibles',
      image: 'https://images.pexels.com/photos/1572386/pexels-photo-1572386.jpeg?auto=compress&cs=tinysrgb&w=400',
      tokens: 85,
      tokenPrice: 89.75,
      currentValue: 7628.75,
      investedAmount: 6800.00,
      returnAmount: 828.75,
      returnPercentage: 12.2,
      change24h: 5.7,
      allocation: 6.1,
    },
    {
      id: 3,
      name: 'Gold Mining Rights',
      type: 'Commodities',
      image: 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg?auto=compress&cs=tinysrgb&w=400',
      tokens: 200,
      tokenPrice: 58.20,
      currentValue: 11640.00,
      investedAmount: 12000.00,
      returnAmount: -360.00,
      returnPercentage: -3.0,
      change24h: -1.2,
      allocation: 9.3,
    },
    {
      id: 4,
      name: 'Luxury Watch Collection',
      type: 'Luxury Goods',
      image: 'https://images.pexels.com/photos/1697214/pexels-photo-1697214.jpeg?auto=compress&cs=tinysrgb&w=400',
      tokens: 45,
      tokenPrice: 72.80,
      currentValue: 3276.00,
      investedAmount: 2925.00,
      returnAmount: 351.00,
      returnPercentage: 12.0,
      change24h: 8.1,
      allocation: 2.6,
    },
  ];

  const transactions = [
    {
      id: 1,
      type: 'buy',
      asset: 'Manhattan Office Building',
      tokens: 50,
      price: 125.50,
      total: 6275.00,
      date: '2024-01-15',
      time: '14:30',
    },
    {
      id: 2,
      type: 'dividend',
      asset: 'Art Collection #247',
      amount: 125.50,
      date: '2024-01-14',
      time: '09:00',
    },
    {
      id: 3,
      type: 'sell',
      asset: 'Gold Mining Rights',
      tokens: 25,
      price: 60.00,
      total: 1500.00,
      date: '2024-01-12',
      time: '16:45',
    },
  ];

  const allocationData = [
    { category: 'Real Estate', percentage: 45.2, color: '#1E40AF' },
    { category: 'Art & Collectibles', percentage: 28.7, color: '#8B5CF6' },
    { category: 'Commodities', percentage: 18.3, color: '#F59E0B' },
    { category: 'Luxury Goods', percentage: 7.8, color: '#EF4444' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Portfolio</Text>
          <TouchableOpacity onPress={() => setHideBalance(!hideBalance)}>
            {hideBalance ? (
              <EyeOff color="#1F2937\" size={24} />
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
              {allocationData.map((item, index) => (
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
            {holdings.map((holding) => (
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
                      <TrendingUp color="#10B981\" size={12} />
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
            {transactions.map((transaction) => (
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
                    <TrendingUp color="#FFFFFF\" size={16} />
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
                    `+$${transaction.amount}` :
                    `$${transaction.total?.toLocaleString()}`
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