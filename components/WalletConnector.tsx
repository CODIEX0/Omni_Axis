import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Wallet, ChevronRight } from 'lucide-react-native';
import { useWalletConnection } from '../hooks/useWallet';
import { Button } from './ui/Button';

export function WalletConnector() {
  const { isConnected, address, connectWallet, disconnectWallet } = useWalletConnection();
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      await connectWallet('metamask');
    } catch (error) {
      Alert.alert('Connection Failed', 'Unable to connect wallet. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
    } catch (error) {
      Alert.alert('Disconnection Failed', 'Unable to disconnect wallet.');
    }
  };

  if (isConnected && address) {
    return (
      <View style={styles.connectedContainer}>
        <View style={styles.walletInfo}>
          <Wallet color="#10B981" size={20} />
          <View style={styles.addressContainer}>
            <Text style={styles.connectedText}>Wallet Connected</Text>
            <Text style={styles.addressText}>
              {address.slice(0, 6)}...{address.slice(-4)}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleDisconnect} style={styles.disconnectButton}>
          <Text style={styles.disconnectText}>Disconnect</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.walletOption}>
        <View style={styles.walletInfo}>
          <Wallet color="#6B7280" size={24} />
          <View>
            <Text style={styles.walletName}>MetaMask</Text>
            <Text style={styles.walletDescription}>Connect using MetaMask</Text>
          </View>
        </View>
        <Button
          title={connecting ? "Connecting..." : "Connect"}
          onPress={handleConnect}
          loading={connecting}
          size="small"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  connectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  walletOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addressContainer: {
    marginLeft: 12,
  },
  walletName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginLeft: 12,
  },
  walletDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 12,
    marginTop: 2,
  },
  connectedText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#10B981',
  },
  addressText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  disconnectButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  disconnectText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#EF4444',
  },
});