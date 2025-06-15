import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Wallet, ExternalLink, Copy, Check, AlertCircle } from 'lucide-react-native';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { useWalletConnection } from '../hooks/useWallet';
import { COLORS, SPACING, FONT_SIZES } from '../constants';

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const walletOptions: WalletOption[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: 'https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Connect using MetaMask wallet',
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: 'https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Connect using WalletConnect protocol',
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: 'https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Connect using Coinbase Wallet',
  },
];

export function WalletConnector() {
  const [showModal, setShowModal] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  
  const {
    address,
    balance,
    isConnected,
    isConnecting,
    connectWallet,
    disconnectWallet,
    switchToPolygon,
    isOnCorrectNetwork,
    getFormattedAddress,
    getConnectionStatusMessage,
  } = useWalletConnection();

  const handleConnect = async (walletId: string) => {
    try {
      await connectWallet(walletId);
      setShowModal(false);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      Alert.alert('Connection Failed', 'Failed to connect wallet. Please try again.');
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      Alert.alert('Disconnection Failed', 'Failed to disconnect wallet.');
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      await switchToPolygon();
    } catch (error) {
      Alert.alert('Network Switch Failed', 'Could not switch to Polygon Mumbai.');
    }
  };

  const copyAddress = async () => {
    if (address) {
      await Clipboard.setStringAsync(address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected && address) {
    return (
      <View>
        <Card style={styles.connectedCard}>
          <View style={styles.connectedHeader}>
            <View style={styles.connectedInfo}>
              <View style={styles.walletIcon}>
                <Wallet color="#10B981" size={20} />
              </View>
              <View>
                <Text style={styles.connectedLabel}>Wallet Connected</Text>
                <Text style={styles.connectedAddress}>{getFormattedAddress()}</Text>
                {balance && (
                  <Text style={styles.balanceText}>{balance} MATIC</Text>
                )}
              </View>
            </View>
            <View style={styles.connectedActions}>
              <TouchableOpacity style={styles.copyButton} onPress={copyAddress}>
                {copiedAddress ? (
                  <Check color="#10B981" size={16} />
                ) : (
                  <Copy color="#6B7280" size={16} />
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
                <Text style={styles.disconnectText}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Network warning */}
        {!isOnCorrectNetwork() && (
          <Card style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <AlertCircle color="#F59E0B" size={20} />
              <Text style={styles.warningTitle}>Wrong Network</Text>
            </View>
            <Text style={styles.warningText}>
              Please switch to Polygon Mumbai testnet to use all features.
            </Text>
            <Button
              title="Switch Network"
              onPress={handleSwitchNetwork}
              variant="outline"
              style={styles.switchButton}
            />
          </Card>
        )}
      </View>
    );
  }

  return (
    <>
      <Button
        title="Connect Wallet"
        onPress={() => setShowModal(true)}
        loading={isConnecting}
        style={styles.connectButton}
      />

      <Modal
        visible={showModal}
        onClose={() => setShowModal(false)}
        style={styles.modal}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Connect Wallet</Text>
          <Text style={styles.modalSubtitle}>
            Choose your preferred wallet to connect to Omni Axis
          </Text>
        </View>

        <View style={styles.walletOptions}>
          {walletOptions.map((wallet) => (
            <TouchableOpacity
              key={wallet.id}
              style={styles.walletOption}
              onPress={() => handleConnect(wallet.id)}
            >
              <Image source={{ uri: wallet.icon }} style={styles.walletOptionIcon} />
              <View style={styles.walletOptionContent}>
                <Text style={styles.walletOptionName}>{wallet.name}</Text>
                <Text style={styles.walletOptionDescription}>{wallet.description}</Text>
              </View>
              <ExternalLink color="#6B7280" size={20} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.modalFooter}>
          <Text style={styles.footerText}>
            By connecting a wallet, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  connectButton: {
    marginVertical: 16,
  },
  connectedCard: {
    marginVertical: 16,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  connectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  connectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  walletIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  connectedLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#166534',
  },
  connectedAddress: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#16A34A',
    marginTop: 2,
  },
  connectedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  copyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  disconnectButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  disconnectText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#DC2626',
  },
  modal: {
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  walletOptions: {
    gap: 12,
    marginBottom: 24,
  },
  walletOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  walletOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 16,
  },
  walletOptionContent: {
    flex: 1,
  },
  walletOptionName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  walletOptionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  modalFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
});