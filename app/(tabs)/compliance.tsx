import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Shield,
  AlertTriangle,
  FileText,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Settings,
  Bell,
} from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { complianceService } from '../../services/complianceService';
import { ComplianceDashboard } from '../../components/ComplianceDashboard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function ComplianceScreen() {
  const { user, profile, isDemoMode, demoAccount } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedView, setSelectedView] = useState<'dashboard' | 'kyc' | 'aml' | 'tax' | 'alerts'>('dashboard');

  useEffect(() => {
    loadComplianceData();
  }, [user, isDemoMode]);

  const loadComplianceData = async () => {
    try {
      setLoading(true);
      
      if (isDemoMode && demoAccount) {
        // Demo compliance data
        setDashboardData({
          kycStatus: {
            status: demoAccount.profile.kycStatus,
            risk_score: 15,
            reviewed_at: new Date().toISOString(),
          },
          amlChecks: [
            {
              id: '1',
              check_type: 'sanctions',
              result: 'clear',
              confidence_score: 0.98,
              checked_at: new Date().toISOString(),
            },
            {
              id: '2',
              check_type: 'pep',
              result: 'clear',
              confidence_score: 0.95,
              checked_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ],
          activeAlerts: [],
          upcomingFilings: [
            {
              id: 'filing_1',
              filing_type: 'Form 8949',
              jurisdiction: 'US',
              status: 'draft',
              deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ],
          riskScore: 15,
          complianceMetrics: {
            kycCompletionRate: 95,
            amlPassRate: 98,
            activeInvestigations: 0,
            pendingReviews: 2,
          },
        });
      } else if (user) {
        const data = await complianceService.getComplianceDashboard(user.id);
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error loading compliance data:', error);
      Alert.alert('Error', 'Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadComplianceData();
    setRefreshing(false);
  };

  const handleRunAMLCheck = async () => {
    if (!user) return;
    
    try {
      Alert.alert(
        'AML Screening',
        'This will perform a comprehensive AML check including sanctions, PEP, and adverse media screening.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Run Check',
            onPress: async () => {
              try {
                await complianceService.performAMLCheck(user.id, 'sanctions');
                Alert.alert('Success', 'AML check completed successfully');
                loadComplianceData();
              } catch (error) {
                Alert.alert('Error', 'Failed to perform AML check');
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to initiate AML check');
    }
  };

  const handleGenerateTaxReport = async () => {
    if (!user) return;
    
    try {
      const currentYear = new Date().getFullYear() - 1;
      await complianceService.generateTaxReport(user.id, currentYear);
      Alert.alert('Success', `Tax report for ${currentYear} has been generated`);
      loadComplianceData();
    } catch (error) {
      Alert.alert('Error', 'Failed to generate tax report');
    }
  };

  const renderComplianceOverview = () => (
    <ScrollView
      style={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Compliance Score Card */}
      <LinearGradient
        colors={['#1E40AF', '#3B82F6']}
        style={styles.scoreCard}
      >
        <View style={styles.scoreHeader}>
          <Shield color="#FFFFFF" size={24} />
          <Text style={styles.scoreTitle}>Compliance Score</Text>
        </View>
        <Text style={styles.scoreValue}>{100 - (dashboardData?.riskScore || 0)}/100</Text>
        <Text style={styles.scoreSubtitle}>
          {dashboardData?.riskScore < 25 ? 'Excellent' : 
           dashboardData?.riskScore < 50 ? 'Good' : 
           dashboardData?.riskScore < 75 ? 'Needs Attention' : 'Critical'}
        </Text>
      </LinearGradient>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Users color="#10B981" size={20} />
          <Text style={styles.statValue}>
            {dashboardData?.kycStatus?.status === 'approved' ? 'Verified' : 'Pending'}
          </Text>
          <Text style={styles.statLabel}>KYC Status</Text>
        </Card>

        <Card style={styles.statCard}>
          <Shield color="#3B82F6" size={20} />
          <Text style={styles.statValue}>{dashboardData?.amlChecks?.length || 0}</Text>
          <Text style={styles.statLabel}>AML Checks</Text>
        </Card>

        <Card style={styles.statCard}>
          <AlertTriangle color="#F59E0B" size={20} />
          <Text style={styles.statValue}>{dashboardData?.activeAlerts?.length || 0}</Text>
          <Text style={styles.statLabel}>Active Alerts</Text>
        </Card>

        <Card style={styles.statCard}>
          <FileText color="#8B5CF6" size={20} />
          <Text style={styles.statValue}>{dashboardData?.upcomingFilings?.length || 0}</Text>
          <Text style={styles.statLabel}>Pending Filings</Text>
        </Card>
      </View>

      {/* KYC Status Section */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Users color="#1E40AF" size={20} />
          <Text style={styles.sectionTitle}>KYC Verification</Text>
          <TouchableOpacity onPress={() => setSelectedView('kyc')}>
            <Eye color="#6B7280" size={16} />
          </TouchableOpacity>
        </View>
        <View style={styles.kycStatus}>
          <View style={[
            styles.statusBadge,
            {
              backgroundColor: dashboardData?.kycStatus?.status === 'approved' ? '#10B981' : 
                              dashboardData?.kycStatus?.status === 'pending' ? '#F59E0B' : '#EF4444'
            }
          ]}>
            <Text style={styles.statusText}>
              {dashboardData?.kycStatus?.status?.toUpperCase() || 'NOT STARTED'}
            </Text>
          </View>
          {dashboardData?.kycStatus?.reviewed_at && (
            <Text style={styles.statusDate}>
              Last reviewed: {new Date(dashboardData.kycStatus.reviewed_at).toLocaleDateString()}
            </Text>
          )}
        </View>
      </Card>

      {/* AML Screening Section */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Shield color="#1E40AF" size={20} />
          <Text style={styles.sectionTitle}>AML Screening</Text>
          <TouchableOpacity onPress={handleRunAMLCheck}>
            <Settings color="#6B7280" size={16} />
          </TouchableOpacity>
        </View>
        {dashboardData?.amlChecks?.length > 0 ? (
          <View style={styles.amlResults}>
            {dashboardData.amlChecks.slice(0, 3).map((check: any, index: number) => (
              <View key={index} style={styles.amlCheckItem}>
                <Text style={styles.amlCheckType}>{check.check_type.toUpperCase()}</Text>
                <View style={[
                  styles.amlResult,
                  { backgroundColor: check.result === 'clear' ? '#10B981' : '#F59E0B' }
                ]}>
                  <Text style={styles.amlResultText}>{check.result.toUpperCase()}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No AML checks performed yet</Text>
        )}
      </Card>

      {/* Tax Reporting Section */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <FileText color="#1E40AF" size={20} />
          <Text style={styles.sectionTitle}>Tax Reporting</Text>
          <TouchableOpacity onPress={handleGenerateTaxReport}>
            <Download color="#6B7280" size={16} />
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionDescription}>
          Generate comprehensive tax reports for capital gains, losses, and dividend income.
        </Text>
        <Button
          title="Generate 2023 Tax Report"
          onPress={handleGenerateTaxReport}
          variant="outline"
          size="small"
          style={styles.actionButton}
        />
      </Card>

      {/* Alerts Section */}
      {dashboardData?.activeAlerts?.length > 0 && (
        <Card style={styles.alertsCard}>
          <View style={styles.sectionHeader}>
            <AlertTriangle color="#F59E0B" size={20} />
            <Text style={styles.sectionTitle}>Active Alerts</Text>
            <TouchableOpacity onPress={() => setSelectedView('alerts')}>
              <Eye color="#6B7280" size={16} />
            </TouchableOpacity>
          </View>
          {dashboardData.activeAlerts.slice(0, 2).map((alert: any) => (
            <View key={alert.id} style={styles.alertItem}>
              <View style={styles.alertInfo}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertDescription}>{alert.description}</Text>
              </View>
              <View style={[
                styles.alertSeverity,
                { backgroundColor: alert.severity === 'critical' ? '#EF4444' : '#F59E0B' }
              ]}>
                <Text style={styles.alertSeverityText}>{alert.severity.toUpperCase()}</Text>
              </View>
            </View>
          ))}
        </Card>
      )}

      {/* Regulatory Filings */}
      {dashboardData?.upcomingFilings?.length > 0 && (
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Clock color="#1E40AF" size={20} />
            <Text style={styles.sectionTitle}>Upcoming Filings</Text>
          </View>
          {dashboardData.upcomingFilings.map((filing: any) => (
            <View key={filing.id} style={styles.filingItem}>
              <View style={styles.filingInfo}>
                <Text style={styles.filingType}>{filing.filing_type}</Text>
                <Text style={styles.filingJurisdiction}>{filing.jurisdiction}</Text>
              </View>
              <Text style={styles.filingDeadline}>
                Due: {new Date(filing.deadline).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading compliance data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Compliance</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <Bell color="#1F2937" size={24} />
          {dashboardData?.activeAlerts?.length > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {dashboardData.activeAlerts.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabNavigation}>
        {[
          { key: 'dashboard', label: 'Overview', icon: TrendingUp },
          { key: 'kyc', label: 'KYC', icon: Users },
          { key: 'aml', label: 'AML', icon: Shield },
          { key: 'tax', label: 'Tax', icon: FileText },
          { key: 'alerts', label: 'Alerts', icon: AlertTriangle },
        ].map(tab => {
          const IconComponent = tab.icon;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                selectedView === tab.key && styles.tabButtonActive
              ]}
              onPress={() => setSelectedView(tab.key as any)}
            >
              <IconComponent 
                color={selectedView === tab.key ? '#1E40AF' : '#6B7280'} 
                size={16} 
              />
              <Text style={[
                styles.tabButtonText,
                selectedView === tab.key && styles.tabButtonTextActive
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {selectedView === 'dashboard' && renderComplianceOverview()}
      {selectedView !== 'dashboard' && (
        <ComplianceDashboard userRole={profile?.role === 'admin' ? 'admin' : 'user'} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#EBF4FF',
  },
  tabButtonText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginLeft: 4,
  },
  tabButtonTextActive: {
    color: '#1E40AF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  scoreCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  scoreValue: {
    fontSize: 48,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  scoreSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: 16,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  sectionCard: {
    marginBottom: 16,
  },
  alertsCard: {
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 12,
  },
  kycStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  statusDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  amlResults: {
    gap: 8,
  },
  amlCheckItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  amlCheckType: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
  },
  amlResult: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  amlResultText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  actionButton: {
    alignSelf: 'flex-start',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  alertInfo: {
    flex: 1,
    marginRight: 12,
  },
  alertTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  alertSeverity: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  alertSeverityText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  filingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filingInfo: {
    flex: 1,
  },
  filingType: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  filingJurisdiction: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  filingDeadline: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#F59E0B',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    fontStyle: 'italic',
  },
});