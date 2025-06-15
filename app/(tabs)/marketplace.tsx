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
import { isLoading } from 'expo-font';

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
  }, [dispatch]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      dispatch(setSearchQuery(localSearchQuery));
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localSearchQuery, dispatch]);

  const categories = [
    { id: 'all', name: t('marketplace.allAssets'), icon: Star, color: '#6B7280' },
    { id: 'real-estate', name: t('marketplace.realEstate'), icon: Building, color: '#1E40AF' },
    { id: 'art', name: t('marketplace.artCollectibles'), icon: Palette, color: '#8B5CF6' },
    { id: 'commodities', name: t('marketplace.commodities'), icon: DollarSign, color: '#F59E0B' },
    { id: 'luxury', name: t('marketplace.luxuryGoods'), icon: Zap, color: '#EF4444' },
  ];

  const handleCategorySelect = (categoryId: string) => {
    dispatch(setFilters({ category: categoryId }));
  };

  const handleSortChange = (sortBy: string) => {
    dispatch(setFilters({ sortBy: sortBy as any }));
  };

  if (isLoading) {
    return <LoadingSpinner message={t('common.loading')} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('marketplace.title')}</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Filter color="#1F2937" size={20} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search color="#6B7280" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('marketplace.searchAssets')}
            value={localSearchQuery}
            onChangeText={setLocalSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryItem,
              filters.category === category.id && styles.categoryItemActive
            ]}
            onPress={() => handleCategorySelect(category.id)}
          >
            <category.icon 
              color={filters.category === category.id ? '#FFFFFF' : category.color} 
              size={16} 
            />
            <Text style={[
              styles.categoryText,
              filters.category === category.id && styles.categoryTextActive
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.resultCount}>
          {t('marketplace.assetsFound', { count: filteredAssets.length })}
        </Text>
        <TouchableOpacity style={styles.sortButton}>
          <Text style={styles.sortText}>
            {filters.sortBy === 'trending' ? t('marketplace.trending') :
             filters.sortBy === 'price-high' ? t('marketplace.priceHighToLow') :
             filters.sortBy === 'price-low' ? t('marketplace.priceLowToHigh') :
             filters.sortBy === 'roi' ? t('marketplace.roi') : t('marketplace.change')}
          </Text>
          <ChevronDown color="#6B7280" size={16} />
        </TouchableOpacity>
      </View>

      {/* Assets Grid */}
      {error ? (
        <ErrorMessage 
          message={error} 
          onRetry={() => dispatch(fetchMarketplaceAssets())} 
        />
      ) : (
        <ScrollView style={styles.assetsContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.assetsGrid}>
            {filteredAssets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onPress={() => {}}
                variant="default"
              />
            ))}
          </View>
          <View style={styles.bottomPadding} />
        </ScrollView>
      )}
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
});

function dispatch(arg0: any) {
  throw new Error('Function not implemented.');
}


function setSearchQuery(localSearchQuery: any): any {
  throw new Error('Function not implemented.');
}


function t(arg0: string) {
  throw new Error('Function not implemented.');
}


function setFilters(arg0: { category: string; sortBy?: string; }): any {
  throw new Error('Function not implemented.');
}
