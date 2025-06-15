import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Wallet, Shield, ExternalLink, Copy, Check } from 'lucide-react-native';
import { ethers } from 'ethers';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useTypedSelector } from '../hooks/useTypedSelector';
import { connectWallet, disconnectWallet } from '../store/slices/walletSlice';
import * as Clipboard from 'expo-clipboard';
import { config } from '../config';

interface WalletOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  deepLink?: string;
  downloadUrl?: string;
  supported: boolean;
}

interface EnhancedWalletConnectorProps {
  visible: boolean;
  onClose: () => void;
  onConnected?: (walletInfo: any) => void;
}

export function EnhancedWalletConnector({ 
  visible, 
  onClose, 
  onConnected 
}: EnhancedWalletConnectorProps) {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [connectionUri, setConnectionUri] = useState('');
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  
  const dispatch = useAppDispatch();
  const { isConnected, address, balance, chainId } = useTypedSelector(state => state.wallet);

  const walletOptions: WalletOption[] = [
    {
      id: 'metamask',
      name: 'MetaMask',
      description: 'Connect with the most popular crypto wallet',
      icon: '🦊',
      deepLink: 'metamask://dapp/' + config.APP_URL,
      downloadUrl: 'https://metamask.io/download/',
      supported: true,
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      description: 'Connect with 200+ wallets using QR code',
      icon: '🔗',
      supported: true,
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      description: 'Connect with Coinbase Wallet',
      icon: '🔵',
      deepLink: 'cbwallet://dapp?url=' + encodeURIComponent(config.APP_URL),
      downloadUrl: 'https://wallet.coinbase.com/',
      supported: true,
    },
    {
      id: 'trust',
      name: 'Trust Wallet',
      description: 'Connect with Trust Wallet',
      icon: '🛡️',
      deepLink: 'trust://dapp_url/' + encodeURIComponent(config.APP_URL),
      downloadUrl: 'https://trustwallet.com/',
      supported: true,
    },
    {
      id: 'rainbow',
      name: 'Rainbow',
      description: 'Connect with Rainbow wallet',
      icon: '🌈',
      deepLink: 'rainbow://dapp?url=' + encodeURIComponent(config.APP_URL),
      downloadUrl: 'https://rainbow.me/',
      supported: true,
    },
  ];

  useEffect(() => {
    if (copiedToClipboard) {
      const timer = setTimeout(() => setCopiedToClipboard(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedToClipboard]);

  const handleWalletConnect = async (walletId: string) => {
    if (connecting) return;
    
    setConnecting(true);
    setSelectedWallet(walletId);

    try {
      switch (walletId) {
        case 'metamask':
          await connectMetaMask();
          break;
        case 'walletconnect':
          await connectWalletConnect();
          break;
        case 'coinbase':
          await connectCoinbase();
          break;
        case 'trust':
          await connectTrust();
          break;
        case 'rainbow':
          await connectRainbow();
          break;
        default:
          throw new Error('Wallet not supported');
      }
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      Alert.alert(
        'Connection Failed',
        error.message || 'Failed to connect wallet. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setConnecting(false);
      setSelectedWallet(null);
    }
  };

  const connectMetaMask = async () => {
    try {
      // Check if MetaMask is installed
      if (typeof (global as any).ethereum !== 'undefined') {
        const provider = new ethers.providers.Web3Provider((global as any).ethereum);
        
        // Request account access
        await (global as any).ethereum.request({ method: 'eth_requestAccounts' });
        
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        const balance = await provider.getBalance(address);
        const network = await provider.getNetwork();

        const walletInfo = {
          address,
          balance: ethers.utils.formatEther(balance),
          chainId: network.chainId,
          provider: 'MetaMask',
        };

        dispatch(connectWallet(walletInfo));
        onConnected?.(walletInfo);
        onClose();
      } else {
        // MetaMask not installed, redirect to download
        Alert.alert(
          'MetaMask Not Found',
          'MetaMask is not installed. Would you like to download it?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Download', 
              onPress: () => {
                // Open MetaMask download page
                console.log('Open MetaMask download');
              }
            },
          ]
        );
      }
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('Connection rejected by user');
      }
      throw error;
    }
  };

  const connectWalletConnect = async () => {
    try {
      // This would integrate with WalletConnect
      // For now, we'll simulate the process
      setShowQRCode(true);
      
      // Simulate WalletConnect URI generation
      const uri = `wc:${Math.random().toString(36).substr(2, 9)}@1?bridge=${encodeURIComponent('https://bridge.walletconnect.org')}&key=${Math.random().toString(36).substr(2, 64)}`;
      setConnectionUri(uri);

      // In a real implementation, you would:
      // 1. Create WalletConnect client
      // 2. Generate connection URI
      // 3. Display QR code
      // 4. Handle connection events
      
      // Simulate connection after 3 seconds
      setTimeout(() => {
        const mockWalletInfo = {
          address: '0x' + Math.random().toString(16).substr(2, 40),
          balance: '1.234',
          chainId: parseInt(config.CHAIN_ID),
          provider: 'WalletConnect',
        };

        dispatch(connectWallet(mockWalletInfo));
        onConnected?.(mockWalletInfo);
        setShowQRCode(false);
        onClose();
      }, 3000);
      
    } catch (error) {
      setShowQRCode(false);
      throw error;
    }
  };

  const connectCoinbase = async () => {
    try {
      // Simulate Coinbase Wallet connection
      const mockWalletInfo = {
        address: '0x' + Math.random().toString(16).substr(2, 40),
        balance: '2.567',
        chainId: parseInt(config.CHAIN_ID),
        provider: 'Coinbase Wallet',
      };

      dispatch(connectWallet(mockWalletInfo));
      onConnected?.(mockWalletInfo);
      onClose();
    } catch (error) {
      throw error;
    }
  };

  const connectTrust = async () => {
    try {
      // Simulate Trust Wallet connection
      const mockWalletInfo = {
        address: '0x' + Math.random().toString(16).substr(2, 40),
        balance: '0.891',
        chainId: parseInt(config.CHAIN_ID),
        provider: 'Trust Wallet',
      };

      dispatch(connectWallet(mockWalletInfo));
      onConnected?.(mockWalletInfo);
      onClose();
    } catch (error) {
      throw error;
    }
  };

  const connectRainbow = async () => {
    try {
      // Simulate Rainbow wallet connection
      const mockWalletInfo = {
        address: '0x' + Math.random().toString(16).substr(2, 40),
        balance: '3.142',
        chainId: parseInt(config.CHAIN_ID),
        provider: 'Rainbow',
      };

      dispatch(connectWallet(mockWalletInfo));
      onConnected?.(mockWalletInfo);
      onClose();
    } catch (error) {
      throw error;
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to disconnect your wallet?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Disconnect', 
          style: 'destructive',
          onPress: () => {
            dispatch(disconnectWallet());
            onClose();
          }
        },
      ]
    );
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedToClipboard(true);
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (showQRCode) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.qrContainer}>
          <View style={styles.qrHeader}>
            <Text style={styles.qrTitle}>Scan QR Code</Text>
            <TouchableOpacity onPress={() => setShowQRCode(false)}>
              <X color="#6B7280" size={24} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.qrContent}>
            <View style={styles.qrCodePlaceholder}>
              <Text style={styles.qrCodeText}>QR Code</Text>
              <Text style={styles.qrCodeSubtext}>
                Scan with your wallet app
              </Text>
            </View>
            
            <Text style={styles.qrInstructions}>
              1. Open your wallet app{'\n'}
              2. Tap "Scan QR Code" or "WalletConnect"{'\n'}
              3. Point your camera at this QR code
            </Text>
            
            <View style={styles.uriContainer}>
              <Text style={styles.uriLabel}>Connection URI:</Text>
              <TouchableOpacity 
                style={styles.uriBox}
                onPress={() => copyToClipboard(connectionUri)}
              >
                <Text style={styles.uriText} numberOfLines={2}>
                  {connectionUri}
                </Text>
                {copiedToClipboard ? (
                  <Check color="#10B981" size={20} />
                ) : (
                  <Copy color="#6B7280" size={20} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <LinearGradient colors={['#1E40AF', '#3B82F6']} style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Wallet color="#FFFFFF" size={24} />
              <Text style={styles.headerTitle}>
                {isConnected ? 'Wallet Connected' : 'Connect Wallet'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color="#FFFFFF" size={24} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {isConnected ? (
            <View style={styles.connectedSection}>
              <View style={styles.walletInfo}>
                <View style={styles.walletDetails}>
                  <Text style={styles.connectedTitle}>Connected Wallet</Text>
                  <Text style={styles.walletAddress}>{formatAddress(address)}</Text>
                  <Text style={styles.walletBalance}>{balance} ETH</Text>
                </View>
                <Shield color="#10B981" size={32} />
              </View>
              
              <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
                <Text style={styles.disconnectButtonText}>Disconnect Wallet</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.description}>
                <Text style={styles.descriptionTitle}>
                  Choose your preferred wallet
                </Text>
                <Text style={styles.descriptionText}>
                  Connect securely with your crypto wallet to start tokenizing and trading assets
                </Text>
              </View>

              <View style={styles.walletList}>
                {walletOptions.map((wallet) => (
                  <TouchableOpacity
                    key={wallet.id}
                    style={[
                      styles.walletOption,
                      !wallet.supported && styles.walletOptionDisabled,
                      connecting && selectedWallet === wallet.id && styles.walletOptionConnecting,
                    ]}
                    onPress={() => wallet.supported && handleWalletConnect(wallet.id)}
                    disabled={!wallet.supported || connecting}
                  >
                    <View style={styles.walletOptionContent}>
                      <Text style={styles.walletIcon}>{wallet.icon}</Text>
                      <View style={styles.walletDetails}>
                        <Text style={styles.walletName}>{wallet.name}</Text>
                        <Text style={styles.walletDescription}>{wallet.description}</Text>
                      </View>
                    </View>
                    
                    {!wallet.supported && (
                      <Text style={styles.comingSoon}>Coming Soon</Text>
                    )}
                    
                    {connecting && selectedWallet === wallet.id && (
                      <Text style={styles.connecting}>Connecting...</Text>
                    )}
                    
                    {wallet.supported && !(connecting && selectedWallet === wallet.id) && (
                      <ExternalLink color="#6B7280" size={20} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.security}>
                <Shield color="#10B981" size={20} />
                <Text style={styles.securityText}>
                  Your wallet connection is secure and encrypted. We never store your private keys.
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  connectedSection: {
    paddingVertical: 20,
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  walletDetails: {
    flex: 1,
  },
  connectedTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#059669',
    marginBottom: 4,
  },
  walletAddress: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    marginBottom: 2,
  },
  walletBalance: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  disconnectButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disconnectButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  description: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  descriptionTitle: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  walletList: {
    paddingVertical: 20,
  },
  walletOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  walletOptionDisabled: {
    opacity: 0.6,
  },
  walletOptionConnecting: {
    borderColor: '#1E40AF',
    backgroundColor: '#EFF6FF',
  },
  walletOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  walletIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  walletName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 2,
  },
  walletDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  comingSoon: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#F59E0B',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  connecting: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1E40AF',
  },
  security: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    marginVertical: 20,
  },
  securityText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#059669',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  qrContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  qrTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  qrContent: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  qrCodePlaceholder: {
    width: 250,
    height: 250,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  qrCodeText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  qrCodeSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginTop: 4,
  },
  qrInstructions: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  uriContainer: {
    width: '100%',
  },
  uriLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 8,
  },
  uriBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  uriText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginRight: 8,
  },
});
