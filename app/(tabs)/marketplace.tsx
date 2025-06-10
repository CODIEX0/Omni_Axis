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
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTokenizeAsset } from '../../hooks/useTokenizeAsset';
import { useWalletConnection } from '../../hooks/useWallet';
import { useAuth } from '../../hooks/useAuth';
import { Asset } from '../../services/supabase';
import { AssetCard } from '../../components/AssetCard';
import { WalletConnector } from '../../components/WalletConnector';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ASSET_TYPES, COLORS, SPACING, FONT_SIZES } from '../../constants';

export default function MarketplaceScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isConnected } = useWalletConnection();
  const { getMarketplaceAssets, buyAsset } = useTokenizeAsset();
  
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadAssets();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [assets, searchQuery, selectedFilter]);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const marketplaceAssets = await getMarketplaceAssets();
      setAssets(marketplaceAssets);
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

  const handleBuyAsset = async (asset: Asset) => {
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
              // This would need the listing ID from the marketplace contract
              // For now, we'll show a placeholder
              Alert.alert('Purchase Initiated', 'Your purchase request has been submitted.');
            } catch (error) {
              console.error('Error buying asset:', error);
              Alert.alert('Error', 'Failed to purchase asset');
            }
          }
        }
      ]
    );
  };

  const renderAssetItem = ({ item }: { item: Asset }) => (
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: 'Inter-Bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.sm,
  },
  filterToggle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filtersContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  filtersContent: {
    paddingBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  filterButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  filterButtonText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Medium',
    color: COLORS.TEXT_SECONDARY,
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  walletBanner: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: '#F0F7FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  walletBannerContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  walletBannerTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.xs,
  },
  walletBannerText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
  },
  assetsList: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  assetCard: {
    marginBottom: SPACING.md,
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  assetTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.TEXT_PRIMARY,
  },
  assetType: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Medium',
    color: COLORS.TEXT_SECONDARY,
    textTransform: 'capitalize',
  },
  assetPrice: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 2,
  },
  priceValue: {
    fontSize: FONT_SIZES.lg,
    fontFamily: 'Inter-Bold',
    color: COLORS.PRIMARY,
  },
  assetDescription: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  assetMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  metaText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Medium',
    color: COLORS.TEXT_SECONDARY,
  },
  assetActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyStateTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptyStateText: {
    fontSize: FONT_SIZES.md,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
});