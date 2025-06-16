/**
 * Admin Security Panel
 * Advanced security monitoring and management for administrators
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Switch,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import useAccessibility from '../hooks/useAccessibility';
import { securityService } from '../services/security';

interface AdminSecurityPanelProps {
  onClose?: () => void;
  isVisible?: boolean;
}

interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'failed_login' | 'security_check' | 'data_access' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  userId?: string;
  deviceId?: string;
  ipAddress?: string;
  location?: string;
}

interface SecurityRule {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
  type: 'rate_limit' | 'device_trust' | 'geo_fence' | 'behavior_analysis';
  config: any;
}

export const AdminSecurityPanel: React.FC<AdminSecurityPanelProps> = ({
  onClose,
  isVisible = true,
}) => {
  const accessibility = useAccessibility();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'rules' | 'analysis'>('overview');
  
  // Security data
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [securityRules, setSecurityRules] = useState<SecurityRule[]>([]);
  const [threatLevel, setThreatLevel] = useState<'low' | 'medium' | 'high' | 'critical'>('low');
  const [activeThreats, setActiveThreats] = useState<any[]>([]);
  
  // UI state
  const [showEventDetails, setShowEventDetails] = useState<SecurityEvent | null>(null);
  const [showRuleEditor, setShowRuleEditor] = useState<SecurityRule | null>(null);

  useEffect(() => {
    if (isVisible) {
      loadSecurityData();
    }
  }, [isVisible]);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      
      // Load comprehensive security data
      const [status, events, rules] = await Promise.all([
        securityService.getSecurityStatus(),
        loadSecurityEvents(),
        loadSecurityRules(),
      ]);

      setSystemStatus(status);
      setSecurityEvents(events);
      setSecurityRules(rules);
      
      // Calculate threat level based on events
      calculateThreatLevel(events);
      
      await accessibility.announceForAccessibility('Admin security panel loaded');
    } catch (error) {
      console.error('Failed to load security data:', error);
      Alert.alert('Error', 'Failed to load security data');
    } finally {
      setLoading(false);
    }
  };

  const loadSecurityEvents = async (): Promise<SecurityEvent[]> => {
    // Mock security events - replace with actual API call
    return [
      {
        id: '1',
        type: 'failed_login',
        severity: 'medium',
        message: 'Multiple failed login attempts from IP 192.168.1.100',
        timestamp: Date.now() - 300000,
        ipAddress: '192.168.1.100',
        location: 'New York, US'
      },
      {
        id: '2',
        type: 'security_check',
        severity: 'low',
        message: 'Automated security scan completed successfully',
        timestamp: Date.now() - 1800000,
      },
      {
        id: '3',
        type: 'suspicious_activity',
        severity: 'high',
        message: 'Unusual transaction pattern detected for user ID 12345',
        timestamp: Date.now() - 3600000,
        userId: '12345'
      }
    ];
  };

  const loadSecurityRules = async (): Promise<SecurityRule[]> => {
    // Mock security rules - replace with actual API call
    return [
      {
        id: '1',
        name: 'Rate Limiting',
        enabled: true,
        description: 'Limit login attempts to 5 per 15 minutes',
        type: 'rate_limit',
        config: { maxAttempts: 5, windowMs: 900000 }
      },
      {
        id: '2',
        name: 'Device Trust Verification',
        enabled: true,
        description: 'Require device verification for new devices',
        type: 'device_trust',
        config: { requireVerification: true }
      },
      {
        id: '3',
        name: 'Geographic Restrictions',
        enabled: false,
        description: 'Block access from high-risk countries',
        type: 'geo_fence',
        config: { blockedCountries: ['XX', 'YY'] }
      }
    ];
  };

  const calculateThreatLevel = (events: SecurityEvent[]) => {
    const recentEvents = events.filter(event => 
      Date.now() - event.timestamp < 3600000 // Last hour
    );

    const criticalCount = recentEvents.filter(e => e.severity === 'critical').length;
    const highCount = recentEvents.filter(e => e.severity === 'high').length;
    const mediumCount = recentEvents.filter(e => e.severity === 'medium').length;

    if (criticalCount > 0) {
      setThreatLevel('critical');
    } else if (highCount > 2) {
      setThreatLevel('high');
    } else if (highCount > 0 || mediumCount > 5) {
      setThreatLevel('medium');
    } else {
      setThreatLevel('low');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSecurityData();
    setRefreshing(false);
    await accessibility.hapticFeedback('light');
  };

  const handleRuleToggle = async (ruleId: string, enabled: boolean) => {
    try {
      const updatedRules = securityRules.map(rule =>
        rule.id === ruleId ? { ...rule, enabled } : rule
      );
      setSecurityRules(updatedRules);
      await accessibility.hapticFeedback('light');
      // TODO: Update rule on server
    } catch (error) {
      console.error('Failed to update rule:', error);
      await accessibility.hapticFeedback('error');
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return '#DC2626';
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#DC2626';
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const renderOverview = () => (
    <View>
      {/* Threat Level Card */}
      <LinearGradient
        colors={[getThreatLevelColor(threatLevel), getThreatLevelColor(threatLevel) + '90']}
        style={styles.threatCard}
      >
        <View style={styles.threatContent}>
          <Ionicons
            name={threatLevel === 'critical' ? 'warning' : 'shield-checkmark'}
            size={32}
            color="#FFFFFF"
          />
          <Text style={[styles.threatLevel, { fontSize: 20 * accessibility.fontSizeMultiplier }]}>
            Threat Level: {threatLevel.toUpperCase()}
          </Text>
          <Text style={[styles.threatDescription, { fontSize: 14 * accessibility.fontSizeMultiplier }]}>
            {threatLevel === 'low' && 'All systems secure'}
            {threatLevel === 'medium' && 'Some security concerns detected'}
            {threatLevel === 'high' && 'Multiple security issues identified'}
            {threatLevel === 'critical' && 'Immediate attention required'}
          </Text>
        </View>
      </LinearGradient>

      {/* System Status */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontSize: 18 * accessibility.fontSizeMultiplier }]}>
          System Status
        </Text>
        <View style={styles.statusGrid}>
          <View style={[styles.statusCard, { backgroundColor: accessibility.theme.surface }]}>
            <Ionicons name="shield-checkmark" size={24} color="#10B981" />
            <Text style={[styles.statusValue, { fontSize: 16 * accessibility.fontSizeMultiplier }]}>
              {systemStatus?.overallSecurityLevel || 'HIGH'}
            </Text>
            <Text style={[styles.statusLabel, { fontSize: 12 * accessibility.fontSizeMultiplier }]}>
              Security Level
            </Text>
          </View>
          <View style={[styles.statusCard, { backgroundColor: accessibility.theme.surface }]}>
            <Ionicons name="people" size={24} color="#3B82F6" />
            <Text style={[styles.statusValue, { fontSize: 16 * accessibility.fontSizeMultiplier }]}>
              {systemStatus?.activeUsers || '1,234'}
            </Text>
            <Text style={[styles.statusLabel, { fontSize: 12 * accessibility.fontSizeMultiplier }]}>
              Active Users
            </Text>
          </View>
          <View style={[styles.statusCard, { backgroundColor: accessibility.theme.surface }]}>
            <Ionicons name="alert-circle" size={24} color="#F59E0B" />
            <Text style={[styles.statusValue, { fontSize: 16 * accessibility.fontSizeMultiplier }]}>
              {securityEvents.filter(e => e.severity === 'high' || e.severity === 'critical').length}
            </Text>
            <Text style={[styles.statusLabel, { fontSize: 12 * accessibility.fontSizeMultiplier }]}>
              Critical Alerts
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderEvents = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { fontSize: 18 * accessibility.fontSizeMultiplier }]}>
        Security Events
      </Text>
      <ScrollView style={styles.eventsList}>
        {securityEvents.map(event => (
          <TouchableOpacity
            key={event.id}
            style={[styles.eventItem, { backgroundColor: accessibility.theme.surface }]}
            onPress={() => setShowEventDetails(event)}
          >
            <View style={styles.eventHeader}>
              <View style={[styles.severityIndicator, { backgroundColor: getSeverityColor(event.severity) }]} />
              <Text style={[styles.eventType, { fontSize: 14 * accessibility.fontSizeMultiplier }]}>
                {event.type.replace('_', ' ').toUpperCase()}
              </Text>
              <Text style={[styles.eventTime, { fontSize: 12 * accessibility.fontSizeMultiplier }]}>
                {formatTimestamp(event.timestamp)}
              </Text>
            </View>
            <Text style={[styles.eventMessage, { fontSize: 14 * accessibility.fontSizeMultiplier }]}>
              {event.message}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderRules = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { fontSize: 18 * accessibility.fontSizeMultiplier }]}>
        Security Rules
      </Text>
      {securityRules.map(rule => (
        <View key={rule.id} style={[styles.ruleItem, { backgroundColor: accessibility.theme.surface }]}>
          <View style={styles.ruleHeader}>
            <Text style={[styles.ruleName, { fontSize: 16 * accessibility.fontSizeMultiplier }]}>
              {rule.name}
            </Text>
            <Switch
              value={rule.enabled}
              onValueChange={(value) => handleRuleToggle(rule.id, value)}
              trackColor={{ false: '#E5E7EB', true: accessibility.theme.primary }}
            />
          </View>
          <Text style={[styles.ruleDescription, { fontSize: 14 * accessibility.fontSizeMultiplier }]}>
            {rule.description}
          </Text>
        </View>
      ))}
    </View>
  );

  if (!isVisible) return null;

  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.container, { backgroundColor: accessibility.theme.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { fontSize: 20 * accessibility.fontSizeMultiplier }]}>
            Admin Security Panel
          </Text>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={accessibility.theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {[
            { key: 'overview', label: 'Overview', icon: 'analytics' },
            { key: 'events', label: 'Events', icon: 'list' },
            { key: 'rules', label: 'Rules', icon: 'settings' },
            { key: 'analysis', label: 'Analysis', icon: 'bar-chart' },
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                activeTab === tab.key && { backgroundColor: accessibility.theme.primary + '20' }
              ]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Ionicons
                name={tab.icon as any}
                size={20}
                color={activeTab === tab.key ? accessibility.theme.primary : accessibility.theme.textSecondary}
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    fontSize: 12 * accessibility.fontSizeMultiplier,
                    color: activeTab === tab.key ? accessibility.theme.primary : accessibility.theme.textSecondary
                  }
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          style={styles.content}
        >
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'events' && renderEvents()}
          {activeTab === 'rules' && renderRules()}
          {activeTab === 'analysis' && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { fontSize: 18 * accessibility.fontSizeMultiplier }]}>
                Security Analysis
              </Text>
              <Text style={[styles.comingSoon, { fontSize: 16 * accessibility.fontSizeMultiplier }]}>
                Advanced security analytics coming soon...
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  tabLabel: {
    fontFamily: 'Inter-Medium',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  threatCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  threatContent: {
    alignItems: 'center',
  },
  threatLevel: {
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  threatDescription: {
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusValue: {
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginTop: 8,
  },
  statusLabel: {
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  eventsList: {
    maxHeight: 400,
  },
  eventItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  eventType: {
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    flex: 1,
  },
  eventTime: {
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  eventMessage: {
    fontFamily: 'Inter-Regular',
    color: '#374151',
  },
  ruleItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ruleName: {
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    flex: 1,
  },
  ruleDescription: {
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  comingSoon: {
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 40,
  },
});

export default AdminSecurityPanel;
