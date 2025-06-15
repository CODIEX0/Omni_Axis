import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ethers } from 'ethers';
import { config } from '../config';

// Contract ABIs (simplified for testing)
const ASSET_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function kycVerified(address) view returns (bool)"
];

const DECENTRALIZED_KYC_ABI = [
  "function isKYCVerified(address user) view returns (bool)",
  "function adminSetKYC(address user, uint8 level, uint8 riskRating, uint256 expiresAt, string jurisdiction, string ipfsHash)"
];

const ASSET_MARKETPLACE_ABI = [
  "function platformFeeRate() view returns (uint256)",
  "function feeRecipient() view returns (address)"
];

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
}

export const IntegrationTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Wallet | null>(null);

  useEffect(() => {
    initializeProvider();
  }, []);

  const initializeProvider = async () => {
    try {
      const rpcProvider = new ethers.JsonRpcProvider(config.WEB3_PROVIDER_URL);
      setProvider(rpcProvider);
      
      // Use the first Ganache account for testing
      const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      const wallet = new ethers.Wallet(privateKey, rpcProvider);
      setSigner(wallet);
      
      addTestResult('Provider Setup', 'success', 'Connected to Ganache');
    } catch (error) {
      addTestResult('Provider Setup', 'error', `Failed to connect: ${error.message}`);
    }
  };

  const addTestResult = (name: string, status: 'pending' | 'success' | 'error', message: string) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.name === name);
      if (existing) {
        existing.status = status;
        existing.message = message;
        return [...prev];
      }
      return [...prev, { name, status, message }];
    });
  };

  const runTests = async () => {
    if (!provider || !signer) {
      Alert.alert('Error', 'Provider not initialized');
      return;
    }

    setIsRunning(true);
    setTestResults([]);

    try {
      await testNetworkConnection();
      await testContractConnections();
      await testKYCContract();
      await testAssetTokenContract();
      await testMarketplaceContract();
      
      Alert.alert('Success', 'All integration tests completed!');
    } catch (error) {
      Alert.alert('Error', `Tests failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const testNetworkConnection = async () => {
    addTestResult('Network Connection', 'pending', 'Testing...');
    
    try {
      const network = await provider!.getNetwork();
      const balance = await provider!.getBalance(signer!.address);
      
      addTestResult('Network Connection', 'success', 
        `Chain ID: ${network.chainId}, Balance: ${ethers.formatEther(balance)} ETH`);
    } catch (error) {
      addTestResult('Network Connection', 'error', error.message);
      throw error;
    }
  };

  const testContractConnections = async () => {
    addTestResult('Contract Addresses', 'pending', 'Checking...');
    
    const addresses = [
      `KYC: ${config.DECENTRALIZED_KYC_ADDRESS}`,
      `Token: ${config.ASSET_TOKEN_CONTRACT_ADDRESS}`,
      `Marketplace: ${config.MARKETPLACE_CONTRACT_ADDRESS}`
    ];
    
    if (!config.DECENTRALIZED_KYC_ADDRESS || !config.ASSET_TOKEN_CONTRACT_ADDRESS || !config.MARKETPLACE_CONTRACT_ADDRESS) {
      addTestResult('Contract Addresses', 'error', 'Missing contract addresses in config');
      throw new Error('Missing contract addresses');
    }
    
    addTestResult('Contract Addresses', 'success', addresses.join(', '));
  };

  const testKYCContract = async () => {
    addTestResult('KYC Contract', 'pending', 'Testing...');
    
    try {
      const kycContract = new ethers.Contract(
        config.DECENTRALIZED_KYC_ADDRESS,
        DECENTRALIZED_KYC_ABI,
        signer
      );
      
      const isVerified = await kycContract.isKYCVerified(signer!.address);
      
      addTestResult('KYC Contract', 'success', 
        `User KYC Status: ${isVerified ? 'Verified' : 'Not Verified'}`);
    } catch (error) {
      addTestResult('KYC Contract', 'error', error.message);
      throw error;
    }
  };

  const testAssetTokenContract = async () => {
    addTestResult('Asset Token', 'pending', 'Testing...');
    
    try {
      const tokenContract = new ethers.Contract(
        config.ASSET_TOKEN_CONTRACT_ADDRESS,
        ASSET_TOKEN_ABI,
        signer
      );
      
      const name = await tokenContract.name();
      const symbol = await tokenContract.symbol();
      const balance = await tokenContract.balanceOf(signer!.address);
      const kycStatus = await tokenContract.kycVerified(signer!.address);
      
      addTestResult('Asset Token', 'success', 
        `${name} (${symbol}), Balance: ${ethers.formatEther(balance)}, KYC: ${kycStatus}`);
    } catch (error) {
      addTestResult('Asset Token', 'error', error.message);
      throw error;
    }
  };

  const testMarketplaceContract = async () => {
    addTestResult('Marketplace', 'pending', 'Testing...');
    
    try {
      const marketplaceContract = new ethers.Contract(
        config.MARKETPLACE_CONTRACT_ADDRESS,
        ASSET_MARKETPLACE_ABI,
        signer
      );
      
      const feeRate = await marketplaceContract.platformFeeRate();
      const feeRecipient = await marketplaceContract.feeRecipient();
      
      addTestResult('Marketplace', 'success', 
        `Fee Rate: ${feeRate} bp, Fee Recipient: ${feeRecipient.slice(0, 10)}...`);
    } catch (error) {
      addTestResult('Marketplace', 'error', error.message);
      throw error;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#4CAF50';
      case 'error': return '#F44336';
      case 'pending': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'pending': return '⏳';
      default: return '⚪';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Integration Test Suite</Text>
      <Text style={styles.subtitle}>
        Tests the complete flow from React Native to Smart Contracts
      </Text>
      
      <TouchableOpacity 
        style={[styles.button, isRunning && styles.buttonDisabled]} 
        onPress={runTests}
        disabled={isRunning}
      >
        <Text style={styles.buttonText}>
          {isRunning ? 'Running Tests...' : 'Run Integration Tests'}
        </Text>
      </TouchableOpacity>

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        {testResults.map((result, index) => (
          <View key={index} style={styles.resultItem}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultIcon}>{getStatusIcon(result.status)}</Text>
              <Text style={styles.resultName}>{result.name}</Text>
            </View>
            <Text style={[styles.resultMessage, { color: getStatusColor(result.status) }]}>
              {result.message}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.configInfo}>
        <Text style={styles.configTitle}>Current Configuration:</Text>
        <Text style={styles.configItem}>RPC URL: {config.WEB3_PROVIDER_URL}</Text>
        <Text style={styles.configItem}>Chain ID: {config.CHAIN_ID}</Text>
        <Text style={styles.configItem}>KYC Contract: {config.DECENTRALIZED_KYC_ADDRESS?.slice(0, 20)}...</Text>
        <Text style={styles.configItem}>Token Contract: {config.ASSET_TOKEN_CONTRACT_ADDRESS?.slice(0, 20)}...</Text>
        <Text style={styles.configItem}>Marketplace: {config.MARKETPLACE_CONTRACT_ADDRESS?.slice(0, 20)}...</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    marginBottom: 30,
  },
  buttonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  resultItem: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  resultIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  resultName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  resultMessage: {
    fontSize: 14,
    marginLeft: 26,
    lineHeight: 20,
  },
  configInfo: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  configTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  configItem: {
    fontSize: 12,
    marginBottom: 5,
    color: '#666',
    fontFamily: 'monospace',
  },
});
