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
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Eye,
  ChevronDown,
  ExternalLink,
} from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { useWalletConnection } from '../../hooks/useWallet';
import { supabase } from '../../services/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';

interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'dividend' | 'mint' | 'transfer';
  asset_id: string;
  asset_title: string;
  asset_type: string;
  token_amount?: number;
  price_per_token?: number;
  total_amount: number;
  currency: string;
  transaction_hash?: string;
  status: 'pending' | 'confirmed' | 'failed';
  created_at: string;
  user_id: string;
}

export default function TransactionsScreen() {
  const { user } = useAuth();
  const { isConnected } = useWalletConnection();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  const filterOptions = [
    { value: 'all', label: 'All Transactions' },
    { value: 'buy', label: 'Purchases' },
    { value: 'sell', label: 'Sales' },
    { value: 'dividend', label: 'Dividends' },
    { value: 'mint', label: 'Minted Assets' },
    { value: 'transfer', label: 'Transfers' },
  ];

  const periodOptions = [
    { value: 'all', label: 'All Time' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 3 Months' },
    { value: '1y', label: 'Last Year' },
  ];

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [transactions, searchQuery, selectedFilter, selectedPeriod]);

  const loadTransactions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          assets!inner(
            id,
            title,
            asset_type
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading transactions:', error);
        Alert.alert('Error', 'Failed to load transactions');
        return;
      }

      // Transform the data to match our interface
      const transformedTransactions = data.map(tx => ({
        ...tx,
        asset_title: tx.assets.title,
        asset_type: tx.assets.asset_type,
      }));

      setTransactions(transformedTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
      Alert.alert('Error', 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const applyFilters = () => {
    let filtered = transactions;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(tx => 
        tx.asset_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.asset_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(tx => tx.type === selectedFilter);
    }

    // Apply period filter
    if (selectedPeriod !== 'all') {
      const now = new Date();
      let startDate = new Date();

      switch (selectedPeriod) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      filtered = filtered.filter(tx => new Date(tx.created_at) >= startDate);
    }

    setFilteredTransactions(filtered);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'buy':
        return TrendingUp;
      case 'sell':
        return TrendingDown;
      case 'dividend':
      case 'mint':
        return DollarSign;
      default:
        return ExternalLink;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'buy':
        return '#10B981';
      case 'sell':
        return '#EF4444';
      case 'dividend':
        return '#F59E0B';
      case 'mint':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'failed':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
    };
  };

  const handleViewTransaction = (transaction: Transaction) => {
    if (transaction.transaction_hash) {
      // Open blockchain explorer
      Alert.alert(
        'View on Blockchain',
        'This would open the transaction in a blockchain explorer',
        [{ text: 'OK' }]
      );
    }
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const Icon = getTransactionIcon(item.type);
    const iconColor = getTransactionColor(item.type);
    const statusColor = getStatusColor(item.status);
    const { date, time } = formatDate(item.created_at);
    
    const isPositive = item.type === 'sell' || item.type === 'dividend';

    return (
      <Card style={styles.transactionCard}>
        <TouchableOpacity 
          style={styles.transactionContent}
          onPress={() => handleViewTransaction(item)}
        >
          <View style={[styles.transactionIcon, { backgroundColor: iconColor }]}>
            <Icon color="#FFFFFF" size={16} />
          </View>

          <View style={styles.transactionDetails}>
            <View style={styles.transactionHeader}>
              <Text style={styles.transactionTitle}>
                {item.type === 'buy' ? 'Purchased' :
                 item.type === 'sell' ? 'Sold' :
                 item.type === 'dividend' ? 'Dividend' :
                 item.type === 'mint' ? 'Minted' : 'Transfer'}
                {item.token_amount && ` ${item.token_amount} tokens`}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>

            <Text style={styles.assetTitle} numberOfLines={1}>
              {item.asset_title}
            </Text>

            <View style={styles.transactionMeta}>
              <Text style={styles.transactionDate}>
                {date} at {time}
              </Text>
              {item.price_per_token && (
                <Text style={styles.pricePerToken}>
                  ${item.price_per_token}/token
                </Text>
              )}
            </View>
          </View>

          <View style={styles.transactionAmount}>
            <Text style={[
              styles.amountText,
              { color: isPositive ? '#10B981' : '#1F2937' }
            ]}>
              {isPositive ? '+' : ''}${item.total_amount.toLocaleString()}
            </Text>
            <Text style={styles.currencyText}>{item.currency}</Text>
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

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
        <LoadingSpinner message="Loading transactions..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Transaction History</Text>
        <Text style={styles.subtitle}>
          All your tokenization and trading activity
        </Text>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search color={COLORS.TEXT_SECONDARY} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
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
          <Text style={styles.filterLabel}>Transaction Type</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}
          >
            {filterOptions.map(renderFilterButton)}
          </ScrollView>

          <Text style={styles.filterLabel}>Time Period</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}
          >
            {periodOptions.map((period) => (
              <TouchableOpacity
                key={period.value}
                style={[
                  styles.filterButton,
                  selectedPeriod === period.value && styles.filterButtonActive
                ]}
                onPress={() => setSelectedPeriod(period.value)}
              >
                <Text style={[
                  styles.filterButtonText,
                  selectedPeriod === period.value && styles.filterButtonTextActive
                ]}>
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Summary Stats */}
      <Card style={styles.summaryCard}>
        <View style={styles.summaryContent}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{filteredTransactions.length}</Text>
            <Text style={styles.summaryLabel}>Total Transactions</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              ${filteredTransactions
                .filter(tx => tx.type === 'buy')
                .reduce((sum, tx) => sum + tx.total_amount, 0)
                .toLocaleString()}
            </Text>
            <Text style={styles.summaryLabel}>Total Invested</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, styles.positiveValue]}>
              ${filteredTransactions
                .filter(tx => tx.type === 'sell' || tx.type === 'dividend')
                .reduce((sum, tx) => sum + tx.total_amount, 0)
                .toLocaleString()}
            </Text>
            <Text style={styles.summaryLabel}>Total Returns</Text>
          </View>
        </View>
      </Card>

      {/* Transactions List */}
      <FlatList
        data={filteredTransactions}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.transactionsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Calendar color={COLORS.TEXT_SECONDARY} size={64} />
            <Text style={styles.emptyStateTitle}>No Transactions Found</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery || selectedFilter !== 'all' || selectedPeriod !== 'all'
                ? 'Try adjusting your filters'
                : 'Start by tokenizing an asset or making a purchase!'
              }
            </Text>
            {!isConnected && (
              <Button
                title="Connect Wallet"
                onPress={() => {/* Handle wallet connection */}}
                style={styles.connectButton}
              />
            )}
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
  filterLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
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
  summaryCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: FONT_SIZES.lg,
    fontFamily: 'Inter-Bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.xs,
  },
  positiveValue: {
    color: '#10B981',
  },
  summaryLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: SPACING.md,
  },
  transactionsList: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  transactionCard: {
    marginBottom: SPACING.sm,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  transactionTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  assetTitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.xs,
  },
  transactionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionDate: {
    fontSize: FONT_SIZES.xs,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
  },
  pricePerToken: {
    fontSize: FONT_SIZES.xs,
    fontFamily: 'Inter-Medium',
    color: COLORS.TEXT_SECONDARY,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: FONT_SIZES.lg,
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  currencyText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: 'Inter-Regular',
    color: COLORS.TEXT_SECONDARY,
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
    marginBottom: SPACING.lg,
  },
  connectButton: {
    marginTop: SPACING.md,
  },
});
