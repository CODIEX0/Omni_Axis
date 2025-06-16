import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { demoAccountsService } from '../services/demoAccounts';

export const DemoAccountTest: React.FC = () => {
  const testDemoAccounts = async () => {
    try {
      console.log('Testing Demo Accounts Service...');
      
      // Test 1: Load demo accounts
      const accounts = await demoAccountsService.getDemoAccounts();
      console.log('✅ Demo accounts loaded:', accounts.length);
      
      // Test 2: Get specific role
      const investor = await demoAccountsService.getDemoAccountByRole('investor');
      console.log('✅ Investor account:', !!investor);
      
      // Test 3: Get asset manager
      const assetManager = await demoAccountsService.getDemoAccountByRole('asset_manager');
      console.log('✅ Asset manager account:', !!assetManager);
      
      Alert.alert(
        'Demo Accounts Test',
        `✅ Found ${accounts.length} demo accounts\n✅ Investor: ${investor?.name}\n✅ Asset Manager: ${assetManager?.name}`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Demo Accounts Test Error:', error);
      Alert.alert(
        'Test Failed',
        `Error: ${error.message}`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={{ padding: 20, backgroundColor: '#f0fdf4', borderRadius: 12, margin: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#166534' }}>
        Demo Accounts Test
      </Text>
      <Text style={{ fontSize: 14, color: '#166534', marginBottom: 15 }}>
        Test demo account loading and role selection
      </Text>
      <TouchableOpacity
        onPress={testDemoAccounts}
        style={{
          backgroundColor: '#10b981',
          padding: 12,
          borderRadius: 8,
          alignItems: 'center'
        }}
      >
        <Text style={{ color: 'white', fontWeight: '600' }}>
          Test Demo Accounts
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default DemoAccountTest;
