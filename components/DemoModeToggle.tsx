import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  TestTube, 
  Database, 
  Users, 
  ArrowRight,
  Info,
  Shield,
  Zap
} from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';

interface DemoModeToggleProps {
  visible: boolean;
  onClose: () => void;
}

export const DemoModeToggle: React.FC<DemoModeToggleProps> = ({ visible, onClose }) => {
  const { isDemoMode, signOut, signInWithDemoAccount, demoAccount } = useAuth();

  const handleToggleMode = async () => {
    if (isDemoMode) {
      // Switch to real mode
      Alert.alert(
        'Switch to Real Mode',
        'This will sign you out of the demo account. You can sign in with your real account or create a new one.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Switch to Real Mode',
            onPress: async () => {
              await signOut();
              onClose();
            }
          }
        ]
      );
    } else {
      // Switch to demo mode
      Alert.alert(
        'Switch to Demo Mode',
        'This will sign you out of your current account and let you explore with demo data.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enter Demo Mode',
            onPress: async () => {
              await signOut();
              // Default to investor demo account
              await signInWithDemoAccount('investor');
              onClose();
            }
          }
        ]
      );
    }
  };

  const handleSwitchDemoAccount = () => {
    Alert.alert(
      'Switch Demo Account',
      'Choose a different demo account role to explore different features:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Admin', onPress: () => signInWithDemoAccount('admin') },
        { text: 'Asset Issuer', onPress: () => signInWithDemoAccount('issuer') },
        { text: 'Investor', onPress: () => signInWithDemoAccount('investor') },
        { text: 'Compliance', onPress: () => signInWithDemoAccount('compliance') },
        { text: 'Support', onPress: () => signInWithDemoAccount('support') },
      ]
    );
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <LinearGradient
          colors={isDemoMode ? ['#F59E0B', '#F97316'] : ['#1E40AF', '#3B82F6']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.iconContainer}>
              {isDemoMode ? (
                <TestTube color="#FFFFFF" size={24} />
              ) : (
                <Database color="#FFFFFF" size={24} />
              )}
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>
                {isDemoMode ? 'Demo Mode Active' : 'Real Data Mode'}
              </Text>
              <Text style={styles.subtitle}>
                {isDemoMode 
                  ? 'Exploring with sample data and features'
                  : 'Using real blockchain and user data'
                }
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {isDemoMode && (
            <View style={styles.demoInfo}>
              <View style={styles.currentAccount}>
                <Users color="#F59E0B" size={20} />
                <View style={styles.accountInfo}>
                  <Text style={styles.accountRole}>
                    Current Demo Role: {demoAccount?.role?.toUpperCase()}
                  </Text>
                  <Text style={styles.accountEmail}>
                    {demoAccount?.email}
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.switchButton}
                onPress={handleSwitchDemoAccount}
              >
                <Text style={styles.switchButtonText}>Switch Demo Account</Text>
                <ArrowRight color="#F59E0B" size={16} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.features}>
            <Text style={styles.featuresTitle}>
              {isDemoMode ? 'Demo Features Available:' : 'Real Features Available:'}
            </Text>
            
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Shield color={isDemoMode ? '#F59E0B' : '#10B981'} size={16} />
                <Text style={styles.featureText}>
                  {isDemoMode ? 'Pre-approved KYC status' : 'Real KYC verification'}
                </Text>
              </View>
              
              <View style={styles.featureItem}>
                <Database color={isDemoMode ? '#F59E0B' : '#10B981'} size={16} />
                <Text style={styles.featureText}>
                  {isDemoMode ? 'Sample portfolio & assets' : 'Your real portfolio & assets'}
                </Text>
              </View>
              
              <View style={styles.featureItem}>
                <Zap color={isDemoMode ? '#F59E0B' : '#10B981'} size={16} />
                <Text style={styles.featureText}>
                  {isDemoMode ? 'Simulated transactions' : 'Real blockchain transactions'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Info color="#6B7280" size={20} />
            <Text style={styles.infoText}>
              {isDemoMode 
                ? 'Demo mode lets you explore all features safely with sample data. No real transactions are made.'
                : 'Real mode connects to live blockchain networks and processes actual transactions.'
              }
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Close</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toggleButton} onPress={handleToggleMode}>
            <Text style={styles.toggleButtonText}>
              {isDemoMode ? 'Switch to Real Mode' : 'Enter Demo Mode'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    padding: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  content: {
    padding: 20,
  },
  demoInfo: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  currentAccount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  accountInfo: {
    flex: 1,
    marginLeft: 12,
  },
  accountRole: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#92400E',
    marginBottom: 2,
  },
  accountEmail: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#A16207',
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  switchButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#F59E0B',
    marginRight: 8,
  },
  features: {
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 12,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 12,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  toggleButton: {
    flex: 2,
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toggleButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});