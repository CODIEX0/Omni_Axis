import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Bell, 
  TrendingUp, 
  DollarSign, 
  Building, 
  Palette, 
  Zap,
  ChevronRight,
  Eye,
  EyeOff,
  Plus,
  Search
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useTypedSelector } from '../../hooks/useTypedSelector';
import { fetchPortfolio } from '../../store/slices/portfolioSlice';
import { fetchMarketplaceAssets } from '../../store/slices/marketplaceSlice';
import { AssetCard } from '../../components/AssetCard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { AIChat } from '../../components/AIChat';
import { FloatingChatButton } from '../../components/FloatingChatButton';


const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  
  const { user } = useTypedSelector(state => state.auth);
  const { summary, isLoading: portfolioLoading, error: portfolioError } = useTypedSelector(state => state.portfolio);
  const { assets, isLoading: assetsLoading, error: assetsError } = useTypedSelector(state => state.marketplace);
  
  const [hideBalance, setHideBalance] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);

  useEffect(() => {
    dispatch(fetchPortfolio());
    dispatch(fetchMarketplaceAssets());
  }, [dispatch]);

  const quickActions = [
    { icon: Plus, label: t('tokenize.title'), color: '#F59E0B', route: '/(tabs)/tokenize' },
    { icon: Search, label: t('marketplace.title'), color: '#10B981', route: '/(tabs)/marketplace' },
    { icon: TrendingUp, label: 'Analytics', color: '#8B5CF6', route: '/(tabs)/portfolio' },
    { icon: Zap, label: 'Quick Trade', color: '#EF4444', route: '/(tabs)/marketplace' },
  ];

  const featuredAssets = assets.slice(0, 3);

  if (portfolioLoading && assetsLoading) {
    return <LoadingSpinner message={t('common.loading')} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Bell color="#1F2937" size={24} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        {/* Portfolio Card */}
        <LinearGradient
          colors={['#1E40AF', '#3B82F6']}
          style={styles.portfolioCard}
        >
          <View style={styles.portfolioHeader}>
            <Text style={styles.portfolioTitle}>{t('portfolio.totalValue')}</Text>
            <TouchableOpacity onPress={() => setHideBalance(!hideBalance)}>
              {hideBalance ? (
                <EyeOff color="rgba(255, 255, 255, 0.7)\" size={20} />
              ) : (
                <Eye color="rgba(255, 255, 255, 0.7)" size={20} />
              )}
            </TouchableOpacity>
          </View>
          
          <Text style={styles.portfolioValue}>
            {hideBalance ? '••••••••' : `$${summary.totalValue.toLocaleString()}`}
          </Text>
          
          <View style={styles.portfolioChange}>
            <TrendingUp color="#10B981" size={16} />
            <Text style={styles.portfolioChangeText}>
              +${summary.changeAmount.toLocaleString()} ({summary.change24h}%)
            </Text>
          </View>

          <Text style={styles.portfolioSubtext}>Last 24 hours</Text>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity key={index} style={styles.quickActionItem}>
                <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                  <action.icon color="#FFFFFF" size={24} />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Featured Assets */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Assets</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {assetsError ? (
            <ErrorMessage 
              message={assetsError} 
              onRetry={() => dispatch(fetchMarketplaceAssets())} 
            />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredAssetsContainer}
            >
              {featuredAssets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onPress={() => {}}
                  variant="featured"
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Market Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Market Insights</Text>
          
          <View style={styles.insightsContainer}>
            <View style={styles.insightCard}>
              <View style={styles.insightIcon}>
                <Building color="#1E40AF" size={24} />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Real Estate</Text>
                <Text style={styles.insightValue}>+12.5%</Text>
                <Text style={styles.insightSubtext}>This month</Text>
              </View>
            </View>

            <View style={styles.insightCard}>
              <View style={styles.insightIcon}>
                <Palette color="#8B5CF6" size={24} />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Art & Collectibles</Text>
                <Text style={styles.insightValue}>+8.7%</Text>
                <Text style={styles.insightSubtext}>This month</Text>
              </View>
            </View>

            <View style={styles.insightCard}>
              <View style={styles.insightIcon}>
                <DollarSign color="#F59E0B" size={24} />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Commodities</Text>
                <Text style={styles.insightValue}>+5.2%</Text>
                <Text style={styles.insightSubtext}>This month</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          
          <View style={styles.activityContainer}>
            <TouchableOpacity style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#10B981' }]}>
                <TrendingUp color="#FFFFFF" size={16} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Purchased 50 tokens</Text>
                <Text style={styles.activitySubtext}>Manhattan Office Building</Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
              <Text style={styles.activityAmount}>$6,275</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#F59E0B' }]}>
                <DollarSign color="#FFFFFF" size={16} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Dividend received</Text>
                <Text style={styles.activitySubtext}>Art Collection #247</Text>
                <Text style={styles.activityTime}>1 day ago</Text>
              </View>
              <Text style={styles.activityAmount}>$125.50</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#EF4444' }]}>
                <ChevronRight color="#FFFFFF" size={16} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Sold 25 tokens</Text>
                <Text style={styles.activitySubtext}>Gold Mining Rights</Text>
                <Text style={styles.activityTime}>3 days ago</Text>
              </View>
              <Text style={styles.activityAmount}>$1,500</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* AI Chat Components */}
      <FloatingChatButton 
        onPress={() => setShowAIChat(true)}
        visible={!showAIChat}
      />
      
      <AIChat 
        visible={showAIChat}
        onClose={() => setShowAIChat(false)}
      />
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
  greeting: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginTop: 4,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  portfolioCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
  },
  portfolioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  portfolioTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  portfolioValue: {
    fontSize: 36,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  portfolioChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  portfolioChangeText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#10B981',
    marginLeft: 6,
  },
  portfolioSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.6)',
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
  quickActionsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  quickActionItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 16,
  },
  featuredAssetsContainer: {
    paddingLeft: 20,
    paddingRight: 8,
  },
  insightsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  insightIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  insightValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#10B981',
    marginBottom: 2,
  },
  insightSubtext: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  activityContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  activityItem: {
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
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 2,
  },
  activitySubtext: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  activityAmount: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
});