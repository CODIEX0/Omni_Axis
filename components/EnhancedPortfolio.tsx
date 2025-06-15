import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { ethers } from 'ethers';
import { config } from '../config';

// Contract ABIs (simplified)
const ASSET_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function balanceOf(address) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const YIELD_DISTRIBUTION_ABI = [
  "function getUserDistributions(address user) view returns (uint256[])",
  "function getUserClaimStatus(uint256 distributionId, address user) view returns (uint256 amount, bool claimed)",
  "function getDistribution(uint256 distributionId) view returns (tuple(uint256 id, address assetToken, uint256 totalAmount, uint256 totalSupply, uint256 distributionDate, uint256 claimDeadline, string description, bool isActive, uint256 totalClaimed))",
  "function claimYield(uint256 distributionId)",
  "function calculateUserShare(uint256 distributionId, address user) view returns (uint256)"
];

const PRICE_ORACLE_ABI = [
  "function getPrice(string memory symbol) view returns (uint256 price, uint256 timestamp)",
  "function isPriceStale(string memory symbol) view returns (bool)"
];

interface TokenHolding {
  contractAddress: string;
  name: string;
  symbol: string;
  balance: string;
  totalSupply: string;
  percentage: number;
  decimals: number;
}

interface YieldClaim {
  distributionId: number;
  amount: string;
  claimed: boolean;
  description: string;
  claimDeadline: number;
  canClaim: boolean;
}

export const EnhancedPortfolio: React.FC = () => {
  const [holdings, setHoldings] = useState<TokenHolding[]>([]);
  const [yieldClaims, setYieldClaims] = useState<YieldClaim[]>([]);
  const [totalPortfolioValue, setTotalPortfolioValue] = useState('0');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);
  const [userAddress, setUserAddress] = useState<string>('');

  useEffect(() => {
    initializeProvider();
  }, []);

  useEffect(() => {
    if (provider && userAddress) {
      loadPortfolioData();
    }
  }, [provider, userAddress]);

  const initializeProvider = async () => {
    try {
      const rpcProvider = new ethers.JsonRpcProvider(config.WEB3_PROVIDER_URL);
      setProvider(rpcProvider);
      
      // For demo, use the first Ganache account
      const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      const wallet = new ethers.Wallet(privateKey, rpcProvider);
      setUserAddress(wallet.address);
    } catch (error) {
      console.error('Provider initialization failed:', error);
      Alert.alert('Error', 'Failed to connect to blockchain');
    }
  };

  const loadPortfolioData = async () => {
    if (!provider || !userAddress) return;
    
    setIsLoading(true);
    try {
      await Promise.all([
        loadTokenHoldings(),
        loadYieldClaims()
      ]);
    } catch (error) {
      console.error('Failed to load portfolio data:', error);
      Alert.alert('Error', 'Failed to load portfolio data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTokenHoldings = async () => {
    if (!provider || !userAddress) return;

    try {
      // Load main asset token
      const tokenContract = new ethers.Contract(
        config.ASSET_TOKEN_CONTRACT_ADDRESS,
        ASSET_TOKEN_ABI,
        provider
      );

      const [name, symbol, balance, totalSupply, decimals] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.balanceOf(userAddress),
        tokenContract.totalSupply(),
        tokenContract.decimals()
      ]);

      const balanceFormatted = ethers.formatUnits(balance, decimals);
      const totalSupplyFormatted = ethers.formatUnits(totalSupply, decimals);
      const percentage = parseFloat(balanceFormatted) / parseFloat(totalSupplyFormatted) * 100;

      const holding: TokenHolding = {
        contractAddress: config.ASSET_TOKEN_CONTRACT_ADDRESS,
        name,
        symbol,
        balance: balanceFormatted,
        totalSupply: totalSupplyFormatted,
        percentage,
        decimals
      };

      setHoldings([holding]);
      
      // Calculate portfolio value (mock price for demo)
      const tokenValue = parseFloat(balanceFormatted) * 0.1; // Assume 0.1 ETH per token
      setTotalPortfolioValue(tokenValue.toFixed(4));
      
    } catch (error) {
      console.error('Failed to load token holdings:', error);
    }
  };

  const loadYieldClaims = async () => {
    if (!provider || !userAddress) return;

    try {
      const yieldContract = new ethers.Contract(
        config.YIELD_DISTRIBUTION_ADDRESS,
        YIELD_DISTRIBUTION_ABI,
        provider
      );

      const distributionIds = await yieldContract.getUserDistributions(userAddress);
      
      const claims: YieldClaim[] = [];
      
      for (const distributionId of distributionIds) {
        try {
          const [claimStatus, distribution] = await Promise.all([
            yieldContract.getUserClaimStatus(distributionId, userAddress),
            yieldContract.getDistribution(distributionId)
          ]);

          const canClaim = !claimStatus.claimed && 
                          distribution.isActive && 
                          Date.now() / 1000 < distribution.claimDeadline;

          claims.push({
            distributionId: distributionId.toString(),
            amount: ethers.formatEther(claimStatus.amount),
            claimed: claimStatus.claimed,
            description: distribution.description,
            claimDeadline: distribution.claimDeadline.toString(),
            canClaim
          });
        } catch (error) {
          console.error(`Failed to load distribution ${distributionId}:`, error);
        }
      }

      setYieldClaims(claims);
    } catch (error) {
      console.error('Failed to load yield claims:', error);
    }
  };

  const claimYield = async (distributionId: string) => {
    if (!provider || !userAddress) return;

    try {
      const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      const wallet = new ethers.Wallet(privateKey, provider);
      
      const yieldContract = new ethers.Contract(
        config.YIELD_DISTRIBUTION_ADDRESS,
        YIELD_DISTRIBUTION_ABI,
        wallet
      );

      const tx = await yieldContract.claimYield(distributionId);
      Alert.alert('Transaction Sent', 'Claim transaction submitted. Please wait for confirmation.');
      
      await tx.wait();
      Alert.alert('Success', 'Yield claimed successfully!');
      
      // Refresh data
      await loadYieldClaims();
      
    } catch (error) {
      console.error('Claim failed:', error);
      Alert.alert('Error', 'Failed to claim yield. Please try again.');
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadPortfolioData();
    setIsRefreshing(false);
  };

  const renderTokenHolding = (holding: TokenHolding) => (
    <View key={holding.contractAddress} style={styles.holdingCard}>
      <View style={styles.holdingHeader}>
        <Text style={styles.tokenName}>{holding.name}</Text>
        <Text style={styles.tokenSymbol}>{holding.symbol}</Text>
      </View>
      <View style={styles.holdingDetails}>
        <View style={styles.balanceRow}>
          <Text style={styles.label}>Balance:</Text>
          <Text style={styles.balance}>{parseFloat(holding.balance).toFixed(2)}</Text>
        </View>
        <View style={styles.balanceRow}>
          <Text style={styles.label}>Ownership:</Text>
          <Text style={styles.percentage}>{holding.percentage.toFixed(3)}%</Text>
        </View>
        <View style={styles.balanceRow}>
          <Text style={styles.label}>Total Supply:</Text>
          <Text style={styles.totalSupply}>{parseFloat(holding.totalSupply).toLocaleString()}</Text>
        </View>
      </View>
    </View>
  );

  const renderYieldClaim = (claim: YieldClaim) => (
    <View key={claim.distributionId} style={styles.claimCard}>
      <View style={styles.claimHeader}>
        <Text style={styles.claimDescription}>{claim.description}</Text>
        <Text style={styles.claimAmount}>{parseFloat(claim.amount).toFixed(4)} ETH</Text>
      </View>
      <View style={styles.claimDetails}>
        <Text style={styles.claimStatus}>
          Status: {claim.claimed ? '✅ Claimed' : claim.canClaim ? '⏳ Available' : '❌ Expired'}
        </Text>
        <Text style={styles.claimDeadline}>
          Deadline: {new Date(parseInt(claim.claimDeadline) * 1000).toLocaleDateString()}
        </Text>
      </View>
      {claim.canClaim && (
        <TouchableOpacity
          style={styles.claimButton}
          onPress={() => claimYield(claim.distributionId)}
        >
          <Text style={styles.claimButtonText}>Claim Yield</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Portfolio</Text>
        <View style={styles.portfolioValue}>
          <Text style={styles.valueLabel}>Total Value</Text>
          <Text style={styles.valueAmount}>{totalPortfolioValue} ETH</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Token Holdings</Text>
        {isLoading ? (
          <Text style={styles.loadingText}>Loading holdings...</Text>
        ) : holdings.length > 0 ? (
          holdings.map(renderTokenHolding)
        ) : (
          <Text style={styles.emptyText}>No token holdings found</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Yield Claims</Text>
        {yieldClaims.length > 0 ? (
          yieldClaims.map(renderYieldClaim)
        ) : (
          <Text style={styles.emptyText}>No yield distributions available</Text>
        )}
      </View>

      <View style={styles.addressInfo}>
        <Text style={styles.addressLabel}>Wallet Address:</Text>
        <Text style={styles.addressText}>{userAddress.slice(0, 10)}...{userAddress.slice(-8)}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  portfolioValue: {
    alignItems: 'center',
  },
  valueLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  valueAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  holdingCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  holdingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tokenName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  tokenSymbol: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  holdingDetails: {
    gap: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  balance: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  percentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  totalSupply: {
    fontSize: 14,
    color: '#666',
  },
  claimCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  claimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  claimDescription: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  claimAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  claimDetails: {
    gap: 5,
    marginBottom: 10,
  },
  claimStatus: {
    fontSize: 14,
    color: '#666',
  },
  claimDeadline: {
    fontSize: 12,
    color: '#999',
  },
  claimButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  claimButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    padding: 20,
  },
  addressInfo: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  addressLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  addressText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
  },
});
