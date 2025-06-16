/**
 * Admin Dashboard
 * Administrative interface with security monitoring and system management
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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  Shield,
  Users,
  Activity,
  Settings,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Server,
  Database,
  Lock,
  Eye,
} from 'lucide-react-native';
import useAccessibility from '../../hooks/useAccessibility';
import { securityService } from '../../services/security';
import AdminSecurityPanel from '../../components/AdminSecurityPanel';
import SecurityDashboard from '../../components/SecurityDashboard';

export default function AdminScreen() {
  const accessibility = useAccessibility();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSecurityPanel, setShowSecurityPanel] = useState(false);
  const [showSecurityDashboard, setShowSecurityDashboard] = useState(false);
  
  // Admin data
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalAssets: 0,
    totalTransactions: 0,
    systemHealth: 'good',
    securityLevel: 'HIGH',
    criticalAlerts: 0,
    pendingActions: 0,
  });

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<any>(null);

  useEffect(() => {
    loadAdminData();
    accessibility.announceForAccessibility('Admin dashboard loaded');
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      // Load admin dashboard data
      const [securityStatus, metrics] = await Promise.all([
        securityService.getSecurityStatus(),
        loadSystemMetrics(),
      ]);

      // Update admin stats with real data
      setAdminStats(prev => ({
        ...prev,
        securityLevel: securityStatus.overallSecurityLevel,
        criticalAlerts: securityStatus.criticalIssues?.length || 0,
        systemHealth: securityStatus.systemHealth || 'good',
      }));

      setSystemMetrics(metrics);
      
      // Load recent activity
      const activity = await loadRecentActivity();
      setRecentActivity(activity);

    } catch (error) {
      console.error('Failed to load admin data:', error);
      Alert.alert('Error', 'Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadSystemMetrics = async () => {
    // Mock system metrics - replace with actual API calls
    return {
      cpuUsage: Math.floor(Math.random() * 100),
      memoryUsage: Math.floor(Math.random() * 100),
      diskUsage: Math.floor(Math.random() * 100),
      networkLatency: Math.floor(Math.random() * 100) + 50,
      uptime: '99.9%',
      lastBackup: new Date(Date.now() - 86400000).toISOString(),
    };
  };

  const loadRecentActivity = async () => {
    // Mock recent activity - replace with actual API calls
    return [
      {
        id: '1',
        type: 'user_registration',
        message: 'New user registered: john.doe@example.com',
        timestamp: Date.now() - 300000,
        severity: 'info',
      },
      {
        id: '2',
        type: 'security_alert',
        message: 'Multiple failed login attempts detected',
        timestamp: Date.now() - 600000,
        severity: 'warning',
      },
      {
        id: '3',
        type: 'system_update',
        message: 'Security patches applied successfully',
        timestamp: Date.now() - 1800000,
        severity: 'success',
      },
      {
        id: '4',
        type: 'transaction',
        message: 'Large transaction flagged for review: $50,000',
        timestamp: Date.now() - 3600000,
        severity: 'warning',
      },
    ];
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAdminData();
    setRefreshing(false);
    await accessibility.hapticFeedback('light');
  };

  const handleAdminAction = async (action: string) => {
    try {
      await accessibility.hapticFeedback('light');
      
      switch (action) {
        case 'security_panel':
          setShowSecurityPanel(true);
          break;
        case 'security_dashboard':
          setShowSecurityDashboard(true);
          break;
        case 'system_backup':
          Alert.alert('System Backup', 'Initiating system backup...');
          break;
        case 'security_scan':
          Alert.alert('Security Scan', 'Starting comprehensive security scan...');
          break;
        case 'user_management':
          Alert.alert('User Management', 'User management interface coming soon...');
          break;
        case 'system_settings':
          Alert.alert('System Settings', 'System configuration interface coming soon...');
          break;
        default:
          Alert.alert('Coming Soon', 'This feature will be available soon');
      }
    } catch (error) {
      Alert.alert('Error', 'Admin action failed');
      await accessibility.hapticFeedback('error');
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return '#10B981';
      case 'good': return '#059669';
      case 'fair': return '#F59E0B';
      case 'poor': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'success': return '#10B981';
      case 'info': return '#3B82F6';
      case 'warning': return '#F59E0B';
      case 'error': return '#EF4444';
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

  const StatCard = ({
    title,
    value,
    icon,
    color,
    subtitle,
    onPress,
  }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    subtitle?: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={[
        styles.statCard,
        { backgroundColor: accessibility.theme.surface }
      ]}
      onPress={onPress}
      disabled={!onPress}
      accessibilityLabel={`${title}: ${value}`}
    >
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
          <icon color={color} size={20} />
        </View>
      </View>
      <Text
        style={[
          styles.statValue,
          {
            color: accessibility.theme.text,
            fontSize: 20 * accessibility.fontSizeMultiplier
          }
        ]}
      >
        {value}
      </Text>
      <Text
        style={[
          styles.statTitle,
          {
            color: accessibility.theme.textSecondary,
            fontSize: 12 * accessibility.fontSizeMultiplier
          }
        ]}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={[
            styles.statSubtitle,
            {
              color: accessibility.theme.textSecondary,
              fontSize: 10 * accessibility.fontSizeMultiplier
            }
          ]}
        >
          {subtitle}
        </Text>
      )}
    </TouchableOpacity>
  );

  const ActionButton = ({
    icon,
    title,
    description,
    onPress,
    color = accessibility.theme.primary,
    urgent = false,
  }: {
    icon: any;
    title: string;
    description: string;
    onPress: () => void;
    color?: string;
    urgent?: boolean;
  }) => (
    <TouchableOpacity
      style={[
        styles.actionButton,
        {
          backgroundColor: accessibility.theme.surface,
          borderColor: urgent ? '#EF4444' : accessibility.theme.border,
          borderWidth: urgent ? 2 : 1,
        }
      ]}
      onPress={onPress}
      accessibilityLabel={title}
    >
      <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
        <icon color={urgent ? '#EF4444' : color} size={24} />
      </View>
      <View style={styles.actionContent}>
        <Text
          style={[
            styles.actionTitle,
            {
              color: accessibility.theme.text,
              fontSize: 16 * accessibility.fontSizeMultiplier
            }
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            styles.actionDescription,
            {
              color: accessibility.theme.textSecondary,
              fontSize: 12 * accessibility.fontSizeMultiplier
            }
          ]}
        >
          {description}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={accessibility.theme.textSecondary}
      />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: accessibility.theme.background }]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="settings" size={48} color={accessibility.theme.primary} />
          <Text
            style={[
              styles.loadingText,
              {
                color: accessibility.theme.text,
                fontSize: 16 * accessibility.fontSizeMultiplier
              }
            ]}
          >
            Loading Admin Dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: accessibility.theme.background }]}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={[accessibility.theme.primary, accessibility.theme.primary + '90']}
          style={styles.header}
        >
          <Text style={[styles.headerTitle, { fontSize: 24 * accessibility.fontSizeMultiplier }]}>
            Admin Dashboard
          </Text>
          <Text style={[styles.headerSubtitle, { fontSize: 14 * accessibility.fontSizeMultiplier }]}>
            System Overview & Management
          </Text>
          
          {/* System Health Indicator */}
          <View style={styles.healthIndicator}>
            <View
              style={[
                styles.healthDot,
                { backgroundColor: getHealthColor(adminStats.systemHealth) }
              ]}
            />
            <Text style={[styles.healthText, { fontSize: 12 * accessibility.fontSizeMultiplier }]}>
              System Health: {adminStats.systemHealth.toUpperCase()}
            </Text>
          </View>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.section}>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Users"
              value={adminStats.totalUsers.toLocaleString()}
              icon={Users}
              color="#3B82F6"
              subtitle="Active: 1,847"
            />
            <StatCard
              title="Security Level"
              value={adminStats.securityLevel}
              icon={Shield}
              color={adminStats.securityLevel === 'HIGH' ? '#10B981' : '#F59E0B'}
              subtitle="All systems secure"
              onPress={() => handleAdminAction('security_dashboard')}
            />
            <StatCard
              title="Critical Alerts"
              value={adminStats.criticalAlerts}
              icon={AlertTriangle}
              color={adminStats.criticalAlerts > 0 ? '#EF4444' : '#10B981'}
              subtitle={adminStats.criticalAlerts > 0 ? 'Requires attention' : 'No issues'}
              onPress={() => handleAdminAction('security_panel')}
            />
            <StatCard
              title="System Uptime"
              value={systemMetrics?.uptime || '99.9%'}
              icon={Activity}
              color="#10B981"
              subtitle="Last 30 days"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: accessibility.theme.text,
                fontSize: 18 * accessibility.fontSizeMultiplier
              }
            ]}
          >
            Quick Actions
          </Text>
          
          <ActionButton
            icon={Shield}
            title="Security Panel"
            description="Monitor threats, manage rules, and view security events"
            onPress={() => handleAdminAction('security_panel')}
            color="#EF4444"
            urgent={adminStats.criticalAlerts > 0}
          />
          
          <ActionButton
            icon={BarChart3}
            title="Security Dashboard"
            description="View comprehensive security metrics and analytics"
            onPress={() => handleAdminAction('security_dashboard')}
            color="#3B82F6"
          />
          
          <ActionButton
            icon={Users}
            title="User Management"
            description="Manage user accounts, permissions, and access control"
            onPress={() => handleAdminAction('user_management')}
            color="#10B981"
          />
          
          <ActionButton
            icon={Database}
            title="System Backup"
            description="Initiate backup processes and manage data recovery"
            onPress={() => handleAdminAction('system_backup')}
            color="#F59E0B"
          />
          
          <ActionButton
            icon={Settings}
            title="System Settings"
            description="Configure system parameters and administrative options"
            onPress={() => handleAdminAction('system_settings')}
            color="#6B7280"
          />
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: accessibility.theme.text,
                fontSize: 18 * accessibility.fontSizeMultiplier
              }
            ]}
          >
            Recent Activity
          </Text>
          <View style={[styles.activityContainer, { backgroundColor: accessibility.theme.surface }]}>
            {recentActivity.map(activity => (
              <View key={activity.id} style={styles.activityItem}>
                <View
                  style={[
                    styles.activityIndicator,
                    { backgroundColor: getSeverityColor(activity.severity) }
                  ]}
                />
                <View style={styles.activityContent}>
                  <Text
                    style={[
                      styles.activityMessage,
                      {
                        color: accessibility.theme.text,
                        fontSize: 14 * accessibility.fontSizeMultiplier
                      }
                    ]}
                  >
                    {activity.message}
                  </Text>
                  <Text
                    style={[
                      styles.activityTime,
                      {
                        color: accessibility.theme.textSecondary,
                        fontSize: 12 * accessibility.fontSizeMultiplier
                      }
                    ]}
                  >
                    {formatTimestamp(activity.timestamp)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* System Metrics */}
        {systemMetrics && (
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: accessibility.theme.text,
                  fontSize: 18 * accessibility.fontSizeMultiplier
                }
              ]}
            >
              System Metrics
            </Text>
            <View style={styles.metricsGrid}>
              <View style={[styles.metricCard, { backgroundColor: accessibility.theme.surface }]}>
                <Text
                  style={[
                    styles.metricLabel,
                    {
                      color: accessibility.theme.textSecondary,
                      fontSize: 12 * accessibility.fontSizeMultiplier
                    }
                  ]}
                >
                  CPU Usage
                </Text>
                <Text
                  style={[
                    styles.metricValue,
                    {
                      color: accessibility.theme.text,
                      fontSize: 18 * accessibility.fontSizeMultiplier
                    }
                  ]}
                >
                  {systemMetrics.cpuUsage}%
                </Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: accessibility.theme.surface }]}>
                <Text
                  style={[
                    styles.metricLabel,
                    {
                      color: accessibility.theme.textSecondary,
                      fontSize: 12 * accessibility.fontSizeMultiplier
                    }
                  ]}
                >
                  Memory Usage
                </Text>
                <Text
                  style={[
                    styles.metricValue,
                    {
                      color: accessibility.theme.text,
                      fontSize: 18 * accessibility.fontSizeMultiplier
                    }
                  ]}
                >
                  {systemMetrics.memoryUsage}%
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Security Panel Modal */}
      <AdminSecurityPanel
        isVisible={showSecurityPanel}
        onClose={() => setShowSecurityPanel(false)}
      />

      {/* Security Dashboard Modal */}
      {showSecurityDashboard && (
        <SecurityDashboard
          onSecurityAction={(action, result) => {
            console.log('Security action:', action, result);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontFamily: 'Inter-Medium',
    marginTop: 16,
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
  },
  healthIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  healthText: {
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statHeader: {
    marginBottom: 12,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  statTitle: {
    fontFamily: 'Inter-Medium',
    marginBottom: 2,
  },
  statSubtitle: {
    fontFamily: 'Inter-Regular',
    opacity: 0.7,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  actionDescription: {
    fontFamily: 'Inter-Regular',
  },
  activityContainer: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    fontFamily: 'Inter-Medium',
    marginBottom: 4,
  },
  activityTime: {
    fontFamily: 'Inter-Regular',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  metricLabel: {
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  metricValue: {
    fontFamily: 'Inter-Bold',
  },
});