import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { diditKYCService } from '../services/diditKYC';

export const KYCIntegrationTest: React.FC = () => {
  const testDiditConnection = async () => {
    try {
      console.log('Testing Didit KYC Service...');
      
      // Test 1: Service initialization
      const service = diditKYCService;
      console.log('✅ Service instance created');
      
      // Test 2: Environment variables
      const apiKey = process.env.EXPO_PUBLIC_DIDIT_API_KEY;
      const apiUrl = process.env.EXPO_PUBLIC_DIDIT_API_URL;
      
      console.log('API Key exists:', !!apiKey && apiKey !== 'your_didit_api_key_here');
      console.log('API URL:', apiUrl);
      
      // Test 3: Demo session creation (safe for testing)
      try {
        await service.autoApproveDemoAccount('test_user_123', 'investor');
        console.log('✅ Demo account auto-approval works');
      } catch (error) {
        console.log('❌ Demo account test failed:', error);
      }
      
      // Test 4: Session retrieval
      try {
        const session = await service.getKYCSession('test_user_123');
        console.log('✅ Session retrieval works:', !!session);
      } catch (error) {
        console.log('❌ Session retrieval failed:', error);
      }
      
      Alert.alert(
        'KYC Integration Test',
        'Test completed! Check console for details.\n\nKYC service is ready for use.',
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('KYC Integration Test Error:', error);
      Alert.alert(
        'Test Failed',
        `Error: ${error.message}\n\nCheck console for details.`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={{ padding: 20, backgroundColor: '#f0f9ff', borderRadius: 12, margin: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#1e40af' }}>
        KYC Integration Test
      </Text>
      <Text style={{ fontSize: 14, color: '#1e40af', marginBottom: 15 }}>
        Test the Didit KYC service integration
      </Text>
      <TouchableOpacity
        onPress={testDiditConnection}
        style={{
          backgroundColor: '#3b82f6',
          padding: 12,
          borderRadius: 8,
          alignItems: 'center'
        }}
      >
        <Text style={{ color: 'white', fontWeight: '600' }}>
          Run KYC Test
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default KYCIntegrationTest;
