/**
 * Security Dashboard Component
 * Comprehensive security status and controls
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { securityService } from '../services/security';
import useAccessibility from '../hooks/useAccessibility';

interface SecurityDashboardProps {
  onSecurityAction?: (action: string, result: any) => void;
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  onSecurityAction,
}) => {
  const accessibility = useAccessibility();
  const [securityStatus, setSecurityStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSecurityStatus();
  }, []);

  const loadSecurityStatus = async () => {
    try {
      setLoading(true);
      const status = await securityService.getSecurityStatus();
      setSecurityStatus(status);
      onSecurityAction?.('status_loaded', status);
    } catch (error) {
      console.error('Failed to load security status:', error);
      await accessibility.hapticFeedback('error');
    } finally {
      setLoading(false);
    }
  };

  const refreshSecurityStatus = async () => {
    setRefreshing(true);
    await loadSecurityStatus();
    setRefreshing(false);
    await accessibility.hapticFeedback('light');
  };

  const runSecurityAssessment = async () => {
    try {
      await accessibility.hapticFeedback('light');
      const assessment = await securityService.assessDeviceSecurity();
      
      Alert.alert(
        'Security Assessment',
        `Security Level: ${assessment.securityLevel}\n` +
        `Device Trusted: ${assessment.isTrustedDevice ? 'Yes' : 'No'}\n` +
        `Jailbroken/Rooted: ${assessment.isJailbroken ? 'Yes' : 'No'}\n` +
        `Last Check: ${new Date().toLocaleString()}`,
        [{ text: 'OK', onPress: () => accessibility.hapticFeedback('success') }]
      );

      await loadSecurityStatus();
      onSecurityAction?.('assessment_completed', assessment);
    } catch (error) {
      Alert.alert('Error', 'Failed to run security assessment');
      await accessibility.hapticFeedback('error');
    }
  };

  const authenticateWithBiometrics = async () => {
    try {
      const result = await securityService.authenticateWithBiometrics();
      
      if (result.success) {
        Alert.alert('Success', 'Biometric authentication successful');
        await accessibility.hapticFeedback('success');
        onSecurityAction?.('biometric_success', result);
      } else {
        Alert.alert('Failed', result.error || 'Biometric authentication failed');
        await accessibility.hapticFeedback('error');
        onSecurityAction?.('biometric_failed', result);
      }
    } catch (error) {
      Alert.alert('Error', 'Biometric authentication error');
      await accessibility.hapticFeedback('error');
    }
  };

  const handleIncidentReport = async () => {
    try {
      await securityService.logSecurityIncident('MANUAL_SECURITY_CHECK', {
        timestamp: new Date().toISOString(),
        userInitiated: true,
        reason: 'Manual security dashboard check',
      });

      Alert.alert('Success', 'Security incident logged for review');
      await accessibility.hapticFeedback('success');
      onSecurityAction?.('incident_logged', { userInitiated: true });
    } catch (error) {
      Alert.alert('Error', 'Failed to log security incident');
      await accessibility.hapticFeedback('error');
    }
  };

  const handleSecureWipe = () => {
    Alert.alert(
      'Secure Data Wipe',
      'This will permanently delete all sensitive data. This action cannot be undone.\n\nAre you sure you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Wipe Data',
          style: 'destructive',
          onPress: async () => {
            try {
              await securityService.secureDataWipe();
              Alert.alert('Success', 'Sensitive data has been securely wiped');
              await accessibility.hapticFeedback('success');
              onSecurityAction?.('data_wiped', { success: true });
            } catch (error) {
              Alert.alert('Error', 'Failed to wipe data');
              await accessibility.hapticFeedback('error');
            }
          },
        },
      ]
    );
  };

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'MAXIMUM':
        return '#10B981'; // Green
      case 'HIGH':
        return '#059669'; // Dark Green
      case 'MEDIUM':
        return '#F59E0B'; // Yellow
      case 'LOW':
        return '#EF4444'; // Red
      default:
        return '#6B7280'; // Gray
    }
  };

  const getSecurityLevelIcon = (level: string) => {
    switch (level) {
      case 'MAXIMUM':
      case 'HIGH':
        return 'shield-checkmark';
      case 'MEDIUM':
        return 'shield-half';
      case 'LOW':
        return 'shield-outline';
      default:
        return 'shield';
    }
  };

  const SecurityCard = ({ 
    title, 
    value, 
    icon, 
    color, 
    onPress,
    description 
  }: {
    title: string;
    value: string;
    icon: string;
    color: string;
    onPress?: () => void;
    description?: string;
  }) => (
    <TouchableOpacity
      style={[styles.securityCard, { borderColor: color + '30' }]}
      onPress={onPress}
      disabled={!onPress}
      accessibilityLabel={`${title}: ${value}. ${description || ''}`}
    >
      <View style={styles.cardHeader}>
        <Ionicons name={icon as any} size={24} color={color} />
        <Text style={[styles.cardTitle, { 
          fontSize: 14 * accessibility.fontSizeMultiplier,
          color: accessibility.theme.text 
        }]}>
          {title}
        </Text>
      </View>
      <Text style={[styles.cardValue, { 
        fontSize: 18 * accessibility.fontSizeMultiplier,
        color: color 
      }]}>
        {value}
      </Text>
      {description && (
        <Text style={[styles.cardDescription, { 
          fontSize: 12 * accessibility.fontSizeMultiplier,
          color: accessibility.theme.textSecondary 
        }]}>
          {description}
        </Text>
      )}
    </TouchableOpacity>
  );

  const ActionButton = ({ 
    title, 
    icon, 
    onPress, 
    variant = 'primary',
    description 
  }: {
    title: string;
    icon: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
    description?: string;
  }) => {
    const getButtonColor = () => {
      switch (variant) {
        case 'primary':
          return accessibility.theme.primary;
        case 'secondary':
          return accessibility.theme.textSecondary;
        case 'danger':
          return accessibility.theme.error;
        default:
          return accessibility.theme.primary;
      }
    };

    return (
      <TouchableOpacity
        style={[styles.actionButton, { 
          backgroundColor: getButtonColor(),
          borderColor: getButtonColor() 
        }]}
        onPress={onPress}
        accessibilityLabel={`${title}. ${description || ''}`}
      >
        <Ionicons name={icon as any} size={20} color="#FFFFFF" />
        <Text style={[styles.actionButtonText, { 
          fontSize: 16 * accessibility.fontSizeMultiplier 
        }]}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={[styles.loadingText, { 
          fontSize: 16 * accessibility.fontSizeMultiplier,
          color: accessibility.theme.textSecondary 
        }]}>
          Loading security status...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: accessibility.theme.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refreshSecurityStatus} />
      }
    >
      {/* Header */}
      <LinearGradient
        colors={[accessibility.theme.primary, accessibility.theme.primary + '80']}
        style={styles.header}
      >
        <Text style={[styles.headerTitle, { fontSize: 24 * accessibility.fontSizeMultiplier }]}>
          Security Dashboard
        </Text>
        <Text style={[styles.headerSubtitle, { fontSize: 16 * accessibility.fontSizeMultiplier }]}>
          Monitor and manage your security
        </Text>
      </LinearGradient>

      {/* Security Status Cards */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { 
          fontSize: 18 * accessibility.fontSizeMultiplier,
          color: accessibility.theme.text 
        }]}>
          Security Status
        </Text>
        
        <View style={styles.cardsGrid}>
          {securityStatus && (
            <>
              <SecurityCard
                title="Overall Security"
                value={securityStatus.overallSecurityLevel || 'Unknown'}
                icon={getSecurityLevelIcon(securityStatus.overallSecurityLevel)}
                color={getSecurityLevelColor(securityStatus.overallSecurityLevel)}
                description="Current security rating"
                onPress={runSecurityAssessment}
              />
              
              <SecurityCard
                title="Device Trust"
                value={securityStatus.deviceTrust?.isValid ? 'Trusted' : 'Not Trusted'}
                icon={securityStatus.deviceTrust?.isValid ? 'checkmark-circle' : 'close-circle'}
                color={securityStatus.deviceTrust?.isValid ? '#10B981' : '#EF4444'}
                description="Device verification status"
              />
              
              <SecurityCard
                title="Session Status"
                value={securityStatus.sessionSecurity?.isActive ? 'Active' : 'Inactive'}
                icon={securityStatus.sessionSecurity?.isActive ? 'time' : 'time-outline'}
                color={securityStatus.sessionSecurity?.isActive ? '#10B981' : '#F59E0B'}
                description="Current session security"
              />
              
              <SecurityCard
                title="Rate Limiting"
                value={securityStatus.rateLimiting?.isActive ? 'Protected' : 'Inactive'}
                icon={securityStatus.rateLimiting?.isActive ? 'shield-checkmark' : 'shield-outline'}
                color={securityStatus.rateLimiting?.isActive ? '#10B981' : '#F59E0B'}
                description="API protection status"
              />
            </>
          )}
        </View>
      </View>

      {/* Security Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { 
          fontSize: 18 * accessibility.fontSizeMultiplier,
          color: accessibility.theme.text 
        }]}>
          Security Actions
        </Text>
        
        <View style={styles.actionsGrid}>
          <ActionButton
            title="Security Check"
            icon="scan"
            onPress={runSecurityAssessment}
            description="Run comprehensive security assessment"
          />
          
          <ActionButton
            title="Biometric Auth"
            icon="finger-print"
            onPress={authenticateWithBiometrics}
            description="Authenticate using biometrics"
          />
          
          <ActionButton
            title="Report Incident"
            icon="warning"
            onPress={handleIncidentReport}
            variant="secondary"
            description="Log a security incident"
          />
          
          <ActionButton
            title="Secure Wipe"
            icon="trash"
            onPress={handleSecureWipe}
            variant="danger"
            description="Securely delete sensitive data"
          />
        </View>
      </View>

      {/* Security Timeline */}
      {securityStatus?.recentActivity && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { 
            fontSize: 18 * accessibility.fontSizeMultiplier,
            color: accessibility.theme.text 
          }]}>
            Recent Security Activity
          </Text>
          
          {securityStatus.recentActivity.map((activity: any, index: number) => (
            <View key={index} style={[styles.timelineItem, { borderColor: accessibility.theme.border }]}>
              <Text style={[styles.timelineTitle, { 
                fontSize: 14 * accessibility.fontSizeMultiplier,
                color: accessibility.theme.text 
              }]}>
                {activity.action}
              </Text>
              <Text style={[styles.timelineTime, { 
                fontSize: 12 * accessibility.fontSizeMultiplier,
                color: accessibility.theme.textSecondary 
              }]}>
                {new Date(activity.timestamp).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    textAlign: 'center',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    marginBottom: 20,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 16,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  securityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: (width - 52) / 2,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    marginLeft: 8,
    fontWeight: '500',
  },
  cardValue: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDescription: {
    opacity: 0.7,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E40AF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    width: (width - 52) / 2,
    borderWidth: 1,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  timelineItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderLeftWidth: 3,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  timelineTitle: {
    fontWeight: '500',
    marginBottom: 4,
  },
  timelineTime: {
    opacity: 0.7,
  },
});

export default SecurityDashboard;
