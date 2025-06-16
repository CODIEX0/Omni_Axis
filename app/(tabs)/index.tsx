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
import { useAuth } from '../../hooks/useAuth';
import { userDataService } from '../../services/userDataService';
import { demoDataService } from '../../services/demoDataService';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { AIChat } from '../../components/AIChat';
import { FloatingChatButton } from '../../components/FloatingChatButton';


const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user, profile, isDemoMode, demoAccount } = useAuth();
  
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [marketplaceAssets, setMarketplaceAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hideBalance, setHideBalance] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [user, profile, isDemoMode, demoAccount]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isDemoMode && demoAccount) {
        // Use demo data service
        const demoDashboardData = demoDataService.getDemoDashboardData(demoAccount);
        setDashboardData(demoDashboardData);

        // Demo marketplace assets
        const demoAssets = demoDataService.getDemoAssets().slice(0, 3).map(asset => ({
          id: asset.id,
          title: asset.title,
          description: asset.description,
          assetType: asset.assetType,
          estimatedValue: asset.estimatedValue,
          listingPrice: asset.listingPrice,
          imageUrls: asset.imageUrls,
          ownerName: asset.ownerName,
          status: asset.status,
        }));
        setMarketplaceAssets(demoAssets);
      } else if (user) {
        // Load real user data
        const data = await userDataService.getDashboardData(user, profile);
        setDashboardData(data);

        const assets = await userDataService.getMarketplaceAssets();
        setMarketplaceAssets(assets);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { icon: Plus, label: t('tokenize.title'), color: '#F59E0B', route: '/(tabs)/tokenize' },
    { icon: Search, label: t('marketplace.title'), color: '#10B981', route: '/(tabs)/marketplace' },
    { icon: TrendingUp, label: 'Analytics', color: '#8B5CF6', route: '/(tabs)/portfolio' },
    { icon: Zap, label: 'Quick Trade', color: '#EF4444', route: '/(tabs)/marketplace' },
  ];

  const featuredAssets = marketplaceAssets.slice(0, 3);

  if (loading) {
    return <LoadingSpinner message={t('common.loading')} />;
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage 
          message={error} 
          onRetry={loadDashboardData} 
        />
      </SafeAreaView>
    );
  }

  if (!dashboardData) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.userName}>{dashboardData.user.firstName} {dashboardData.user.lastName}</Text>
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
                <EyeOff color="rgba(255, 255, 255, 0.7)" size={20} />
              ) : (
                <Eye color="rgba(255, 255, 255, 0.7)" size={20} />
              )}
            </TouchableOpacity>
          </View>
          
          <Text style={styles.portfolioValue}>
            {hideBalance ? '••••••••' : `${dashboardData.portfolio.totalValue.toLocaleString()}`}
          </Text>
          
          <View style={styles.portfolioChange}>
            <TrendingUp color="#10B981" size={16} />
            <Text style={styles.portfolioChangeText}>
              +${dashboardData.portfolio.changeAmount.toLocaleString()} ({dashboardData.portfolio.change24h}%)
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

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredAssetsContainer}
          >
            {featuredAssets.map((asset) => (
              <View key={asset.id} style={styles.assetCard}>
                <View style={styles.assetImage}>
                  <Text style={styles.assetImagePlaceholder}>📷</Text>
                </View>
                <View style={styles.assetInfo}>
                  <Text style={styles.assetTitle} numberOfLines={2}>{asset.title}</Text>
                  <Text style={styles.assetType}>{asset.assetType.replace('_', ' ').toUpperCase()}</Text>
                  <Text style={styles.assetPrice}>${asset.listingPrice}</Text>
                  <Text style={styles.assetOwner}>by {asset.ownerName}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Market Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Market Insights</Text>
          
          <View style={styles.insightsContainer}>
            {dashboardData.marketInsights.map((insight: any, index: number) => {
              const IconComponent = insight.icon === 'Building' ? Building : 
                                  insight.icon === 'Palette' ? Palette : DollarSign;
              
              return (
                <View key={index} style={styles.insightCard}>
                  <View style={[styles.insightIcon, { backgroundColor: `${insight.color}20` }]}>
                    <IconComponent color={insight.color} size={24} />
                  </View>
                  <View style={styles.insightContent}>
                    <Text style={styles.insightTitle}>{insight.category}</Text>
                    <Text style={styles.insightValue}>{insight.change}</Text>
                    <Text style={styles.insightSubtext}>{insight.period}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          
          <View style={styles.activityContainer}>
            {dashboardData.recentActivity.map((activity: any) => {
              const getActivityIcon = (type: string) => {
                switch (type) {
                  case 'buy': return TrendingUp;
                  case 'sell': return ChevronRight;
                  case 'transfer': return DollarSign;
                  default: return TrendingUp;
                }
              };

              const getActivityColor = (type: string) => {
                switch (type) {
                  case 'buy': return '#10B981';
                  case 'sell': return '#EF4444';
                  case 'transfer': return '#F59E0B';
                  default: return '#10B981';
                }
              };

              const ActivityIcon = getActivityIcon(activity.type);
              const activityColor = getActivityColor(activity.type);

              return (
                <TouchableOpacity key={activity.id} style={styles.activityItem}>
                  <View style={[styles.activityIcon, { backgroundColor: activityColor }]}>
                    <ActivityIcon color="#FFFFFF" size={16} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activitySubtext}>{activity.subtitle}</Text>
                    <Text style={styles.activityTime}>{activity.time}</Text>
                  </View>
                  <Text style={styles.activityAmount}>${activity.amount.toLocaleString()}</Text>
                </TouchableOpacity>
              );
            })}
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
  assetCard: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  assetImage: {
    height: 120,
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assetImagePlaceholder: {
    fontSize: 32,
  },
  assetInfo: {
    padding: 16,
  },
  assetTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
    lineHeight: 18,
  },
  assetType: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  assetPrice: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1E40AF',
    marginBottom: 4,
  },
  assetOwner: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
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