import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import { ethers } from 'ethers';
import { config } from '../config';

const MARKETPLACE_ABI = [
  "function listings(uint256) view returns (uint256 id, address seller, address tokenContract, uint256 tokenAmount, uint256 pricePerToken, uint8 listingType, uint8 status, uint256 startTime, uint256 endTime, uint256 highestBid, address highestBidder, bool escrowRequired, uint256 createdAt)",
  "function nextListingId() view returns (uint256)",
  "function getUserListings(address user) view returns (uint256[])",
  "function buyFixedPrice(uint256 listingId) payable",
  "function placeBid(uint256 listingId) payable",
  "function finalizeAuction(uint256 listingId)",
  "function cancelListing(uint256 listingId)"
];

const ASSET_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

interface Listing {
  id: string;
  seller: string;
  tokenContract: string;
  tokenAmount: string;
  pricePerToken: string;
  listingType: number;
  status: number;
  startTime: number;
  endTime: number;
  highestBid: string;
  highestBidder: string;
  escrowRequired: boolean;
  createdAt: number;
  tokenName?: string;
  tokenSymbol?: string;
  totalPrice: string;
  isActive: boolean;
  isAuction: boolean;
  timeRemaining?: string;
}

enum ListingStatus {
  ACTIVE = 0,
  SOLD = 1,
  CANCELLED = 2,
  EXPIRED = 3
}

enum ListingType {
  FIXED_PRICE = 0,
  AUCTION = 1
}

export const EnhancedMarketplace: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);
  const [userAddress, setUserAddress] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'browse' | 'my-listings'>('browse');

  useEffect(() => {
    initializeProvider();
  }, []);

  useEffect(() => {
    if (provider && userAddress) {
      loadMarketplaceData();
    }
  }, [provider, userAddress]);

  const initializeProvider = async () => {
    try {
      const rpcProvider = new ethers.JsonRpcProvider(config.WEB3_PROVIDER_URL);
      setProvider(rpcProvider);
      
      // For demo, use different accounts for different scenarios
      const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      const wallet = new ethers.Wallet(privateKey, rpcProvider);
      setUserAddress(wallet.address);
    } catch (error) {
      console.error('Provider initialization failed:', error);
      Alert.alert('Error', 'Failed to connect to blockchain');
    }
  };

  const loadMarketplaceData = async () => {
    if (!provider) return;

    setIsLoading(true);
    try {
      await Promise.all([
        loadAllListings(),
        loadUserListings()
      ]);
    } catch (error) {
      console.error('Failed to load marketplace data:', error);
      Alert.alert('Error', 'Failed to load marketplace data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllListings = async () => {
    if (!provider) return;

    try {
      const marketplaceContract = new ethers.Contract(
        config.MARKETPLACE_CONTRACT_ADDRESS,
        MARKETPLACE_ABI,
        provider
      );

      const nextId = await marketplaceContract.nextListingId();
      const loadedListings: Listing[] = [];

      // Load listings from ID 1 to nextId-1
      for (let i = 1; i < nextId; i++) {
        try {
          const listing = await marketplaceContract.listings(i);
          
          // Skip if this is a zero address (deleted listing)
          if (listing.seller === ethers.ZeroAddress) continue;

          const formattedListing = await formatListing(listing, i);
          if (formattedListing.isActive) {
            loadedListings.push(formattedListing);
          }
        } catch (error) {
          console.error(`Failed to load listing ${i}:`, error);
        }
      }

      setListings(loadedListings);
    } catch (error) {
      console.error('Failed to load listings:', error);
    }
  };

  const loadUserListings = async () => {
    if (!provider || !userAddress) return;

    try {
      const marketplaceContract = new ethers.Contract(
        config.MARKETPLACE_CONTRACT_ADDRESS,
        MARKETPLACE_ABI,
        provider
      );

      const userListingIds = await marketplaceContract.getUserListings(userAddress);
      const loadedUserListings: Listing[] = [];

      for (const listingId of userListingIds) {
        try {
          const listing = await marketplaceContract.listings(listingId);
          const formattedListing = await formatListing(listing, listingId);
          loadedUserListings.push(formattedListing);
        } catch (error) {
          console.error(`Failed to load user listing ${listingId}:`, error);
        }
      }

      setUserListings(loadedUserListings);
    } catch (error) {
      console.error('Failed to load user listings:', error);
    }
  };

  const formatListing = async (listing: any, id: number): Promise<Listing> => {
    let tokenName = 'Unknown Token';
    let tokenSymbol = 'UNK';

    try {
      const tokenContract = new ethers.Contract(
        listing.tokenContract,
        ASSET_TOKEN_ABI,
        provider!
      );
      [tokenName, tokenSymbol] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol()
      ]);
    } catch (error) {
      console.error('Failed to load token details:', error);
    }

    const tokenAmount = ethers.formatEther(listing.tokenAmount);
    const pricePerToken = ethers.formatEther(listing.pricePerToken);
    const totalPrice = (parseFloat(tokenAmount) * parseFloat(pricePerToken)).toString();
    const highestBid = ethers.formatEther(listing.highestBid);

    const isActive = listing.status === ListingStatus.ACTIVE && 
                    listing.endTime.toString() > Math.floor(Date.now() / 1000).toString();
    const isAuction = listing.listingType === ListingType.AUCTION;

    let timeRemaining = '';
    if (isActive) {
      const endTime = parseInt(listing.endTime.toString()) * 1000;
      const now = Date.now();
      if (endTime > now) {
        const diff = endTime - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        timeRemaining = `${hours}h ${minutes}m`;
      }
    }

    return {
      id: id.toString(),
      seller: listing.seller,
      tokenContract: listing.tokenContract,
      tokenAmount,
      pricePerToken,
      listingType: listing.listingType,
      status: listing.status,
      startTime: parseInt(listing.startTime.toString()),
      endTime: parseInt(listing.endTime.toString()),
      highestBid,
      highestBidder: listing.highestBidder,
      escrowRequired: listing.escrowRequired,
      createdAt: parseInt(listing.createdAt.toString()),
      tokenName,
      tokenSymbol,
      totalPrice,
      isActive,
      isAuction,
      timeRemaining
    };
  };

  const buyFixedPrice = async (listing: Listing) => {
    if (!provider || !userAddress) return;

    try {
      const privateKey = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'; // Second account
      const wallet = new ethers.Wallet(privateKey, provider);

      const marketplaceContract = new ethers.Contract(
        config.MARKETPLACE_CONTRACT_ADDRESS,
        MARKETPLACE_ABI,
        wallet
      );

      const totalPrice = ethers.parseEther(listing.totalPrice);
      const tx = await marketplaceContract.buyFixedPrice(listing.id, { value: totalPrice });
      
      Alert.alert('Transaction Sent', 'Purchase transaction submitted. Please wait for confirmation.');
      await tx.wait();
      Alert.alert('Success', 'Asset purchased successfully!');
      
      await loadMarketplaceData();
      setShowBuyModal(false);
      
    } catch (error) {
      console.error('Purchase failed:', error);
      Alert.alert('Error', 'Failed to purchase asset. Please try again.');
    }
  };

  const placeBid = async (listing: Listing) => {
    if (!provider || !userAddress || !bidAmount) return;

    try {
      const privateKey = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
      const wallet = new ethers.Wallet(privateKey, provider);

      const marketplaceContract = new ethers.Contract(
        config.MARKETPLACE_CONTRACT_ADDRESS,
        MARKETPLACE_ABI,
        wallet
      );

      const bidValue = ethers.parseEther(bidAmount);
      const tx = await marketplaceContract.placeBid(listing.id, { value: bidValue });
      
      Alert.alert('Bid Placed', 'Your bid has been submitted. Please wait for confirmation.');
      await tx.wait();
      Alert.alert('Success', 'Bid placed successfully!');
      
      await loadMarketplaceData();
      setShowBuyModal(false);
      setBidAmount('');
      
    } catch (error) {
      console.error('Bid failed:', error);
      Alert.alert('Error', 'Failed to place bid. Please try again.');
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadMarketplaceData();
    setIsRefreshing(false);
  };

  const renderListing = (listing: Listing) => (
    <TouchableOpacity
      key={listing.id}
      style={styles.listingCard}
      onPress={() => {
        setSelectedListing(listing);
        setShowDetailsModal(true);
      }}
    >
      <View style={styles.listingHeader}>
        <Text style={styles.tokenName}>{listing.tokenName}</Text>
        <Text style={styles.tokenSymbol}>{listing.tokenSymbol}</Text>
      </View>
      
      <View style={styles.listingDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Amount:</Text>
          <Text style={styles.value}>{parseFloat(listing.tokenAmount).toFixed(2)} tokens</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.label}>Price per token:</Text>
          <Text style={styles.value}>{parseFloat(listing.pricePerToken).toFixed(4)} ETH</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.label}>Total price:</Text>
          <Text style={styles.totalPrice}>{parseFloat(listing.totalPrice).toFixed(4)} ETH</Text>
        </View>
        
        {listing.isAuction && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Highest bid:</Text>
            <Text style={styles.value}>
              {parseFloat(listing.highestBid) > 0 ? `${parseFloat(listing.highestBid).toFixed(4)} ETH` : 'No bids'}
            </Text>
          </View>
        )}
        
        {listing.timeRemaining && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Time remaining:</Text>
            <Text style={styles.timeRemaining}>{listing.timeRemaining}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.listingFooter}>
        <Text style={styles.listingType}>
          {listing.isAuction ? '🔨 Auction' : '💰 Fixed Price'}
        </Text>
        <Text style={styles.seller}>
          Seller: {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderDetailsModal = () => (
    <Modal
      visible={showDetailsModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Asset Details</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowDetailsModal(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        {selectedListing && (
          <ScrollView style={styles.modalContent}>
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>{selectedListing.tokenName}</Text>
              <Text style={styles.sectionSubtitle}>{selectedListing.tokenSymbol}</Text>
            </View>
            
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Amount for sale</Text>
              <Text style={styles.detailValue}>{parseFloat(selectedListing.tokenAmount).toFixed(2)} tokens</Text>
            </View>
            
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Price per token</Text>
              <Text style={styles.detailValue}>{parseFloat(selectedListing.pricePerToken).toFixed(4)} ETH</Text>
            </View>
            
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Total price</Text>
              <Text style={styles.highlightValue}>{parseFloat(selectedListing.totalPrice).toFixed(4)} ETH</Text>
            </View>
            
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Listing type</Text>
              <Text style={styles.detailValue}>
                {selectedListing.isAuction ? 'Auction' : 'Fixed Price'}
              </Text>
            </View>
            
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Seller</Text>
              <Text style={styles.addressValue}>{selectedListing.seller}</Text>
            </View>
            
            {selectedListing.isAuction && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Current highest bid</Text>
                <Text style={styles.detailValue}>
                  {parseFloat(selectedListing.highestBid) > 0 
                    ? `${parseFloat(selectedListing.highestBid).toFixed(4)} ETH` 
                    : 'No bids yet'}
                </Text>
              </View>
            )}
            
            {selectedListing.timeRemaining && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Time remaining</Text>
                <Text style={styles.timeValue}>{selectedListing.timeRemaining}</Text>
              </View>
            )}
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setShowDetailsModal(false);
                setShowBuyModal(true);
              }}
            >
              <Text style={styles.actionButtonText}>
                {selectedListing.isAuction ? 'Place Bid' : 'Buy Now'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </Modal>
  );

  const renderBuyModal = () => (
    <Modal
      visible={showBuyModal}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.buyModalOverlay}>
        <View style={styles.buyModalContent}>
          <Text style={styles.buyModalTitle}>
            {selectedListing?.isAuction ? 'Place Bid' : 'Confirm Purchase'}
          </Text>
          
          {selectedListing?.isAuction ? (
            <View>
              <Text style={styles.buyModalText}>
                Current highest bid: {parseFloat(selectedListing.highestBid).toFixed(4)} ETH
              </Text>
              <TextInput
                style={styles.bidInput}
                placeholder="Enter your bid (ETH)"
                value={bidAmount}
                onChangeText={setBidAmount}
                keyboardType="numeric"
              />
            </View>
          ) : (
            <Text style={styles.buyModalText}>
              Total cost: {selectedListing?.totalPrice} ETH
            </Text>
          )}
          
          <View style={styles.buyModalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowBuyModal(false);
                setBidAmount('');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => {
                if (selectedListing?.isAuction) {
                  placeBid(selectedListing);
                } else {
                  selectedListing && buyFixedPrice(selectedListing);
                }
              }}
            >
              <Text style={styles.confirmButtonText}>
                {selectedListing?.isAuction ? 'Place Bid' : 'Buy Now'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Marketplace</Text>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'browse' && styles.activeTab]}
            onPress={() => setActiveTab('browse')}
          >
            <Text style={[styles.tabText, activeTab === 'browse' && styles.activeTabText]}>
              Browse
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'my-listings' && styles.activeTab]}
            onPress={() => setActiveTab('my-listings')}
          >
            <Text style={[styles.tabText, activeTab === 'my-listings' && styles.activeTabText]}>
              My Listings
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
          <Text style={styles.loadingText}>Loading marketplace...</Text>
        ) : activeTab === 'browse' ? (
          listings.length > 0 ? (
            listings.map(renderListing)
          ) : (
            <Text style={styles.emptyText}>No active listings found</Text>
          )
        ) : (
          userListings.length > 0 ? (
            userListings.map(renderListing)
          ) : (
            <Text style={styles.emptyText}>You have no listings</Text>
          )
        )}
      </ScrollView>

      {renderDetailsModal()}
      {renderBuyModal()}
    </View>
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
    paddingBottom: 0,
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
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  listingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  tokenName: {
    fontSize: 18,
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
  listingDetails: {
    gap: 8,
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  timeRemaining: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: 'bold',
  },
  listingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  listingType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  seller: {
    fontSize: 12,
    color: '#999',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 40,
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    padding: 40,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  highlightValue: {
    fontSize: 20,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  addressValue: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
  },
  timeValue: {
    fontSize: 16,
    color: '#FF9800',
    fontWeight: 'bold',
  },
  actionButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyModalContent: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
  },
  buyModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  buyModalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  bidInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  buyModalButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  confirmButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
});
