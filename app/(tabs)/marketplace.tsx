import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Search, 
  Filter,
  Building,
  DollarSign,
  Eye,
  Heart,
  ShoppingCart,
  Palette,
  Star,
  Zap,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useWalletConnection } from '../../hooks/useWallet';
import { useAuth } from '../../hooks/useAuth';
import { userDataService } from '../../services/userDataService';
import { demoDataService } from '../../services/demoDataService';
import { WalletConnector } from '../../components/WalletConnector';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ASSET_TYPES, COLORS, SPACING, FONT_SIZES } from '../../constants';

export default function MarketplaceScreen() {
  const { t } = useTranslation();
  const { user, isDemoMode, demoAccount } = useAuth();
  const { isConnected } = useWalletConnection();
  
  const [assets, setAssets] = useState<any[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadAssets();
  }, [isDemoMode, demoAccount, user]);

  useEffect(() => {
    applyFilters();
  }, [assets, searchQuery, selectedFilter]);

  const loadAssets = async () => {
    try {
      setLoading(true);
      
      if (isDemoMode && demoAccount) {
        // Use demo marketplace assets
        const demoAssets = demoDataService.getDemoAssets().map(asset => ({
          id: asset.id,
          title: asset.title,
          description: asset.description,
          asset_type: asset.assetType,
          estimated_value: asset.estimatedValue,
          listing_price: asset.listingPrice,
          token_id: asset.tokenId,
          status: asset.status,
          available_tokens: asset.availableTokens,
          total_tokens: asset.totalTokens,
          minimum_investment: asset.minimumInvestment,
          expected_roi: asset.expectedROI,
          owner_name: asset.ownerName,
          image_urls: asset.imageUrls,
          location: asset.location,
          features: asset.features,
          risk_level: asset.riskLevel,
        }));
        setAssets(demoAssets);
      } else {
        // Load real marketplace assets
        const marketplaceAssets = await userDataService.getMarketplaceAssets();
        setAssets(marketplaceAssets);
      }
    } catch (error) {
      console.error('Error loading assets:', error);
      Alert.alert('Error', 'Failed to load marketplace assets');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAssets();
    setRefreshing(false);
  };

  const applyFilters = () => {
    let filtered = assets;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(asset => 
        asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.asset_type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(asset => asset.asset_type === selectedFilter);
    }

    setFilteredAssets(filtered);
  };

  const handleBuyAsset = async (asset: any) => {
    if (!isConnected) {
      Alert.alert('Wallet Required', 'Please connect your wallet to purchase assets.');
      return;
    }

    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to purchase assets.');
      return;
    }

    if (!asset.listing_price) {
      Alert.alert('Error', 'Asset price not available');
      return;
    }

    Alert.alert(
      'Confirm Purchase',
      `Are you sure you want to buy this asset for $${asset.listing_price}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy Now',
          onPress: async () => {
            try {
              if (isDemoMode) {
                // Simulate demo purchase
                const result = demoDataService.simulateAssetPurchase(
                  asset.id, 
                  Math.ceil(asset.minimum_investment / asset.listing_price), 
                  demoAccount?.id || 'demo-user'
                );
                
                if (result.success) {
                  Alert.alert(
                    'Purchase Successful!', 
                    `You have successfully purchased tokens for ${asset.title}. Transaction ID: ${result.transaction?.txHash?.substring(0, 10)}...`
                  );
                } else {
                  Alert.alert('Purchase Failed', result.error || 'Unknown error');
                }
              } else {
                // Real blockchain purchase would go here
                Alert.alert('Purchase Initiated', 'Your purchase request has been submitted.');
              }
            } catch (error) {
              console.error('Error buying asset:', error);
              Alert.alert('Error', 'Failed to purchase asset');
            }
          }
        }
      ]
    );
  };

  const renderAssetItem = ({ item }: { item: any }) => (
    <Card style={styles.assetCard}>
      <View style={styles.assetHeader}>
        <View>
          <Text style={styles.assetTitle}>{item.title}</Text>
          <Text style={styles.assetType}>
            {ASSET_TYPES.find(t => t.value === item.asset_type)?.label || item.asset_type}
          </Text>
        </View>
        <View style={styles.assetPrice}>
          <Text style={styles.priceLabel}>Price</Text>
          <Text style={styles.priceValue}>
            ${item.listing_price?.toLocaleString() || 'N/A'}
          </Text>
        </View>
      </View>

      <Text style={styles.assetDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.assetMeta}>
        <View style={styles.metaItem}>
          <Building color={COLORS.TEXT_SECONDARY} size={16} />
          <Text style={styles.metaText}>Token ID: {item.token_id || 'N/A'}</Text>
        </View>
        <View style={styles.metaItem}>
          <DollarSign color={COLORS.TEXT_SECONDARY} size={16} />
          <Text style={styles.metaText}>Value: ${item.estimated_value.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.assetActions}>
        <Button
          title="View Details"
          onPress={() => {/* Navigate to asset details */}}
          variant="outline"
          style={styles.actionButton}
        />
        <Button
          title="Buy Now"
          onPress={() => handleBuyAsset(item)}
          style={styles.actionButton}
        />
      </View>
    </Card>
  );

  const renderFilterButton = (filter: { value: string; label: string }) => (
    <TouchableOpacity
      key={filter.value}
      style={[
        styles.filterButton,
        selectedFilter === filter.value && styles.filterButtonActive
      ]}
      onPress={() => setSelectedFilter(filter.value)}
    >
      <Text style={[
        styles.filterButtonText,
        selectedFilter === filter.value && styles.filterButtonTextActive
      ]}>
        {filter.label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="Loading marketplace assets..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Marketplace</Text>
        <Text style={styles.subtitle}>
          Discover and invest in tokenized real-world assets
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search color={COLORS.TEXT_SECONDARY} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search assets..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.TEXT_SECONDARY}
          />
        </View>
        <TouchableOpacity
          style={styles.filterToggle}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter color={COLORS.PRIMARY} size={20} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}
          >
            {[{ value: 'all', label: 'All Assets' }, ...ASSET_TYPES].map(renderFilterButton)}
          </ScrollView>
        </View>
      )}

      {/* Wallet Connection Banner */}
      {!isConnected && (
        <Card style={styles.walletBanner}>
          <View style={styles.walletBannerContent}>
            <Text style={styles.walletBannerTitle}>Connect Wallet to Purchase</Text>
            <Text style={styles.walletBannerText}>
              Connect your wallet to buy tokenized assets
            </Text>
          </View>
          <WalletConnector />
        </Card>
      )}

      {/* Assets List */}
      <FlatList
        data={filteredAssets}
        renderItem={renderAssetItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.assetsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Building color={COLORS.TEXT_SECONDARY} size={64} />
            <Text style={styles.emptyStateTitle}>No Assets Found</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery || selectedFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Be the first to tokenize an asset!'
              }
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
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
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  filterButton: {
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
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    marginLeft: 12,
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  categoryItemActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  categoryText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  resultCount: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  sortText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  assetsContainer: {
    flex: 1,
  },
  assetsGrid: {
    paddingHorizontal: 20,
    gap: 16,
  },
  bottomPadding: {
    height: 20,
  },
  assetCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assetTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  assetType: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  assetPrice: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Inter-Regular',
  },
  priceValue: {
    fontSize: 16,
    color: '#10B981',
    fontFamily: 'Inter-Bold',
  },
  assetDescription: {
    fontSize: 14,
    color: '#374151',
    marginVertical: 8,
    fontFamily: 'Inter-Regular',
  },
  assetMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
    marginLeft: 4,
  },
  assetActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    minWidth: 100,
    marginLeft: 8,
  },
  filterButtonActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  filterToggle: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 8,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  walletBanner: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  walletBannerContent: {
    marginBottom: 12,
    alignItems: 'center',
  },
  walletBannerTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  walletBannerText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  assetsList: {
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 260,
  },
});
