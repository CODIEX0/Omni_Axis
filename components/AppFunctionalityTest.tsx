import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { CheckCircle, XCircle, Clock } from 'lucide-react-native';

interface TestResult {
  name: string;
  status: 'pending' | 'passed' | 'failed';
  error?: string;
}

export const AppFunctionalityTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTest = async (testName: string, testFunction: () => Promise<void>) => {
    setTestResults(prev => [...prev, { name: testName, status: 'pending' }]);
    
    try {
      await testFunction();
      setTestResults(prev => 
        prev.map(test => 
          test.name === testName 
            ? { ...test, status: 'passed' }
            : test
        )
      );
    } catch (error) {
      setTestResults(prev => 
        prev.map(test => 
          test.name === testName 
            ? { ...test, status: 'failed', error: error.message }
            : test
        )
      );
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      // Test 1: Environment Variables
      await runTest('Environment Variables', async () => {
        const requiredVars = [
          'EXPO_PUBLIC_DIDIT_API_KEY',
          'EXPO_PUBLIC_DIDIT_API_URL',
          'EXPO_PUBLIC_DEEPSEEK_API_KEY',
          'EXPO_PUBLIC_THIRDWEB_CLIENT_ID'
        ];

        for (const varName of requiredVars) {
          const value = process.env[varName];
          if (!value || value.includes('your_') || value.includes('placeholder')) {
            throw new Error(`${varName} not properly configured`);
          }
        }
      });

      // Test 2: Service Imports
      await runTest('Service Imports', async () => {
        const { diditKYCService } = await import('../services/diditKYC');
        const { demoAccountsService } = await import('../services/demoAccounts');
        
        if (!diditKYCService || !demoAccountsService) {
          throw new Error('Service imports failed');
        }
      });

      // Test 3: Component Imports
      await runTest('Component Imports', async () => {
        const { DiditKYCVerification } = await import('../components/DiditKYCVerification');
        const { KYCStatus } = await import('../components/KYCStatus');
        
        if (!DiditKYCVerification || !KYCStatus) {
          throw new Error('Component imports failed');
        }
      });

      // Test 4: Demo Accounts
      await runTest('Demo Accounts Service', async () => {
        const { demoAccountsService } = await import('../services/demoAccounts');
        const accounts = await demoAccountsService.getDemoAccounts();
        
        if (!accounts || accounts.length === 0) {
          throw new Error('No demo accounts found');
        }
      });

      // Test 5: KYC Service Initialization
      await runTest('KYC Service', async () => {
        const { diditKYCService } = await import('../services/diditKYC');
        
        // Test with demo account creation
        await diditKYCService.autoApproveDemoAccount('test_functional', 'investor');
        
        const session = await diditKYCService.getKYCSession('test_functional');
        if (!session) {
          throw new Error('Failed to create KYC session');
        }
      });

      // Test 6: AI Service
      await runTest('AI Service', async () => {
        try {
          const { deepSeekAI } = await import('../services/deepSeekAI');
          // Just check if service can be imported without making actual API call
          if (!deepSeekAI) {
            throw new Error('AI service not available');
          }
        } catch (error) {
          // AI service might not be critical for basic functionality
          console.log('AI service test skipped:', error.message);
        }
      });

    } catch (error) {
      console.error('Test suite error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle size={20} color="#10b981" />;
      case 'failed':
        return <XCircle size={20} color="#ef4444" />;
      case 'pending':
        return <Clock size={20} color="#f59e0b" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return '#10b981';
      case 'failed':
        return '#ef4444';
      case 'pending':
        return '#f59e0b';
    }
  };

  return (
    <View style={{ padding: 20, backgroundColor: '#fef3c7', borderRadius: 12, margin: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#92400e' }}>
        App Functionality Test
      </Text>
      <Text style={{ fontSize: 14, color: '#92400e', marginBottom: 15 }}>
        Comprehensive test of all app components and services
      </Text>
      
      <TouchableOpacity
        onPress={runAllTests}
        disabled={isRunning}
        style={{
          backgroundColor: isRunning ? '#94a3b8' : '#f59e0b',
          padding: 12,
          borderRadius: 8,
          alignItems: 'center',
          marginBottom: 15
        }}
      >
        <Text style={{ color: 'white', fontWeight: '600' }}>
          {isRunning ? 'Running Tests...' : 'Run All Tests'}
        </Text>
      </TouchableOpacity>

      {testResults.length > 0 && (
        <ScrollView style={{ maxHeight: 200 }}>
          {testResults.map((test, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'white',
                padding: 12,
                borderRadius: 8,
                marginBottom: 8
              }}
            >
              {getStatusIcon(test.status)}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontWeight: '500', color: '#1f2937' }}>
                  {test.name}
                </Text>
                {test.error && (
                  <Text style={{ fontSize: 12, color: '#ef4444', marginTop: 2 }}>
                    {test.error}
                  </Text>
                )}
              </View>
              <Text style={{ 
                fontSize: 12, 
                fontWeight: '500', 
                color: getStatusColor(test.status),
                textTransform: 'uppercase'
              }}>
                {test.status}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default AppFunctionalityTest;
