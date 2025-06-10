import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Clipboard,
} from 'react-native';
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

  const handleCopyAddress = () => {
    if (address) {
      Clipboard.setString(address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      await switchToPolygon();
    } catch (error) {
      console.error('Error switching network:', error);
      Alert.alert('Network Switch Failed', 'Failed to switch to Polygon network.');
    }
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
              <TouchableOpacity style={styles.copyButton} onPress={handleCopyAddress}>
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
    marginVertical: SPACING.MD,
  },
  connectedCard: {
    marginVertical: SPACING.MD,
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
    marginRight: SPACING.SM,
  },
  connectedLabel: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: '#166534',
  },
  connectedAddress: {
    fontSize: FONT_SIZES.XS,
    color: '#16A34A',
    marginTop: 2,
  },
  balanceText: {
    fontSize: FONT_SIZES.XS,
    color: '#059669',
    marginTop: 2,
  },
  connectedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
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
    paddingHorizontal: SPACING.SM,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  disconnectText: {
    fontSize: FONT_SIZES.XS,
    fontWeight: '600',
    color: '#DC2626',
  },
  warningCard: {
    marginTop: SPACING.SM,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  warningTitle: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: SPACING.SM,
  },
  warningText: {
    fontSize: FONT_SIZES.SM,
    color: '#B45309',
    marginBottom: SPACING.MD,
  },
  switchButton: {
    backgroundColor: '#F59E0B',
  },
  modal: {
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: SPACING.LG,
  },
  modalTitle: {
    fontSize: FONT_SIZES.XXL,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  modalSubtitle: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 24,
  },
  walletOptions: {
    gap: SPACING.SM,
    marginBottom: SPACING.LG,
  },
  walletOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: SPACING.MD,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  walletOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SPACING.MD,
  },
  walletOptionContent: {
    flex: 1,
  },
  walletOptionName: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  walletOptionDescription: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  modalFooter: {
    paddingTop: SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerText: {
    fontSize: FONT_SIZES.XS,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
});
