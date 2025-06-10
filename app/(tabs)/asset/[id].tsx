import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  ArrowLeft,
  Star,
  MapPin,
  Building,
  Users,
  TrendingUp,
  TrendingDown,
  Share,
  Heart,
  Shield,
  ExternalLink,
  DollarSign,
  Calendar,
  PieChart,
} from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { useWalletConnection } from '../../hooks/useWallet';
import { useTokenizeAsset } from '../../hooks/useTokenizeAsset';
import { supabase } from '../../services/supabase';
import { Asset } from '../../services/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { WalletConnector } from '../../components/WalletConnector';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';

const { width } = Dimensions.get('window');

interface AssetMetrics {
  totalInvestors: number;
  totalInvested: number;
  averageReturn: number;
  marketCap: number;
  priceChange24h: number;
  volume24h: number;
}

export default function AssetDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { isConnected } = useWalletConnection();
  const { buyAsset } = useTokenizeAsset();
  
  const [asset, setAsset] = useState<Asset | null>(null);
  const [metrics, setMetrics] = useState<AssetMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'documents' | 'activity'>('overview');
  const [purchaseAmount, setPurchaseAmount] = useState('');

  useEffect(() => {
    if (id) {
      loadAssetDetails();
      loadAssetMetrics();
    }
  }, [id]);

  const loadAssetDetails = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error loading asset:', error);
        Alert.alert('Error', 'Failed to load asset details');
        return;
      }

      setAsset(data);
    } catch (error) {
      console.error('Error loading asset:', error);
      Alert.alert('Error', 'Failed to load asset details');
    } finally {
      setLoading(false);
    }
  };

  const loadAssetMetrics = async () => {
    // This would fetch real metrics from your backend
    // For now, we'll use mock data
    setMetrics({
      totalInvestors: Math.floor(Math.random() * 500) + 50,
      totalInvested: Math.floor(Math.random() * 1000000) + 100000,
      averageReturn: Math.random() * 30 + 5,
      marketCap: Math.floor(Math.random() * 5000000) + 500000,
      priceChange24h: (Math.random() - 0.5) * 20,
      volume24h: Math.floor(Math.random() * 100000) + 10000,
    });
  };

  const handlePurchase = async () => {
    if (!isConnected) {
      Alert.alert('Wallet Required', 'Please connect your wallet to purchase tokens.');
      return;
    }

    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to purchase tokens.');
      return;
    }

    if (!asset) {
      Alert.alert('Error', 'Asset information not available');
      return;
    }

    const amount = parseFloat(purchaseAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid purchase amount.');
      return;
    }

    const maxPurchase = asset.listing_price || 0;
    if (amount > maxPurchase) {
      Alert.alert('Amount Too High', `Maximum purchase amount is $${maxPurchase.toLocaleString()}`);
      return;
    }

    Alert.alert(
      'Confirm Purchase',
      `Purchase ${amount} tokens of ${asset.title} for $${(amount * (asset.listing_price || 0)).toLocaleString()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: async () => {
            try {
              // This would integrate with your smart contract
              Alert.alert('Purchase Initiated', 'Your purchase request has been submitted.');
              router.back();
            } catch (error) {
              console.error('Error purchasing asset:', error);
              Alert.alert('Error', 'Failed to purchase asset');
            }
          }
        }
      ]
    );
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    // Here you would save to favorites in your backend
  };

  const handleShare = () => {
    Alert.alert('Share Asset', 'This would open the native share dialog');
  };

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Key Metrics */}
      <Card style={styles.metricsCard}>
        <Text style={styles.cardTitle}>Key Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{metrics?.totalInvestors || 0}</Text>
            <Text style={styles.metricLabel}>Investors</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>
              ${metrics?.totalInvested.toLocaleString() || '0'}
            </Text>
            <Text style={styles.metricLabel}>Total Invested</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, styles.positiveValue]}>
              {metrics?.averageReturn.toFixed(1) || '0'}%
            </Text>
            <Text style={styles.metricLabel}>Avg Return</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>
              ${metrics?.marketCap.toLocaleString() || '0'}
            </Text>
            <Text style={styles.metricLabel}>Market Cap</Text>
          </View>
        </View>
      </Card>

      {/* Asset Description */}
      <Card style={styles.descriptionCard}>
        <Text style={styles.cardTitle}>About This Asset</Text>
        <Text style={styles.description}>{asset?.description}</Text>
        
        <View style={styles.assetDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Asset Type</Text>
            <Text style={styles.detailValue}>{asset?.asset_type}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Value</Text>
            <Text style={styles.detailValue}>${asset?.estimated_value.toLocaleString()}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created</Text>
            <Text style={styles.detailValue}>
              {asset?.created_at ? new Date(asset.created_at).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
          {asset?.token_id && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Token ID</Text>
              <Text style={styles.detailValue}>{asset.token_id}</Text>
            </View>
          )}
        </View>
      </Card>

      {/* Price Chart Placeholder */}
      <Card style={styles.chartCard}>
        <Text style={styles.cardTitle}>Price Performance</Text>
        <View style={styles.chartPlaceholder}>
          <TrendingUp color={COLORS.TEXT_SECONDARY} size={48} />
          <Text style={styles.chartPlaceholderText}>
            Price chart would be displayed here
          </Text>
        </View>
      </Card>
    </View>
  );

  const renderDocumentsTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.documentsCard}>
        <Text style={styles.cardTitle}>Verification Documents</Text>
        <Text style={styles.documentsDescription}>
          All documents have been verified and stored securely on IPFS
        </Text>
        
        <View style={styles.documentsList}>
          <TouchableOpacity style={styles.documentItem}>
            <Shield color={COLORS.PRIMARY} size={24} />
            <View style={styles.documentInfo}>
              <Text style={styles.documentTitle}>Ownership Certificate</Text>
              <Text style={styles.documentStatus}>Verified</Text>
            </View>
            <ExternalLink color={COLORS.TEXT_SECONDARY} size={20} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.documentItem}>
            <Shield color={COLORS.PRIMARY} size={24} />
            <View style={styles.documentInfo}>
              <Text style={styles.documentTitle}>Valuation Report</Text>
              <Text style={styles.documentStatus}>Verified</Text>
            </View>
            <ExternalLink color={COLORS.TEXT_SECONDARY} size={20} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.documentItem}>
            <Shield color={COLORS.PRIMARY} size={24} />
            <View style={styles.documentInfo}>
              <Text style={styles.documentTitle}>Legal Documentation</Text>
              <Text style={styles.documentStatus}>Verified</Text>
            </View>
            <ExternalLink color={COLORS.TEXT_SECONDARY} size={20} />
          </TouchableOpacity>
        </View>
      </Card>
    </View>
  );

  const renderActivityTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.activityCard}>
        <Text style={styles.cardTitle}>Recent Activity</Text>
        
        <View style={styles.activityList}>
          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: '#10B981' }]}>
              <TrendingUp color="#FFFFFF" size={16} />
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityTitle}>Token Purchase</Text>
              <Text style={styles.activityDescription}>50 tokens purchased</Text>
              <Text style={styles.activityTime}>2 hours ago</Text>
            </View>
            <Text style={styles.activityAmount}>$6,275</Text>
          </View>
          
          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: '#F59E0B' }]}>
              <DollarSign color="#FFFFFF" size={16} />
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityTitle}>Dividend Payment</Text>
              <Text style={styles.activityDescription}>Monthly distribution</Text>
              <Text style={styles.activityTime}>1 day ago</Text>
            </View>
            <Text style={styles.activityAmount}>$125.50</Text>
          </View>
          
          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: '#8B5CF6' }]}>
              <Star color="#FFFFFF" size={16} />
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityTitle}>Asset Listed</Text>
              <Text style={styles.activityDescription}>Available for trading</Text>
              <Text style={styles.activityTime}>3 days ago</Text>
            </View>
          </View>
        </View>
      </Card>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="Loading asset details..." />
      </SafeAreaView>
    );
  }

  if (!asset) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Asset not found</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: asset.image_urls?.[0] || 'https://via.placeholder.com/400x300' }} 
            style={styles.assetImage} 
          />
          
          {/* Header Overlay */}
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.6)']}
            style={styles.imageOverlay}
          >
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <ArrowLeft color="#FFFFFF" size={24} />
              </TouchableOpacity>
              <View style={styles.headerRightActions}>
                <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                  <Share color="#FFFFFF" size={20} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleFavorite}>
                  <Heart 
                    color={isFavorite ? "#EF4444" : "#FFFFFF"} 
                    size={20} 
                    fill={isFavorite ? "#EF4444" : "none"}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.assetTitleContainer}>
              <Text style={styles.assetTitle}>{asset.title}</Text>
              <View style={styles.assetMeta}>
                <View style={styles.ratingContainer}>
                  <Star color="#F59E0B" size={16} fill="#F59E0B" />
                  <Text style={styles.ratingText}>4.8</Text>
                </View>
                {asset.verified && (
                  <View style={styles.verifiedBadge}>
                    <Shield color="#FFFFFF" size={14} />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Price Section */}
        <Card style={styles.priceCard}>
          <View style={styles.priceHeader}>
            <View>
              <Text style={styles.currentPrice}>
                ${asset.listing_price?.toLocaleString() || 'N/A'}
              </Text>
              <Text style={styles.priceLabel}>per token</Text>
            </View>
            <View style={styles.priceChange}>
              {metrics && (
                <>
                  {metrics.priceChange24h >= 0 ? (
                    <TrendingUp color="#10B981" size={16} />
                  ) : (
                    <TrendingDown color="#EF4444" size={16} />
                  )}
                  <Text style={[
                    styles.priceChangeText,
                    { color: metrics.priceChange24h >= 0 ? '#10B981' : '#EF4444' }
                  ]}>
                    {metrics.priceChange24h >= 0 ? '+' : ''}{metrics.priceChange24h.toFixed(2)}%
                  </Text>
                </>
              )}
            </View>
          </View>
          
          <View style={styles.quickStats}>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatValue}>${metrics?.volume24h.toLocaleString() || '0'}</Text>
              <Text style={styles.quickStatLabel}>24h Volume</Text>
            </View>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatValue}>{metrics?.totalInvestors || 0}</Text>
              <Text style={styles.quickStatLabel}>Investors</Text>
            </View>
          </View>
        </Card>

        {/* Tab Navigation */}
        <View style={styles.tabNavigation}>
          {['overview', 'documents', 'activity'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, selectedTab === tab && styles.tabButtonActive]}
              onPress={() => setSelectedTab(tab as any)}
            >
              <Text style={[
                styles.tabButtonText,
                selectedTab === tab && styles.tabButtonTextActive
              ]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {selectedTab === 'overview' && renderOverviewTab()}
        {selectedTab === 'documents' && renderDocumentsTab()}
        {selectedTab === 'activity' && renderActivityTab()}
      </ScrollView>

      {/* Purchase Section */}
      <View style={styles.purchaseSection}>
        {!isConnected ? (
          <WalletConnector />
        ) : (
          <View style={styles.purchaseContent}>
            <View style={styles.purchaseInfo}>
              <Text style={styles.purchaseLabel}>Available Tokens</Text>
              <Text style={styles.purchaseValue}>
                {asset.total_tokens || 'N/A'} tokens
              </Text>
            </View>
            <Button
              title="Purchase Tokens"
              onPress={handlePurchase}
              style={styles.purchaseButton}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  imageContainer: {
    position: 'relative',
  },
  assetImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRightActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assetTitleContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  assetTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: SPACING.xs,
  },
  assetMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  ratingText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    gap: SPACING.xs,
  },
  verifiedText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  priceCard: {
    marginHorizontal: SPACING.lg,
    marginTop: -SPACING.lg,
    marginBottom: SPACING.md,
    zIndex: 1,
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  currentPrice: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: 'Inter-Bold',
    color: COLORS.TEXT_PRIMARY,
  },
  priceLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
  },
  priceChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  priceChangeText: {
    fontSize: FONT_SIZES.md,
    fontFamily: 'Inter-SemiBold',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  quickStat: {
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: FONT_SIZES.lg,
    fontFamily: 'Inter-Bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.xs,
  },
  quickStatLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
  },
  tabNavigation: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Medium',
    color: COLORS.TEXT_SECONDARY,
  },
  tabButtonTextActive: {
    color: COLORS.TEXT_PRIMARY,
  },
  tabContent: {
    paddingHorizontal: SPACING.lg,
  },
  metricsCard: {
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metricItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  metricValue: {
    fontSize: FONT_SIZES.lg,
    fontFamily: 'Inter-Bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.xs,
  },
  positiveValue: {
    color: '#10B981',
  },
  metricLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
  },
  descriptionCard: {
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: FONT_SIZES.md,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  assetDetails: {
    gap: SPACING.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  detailLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
  },
  detailValue: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.TEXT_PRIMARY,
  },
  chartCard: {
    marginBottom: SPACING.md,
  },
  chartPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  chartPlaceholderText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.sm,
  },
  documentsCard: {
    marginBottom: SPACING.md,
  },
  documentsDescription: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.md,
  },
  documentsList: {
    gap: SPACING.sm,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  documentInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  documentTitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  documentStatus: {
    fontSize: FONT_SIZES.xs,
    fontFamily: 'Inter-Regular',
    color: '#10B981',
  },
  activityCard: {
    marginBottom: SPACING.md,
  },
  activityList: {
    gap: SPACING.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: FONT_SIZES.xs,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: FONT_SIZES.xs,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
  },
  activityAmount: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Bold',
    color: COLORS.TEXT_PRIMARY,
  },
  purchaseSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  purchaseContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  purchaseInfo: {
    flex: 1,
  },
  purchaseLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 2,
  },
  purchaseValue: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.TEXT_PRIMARY,
  },
  purchaseButton: {
    minWidth: 120,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  errorText: {
    fontSize: FONT_SIZES.lg,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.lg,
  },
});
