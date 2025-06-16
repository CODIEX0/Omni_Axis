import { useState, useEffect } from 'react';
import { 
  useAddress, 
  useConnectionStatus, 
  useWallet, 
  useBalance, 
  useConnect,
  useDisconnect,
} from '@thirdweb-dev/react-native';
import type { WalletInstance } from '@thirdweb-dev/react-native';
import { POLYGON_MUMBAI } from '../constants';
import { useAuth } from './useAuth';

export interface WalletState {
  address: string | undefined;
  balance: string | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  wallet: WalletInstance | undefined;
  chainId: number | undefined;
}

export const useWalletConnection = () => {
  const address = useAddress();
  const connectionStatus = useConnectionStatus();
  const wallet = useWallet();
  const connect = useConnect();
  const disconnect = useDisconnect();
  
  // Get balance for the connected wallet
  const { data: balance, isLoading: balanceLoading } = useBalance();
  
  const { updateProfile, profile } = useAuth();
  
  const [walletState, setWalletState] = useState<WalletState>({
    address: undefined,
    balance: undefined,
    isConnected: false,
    isConnecting: false,
    wallet: undefined,
    chainId: undefined,
  });

  // Update wallet state when connection changes
  useEffect(() => {
    const isConnected = connectionStatus === 'connected';
    const isConnecting = connectionStatus === 'connecting';

    setWalletState({
      address,
      balance: balance?.displayValue,
      isConnected,
      isConnecting,
      wallet,
      chainId: wallet?.getChainId ? (wallet.getChainId() as any) : undefined,
    });

    // Update user profile with wallet address
    if (isConnected && address && profile && profile.wallet_address !== address) {
      updateProfile({ wallet_address: address });
    }
  }, [address, balance, connectionStatus, wallet, profile, updateProfile]);

  // Connect to a specific wallet
  const connectWallet = async (walletConfig: any) => {
    try {
      setWalletState(prev => ({ ...prev, isConnecting: true }));
      await connect(walletConfig);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    } finally {
      setWalletState(prev => ({ ...prev, isConnecting: false }));
    }
  };

  // Disconnect wallet
  const disconnectWallet = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      throw error;
    }
  };

  // Switch to Polygon Mumbai network
  const switchToPolygon = async () => {
    try {
      if (!wallet) {
        throw new Error('No wallet connected');
      }

      await wallet.switchChain(POLYGON_MUMBAI.chainId);
    } catch (error) {
      console.error('Error switching network:', error);
      throw error;
    }
  };

  // Check if on correct network
  const isOnCorrectNetwork = () => {
    return walletState.chainId === POLYGON_MUMBAI.chainId;
  };

  // Sign message
  const signMessage = async (message: string) => {
    try {
      if (!wallet) {
        throw new Error('No wallet connected');
      }

      // Use personal_sign method if available
      const signature = await (wallet as any).personalSign?.(message) || (wallet as any).sign?.(message);
      return signature;
    } catch (error) {
      console.error('Error signing message:', error);
      throw error;
    }
  };

  // Send transaction
  const sendTransaction = async (to: string, value: string) => {
    try {
      if (!wallet) {
        throw new Error('No wallet connected');
      }

      const tx = await wallet.transfer(to, value);
      return tx;
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  };

  // Get formatted address (shortened)
  const getFormattedAddress = (addr?: string) => {
    const targetAddress = addr || address;
    if (!targetAddress) return '';
    
    return `${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)}`;
  };

  // Get wallet connection status message
  const getConnectionStatusMessage = () => {
    switch (connectionStatus) {
      case 'connecting':
        return 'Connecting to wallet...';
      case 'connected':
        return 'Wallet connected';
      case 'disconnected':
        return 'Wallet disconnected';
      case 'unknown':
        return 'Checking wallet connection...';
      default:
        return 'Unknown connection status';
    }
  };

  // Check if wallet has sufficient balance for transaction
  const hasSufficientBalance = (requiredAmount: string) => {
    if (!balance?.value) return false;
    
    try {
      const balanceValue = parseFloat(balance.displayValue);
      const required = parseFloat(requiredAmount);
      return balanceValue >= required;
    } catch {
      return false;
    }
  };

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
    switchToPolygon,
    isOnCorrectNetwork,
    signMessage,
    sendTransaction,
    getFormattedAddress,
    getConnectionStatusMessage,
    hasSufficientBalance,
    balanceLoading,
    connectionStatus,
  };
};
