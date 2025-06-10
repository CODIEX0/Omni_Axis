import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Search, 
  Filter,
  Building,
  Palette,
  DollarSign,
  Zap,
  Star,
  ChevronDown
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useTypedSelector } from '../../hooks/useTypedSelector';
import { 
  fetchMarketplaceAssets, 
  setSearchQuery, 
  setFilters 
} from '../../store/slices/marketplaceSlice';
import { AssetCard } from '../../components/AssetCard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';

const { width } = Dimensions.get('window');

export default function MarketplaceScreen() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  
  const { 
    filteredAssets, 
    filters, 
    searchQuery, 
    isLoading, 
    error 
  } = useTypedSelector(state => state.marketplace);

  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  useEffect(() => {
    dispatch(fetchMarketplaceAssets());
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