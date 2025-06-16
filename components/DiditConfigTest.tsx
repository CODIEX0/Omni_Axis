import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react-native';
import { diditKYCService } from '../services/diditKYC';

export const DiditConfigTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [testResults, setTestResults] = useState<{
    configCheck: boolean | null;
    apiConnection: boolean | null;
    sessionCreation: boolean | null;
  }>({
    configCheck: null,
    apiConnection: null,
    sessionCreation: null,
  });

  const DIDIT_API_KEY = process.env.EXPO_PUBLIC_DIDIT_API_KEY;
  const DIDIT_API_URL = process.env.EXPO_PUBLIC_DIDIT_API_URL;

  useEffect(() => {
    runConfigurationTest();
  }, []);

  const runConfigurationTest = async () => {
    setIsLoading(true);
    const results = { ...testResults };

    try {
      // Test 1: Configuration Check
      console.log('Testing Didit configuration...');
      const hasApiKey = DIDIT_API_KEY && DIDIT_API_KEY !== 'your_didit_api_key_here';
      const hasApiUrl = DIDIT_API_URL && DIDIT_API_URL.includes('didit.me');
      results.configCheck = !!(hasApiKey && hasApiUrl);

      // Test 2: API Connection (simple ping)
      console.log('Testing API connection...');
      try {
        const response = await fetch(`${DIDIT_API_URL}/health`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${DIDIT_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        results.apiConnection = response.status < 500; // Accept any non-server error
      } catch (error) {
        console.log('API connection test failed:', error);
        results.apiConnection = false;
      }

      // Test 3: Session Creation (if API is available)
      if (results.apiConnection) {
        console.log('Testing session creation...');
        try {
          await diditKYCService.initializeKYCSession('test_user_config_check');
          results.sessionCreation = true;
        } catch (error) {
          console.log('Session creation test failed:', error);
          results.sessionCreation = false;
        }
      } else {
        results.sessionCreation = false;
      }

      setTestResults(results);
    } catch (error) {
      console.error('Configuration test failed:', error);
      Alert.alert('Test Error', 'Failed to run configuration tests');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return <AlertCircle size={20} color="#6b7280" />;
    if (status === true) return <CheckCircle size={20} color="#10b981" />;
    return <XCircle size={20} color="#ef4444" />;
  };

  const getStatusText = (status: boolean | null) => {
    if (status === null) return 'Testing...';
    if (status === true) return 'Passed';
    return 'Failed';
  };

  const getStatusColor = (status: boolean | null) => {
    if (status === null) return '#6b7280';
    if (status === true) return '#10b981';
    return '#ef4444';
  };

  const handleGetDiditApiKey = () => {
    Alert.alert(
      'Get Didit API Key',
      'To use real KYC verification:\n\n1. Visit https://didit.me\n2. Sign up for a free account\n3. Get your API key from the dashboard\n4. Update your .env file\n\nDidit provides real document scanning, OCR, and facial recognition - no simulation!',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Didit Website', onPress: () => {
          // In a real app, you would use Linking.openURL('https://didit.me')
          console.log('Would open https://didit.me');
        }}
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1e40af', '#3b82f6']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Shield size={32} color="white" />
          <Text style={styles.headerTitle}>Didit KYC Configuration</Text>
          <Text style={styles.headerSubtitle}>Real Document & Biometric Verification</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.configSection}>
          <Text style={styles.sectionTitle}>Configuration Status</Text>
          
          <View style={styles.configCard}>
            <Text style={styles.configLabel}>API Key:</Text>
            <View style={styles.configValue}>
              <Text style={styles.configText}>
                {apiKeyVisible 
                  ? DIDIT_API_KEY || 'Not configured' 
                  : (DIDIT_API_KEY && DIDIT_API_KEY !== 'your_didit_api_key_here' ? '••••••••••••' : 'Not configured')
                }
              </Text>
              <TouchableOpacity onPress={() => setApiKeyVisible(!apiKeyVisible)}>
                {apiKeyVisible ? <EyeOff size={16} color="#6b7280" /> : <Eye size={16} color="#6b7280" />}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.configCard}>
            <Text style={styles.configLabel}>API URL:</Text>
            <Text style={styles.configText}>{DIDIT_API_URL || 'Not configured'}</Text>
          </View>
        </View>

        <View style={styles.testSection}>
          <Text style={styles.sectionTitle}>Integration Tests</Text>

          <View style={styles.testCard}>
            <View style={styles.testHeader}>
              {getStatusIcon(testResults.configCheck)}
              <View style={styles.testInfo}>
                <Text style={styles.testName}>Configuration Check</Text>
                <Text style={styles.testDescription}>API key and URL validation</Text>
              </View>
              <Text style={[styles.testStatus, { color: getStatusColor(testResults.configCheck) }]}>
                {getStatusText(testResults.configCheck)}
              </Text>
            </View>
          </View>

          <View style={styles.testCard}>
            <View style={styles.testHeader}>
              {getStatusIcon(testResults.apiConnection)}
              <View style={styles.testInfo}>
                <Text style={styles.testName}>API Connection</Text>
                <Text style={styles.testDescription}>Network connectivity to Didit servers</Text>
              </View>
              <Text style={[styles.testStatus, { color: getStatusColor(testResults.apiConnection) }]}>
                {getStatusText(testResults.apiConnection)}
              </Text>
            </View>
          </View>

          <View style={styles.testCard}>
            <View style={styles.testHeader}>
              {getStatusIcon(testResults.sessionCreation)}
              <View style={styles.testInfo}>
                <Text style={styles.testName}>Session Creation</Text>
                <Text style={styles.testDescription}>KYC session initialization</Text>
              </View>
              <Text style={[styles.testStatus, { color: getStatusColor(testResults.sessionCreation) }]}>
                {getStatusText(testResults.sessionCreation)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>About Didit KYC</Text>
            <Text style={styles.infoText}>
              • Real document scanning and OCR{'\n'}
              • Facial recognition and liveness detection{'\n'}
              • Government ID verification{'\n'}
              • Anti-fraud and tamper detection{'\n'}
              • Real-time confidence scoring{'\n'}
              • No simulation - actual verification
            </Text>
          </View>

          {(!DIDIT_API_KEY || DIDIT_API_KEY === 'your_didit_api_key_here') && (
            <View style={styles.warningCard}>
              <AlertCircle size={20} color="#f59e0b" />
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>API Key Required</Text>
                <Text style={styles.warningText}>
                  Get a free Didit API key to enable real KYC verification
                </Text>
                <TouchableOpacity style={styles.warningButton} onPress={handleGetDiditApiKey}>
                  <Text style={styles.warningButtonText}>Get API Key</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={styles.retestButton} 
            onPress={runConfigurationTest}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Settings size={20} color="white" />
                <Text style={styles.retestButtonText}>Rerun Tests</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  configSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  configCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  configLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  configValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  configText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'monospace',
    flex: 1,
  },
  testSection: {
    marginTop: 24,
  },
  testCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testInfo: {
    flex: 1,
    marginLeft: 12,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  testDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
  testStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoSection: {
    marginTop: 24,
  },
  infoCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  warningContent: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#92400e',
    marginBottom: 12,
  },
  warningButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  warningButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  actionSection: {
    marginTop: 24,
    marginBottom: 32,
  },
  retestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
  },
  retestButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default DiditConfigTest;
