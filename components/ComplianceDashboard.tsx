import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  TrendingUp,
  Users,
  Calendar,
  Eye,
  Download,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { complianceService, ComplianceAlert, RegulatoryFiling } from '../services/complianceService';
import { useAuth } from '../hooks/useAuth';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface ComplianceDashboardProps {
  userRole?: 'admin' | 'compliance' | 'user';
}

export function ComplianceDashboard({ userRole = 'user' }: ComplianceDashboardProps) {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'alerts' | 'filings' | 'reports'>('overview');

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await complianceService.getComplianceDashboard(
        userRole === 'user' ? user?.id : undefined
      );
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading compliance dashboard:', error);
      Alert.alert('Error', 'Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score < 25) return '#10B981'; // Green
    if (score < 50) return '#F59E0B'; // Yellow
    if (score < 75) return '#EF4444'; // Red
    return '#7C2D12'; // Dark red
  };

  const getRiskScoreLabel = (score: number) => {
    if (score < 25) return 'Low Risk';
    if (score < 50) return 'Medium Risk';
    if (score < 75) return 'High Risk';
    return 'Critical Risk';
  };

  const handleGenerateTaxReport = async () => {
    if (!user) return;
    
    try {
      const currentYear = new Date().getFullYear() - 1; // Previous year
      await complianceService.generateTaxReport(user.id, currentYear);
      Alert.alert('Success', `Tax report for ${currentYear} has been generated`);
      loadDashboardData();
    } catch (error) {
      Alert.alert('Error', 'Failed to generate tax report');
    }
  };

  const renderOverview = () => (
    <ScrollView style={styles.tabContent}>
      {/* Risk Score Card */}
      <LinearGradient
        colors={[getRiskScoreColor(dashboardData.riskScore), getRiskScoreColor(dashboardData.riskScore) + '80']}
        style={styles.riskScoreCard}
      >
        <View style={styles.riskScoreHeader}>
          <Shield color="#FFFFFF" size={24} />
          <Text style={styles.riskScoreTitle}>Compliance Risk Score</Text>
        </View>
        <Text style={styles.riskScoreValue}>{dashboardData.riskScore}/100</Text>
        <Text style={styles.riskScoreLabel}>{getRiskScoreLabel(dashboardData.riskScore)}</Text>
      </LinearGradient>

      {/* KYC Status */}
      <Card style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Users color="#1E40AF" size={20} />
          <Text style={styles.statusTitle}>KYC Status</Text>
        </View>
        <View style={styles.statusContent}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: dashboardData.kycStatus?.status === 'approved' ? '#10B981' : '#F59E0B' }
          ]}>
            <Text style={styles.statusBadgeText}>
              {dashboardData.kycStatus?.status?.toUpperCase() || 'NOT STARTED'}
            </Text>
          </View>
          {dashboardData.kycStatus?.reviewed_at && (
            <Text style={styles.statusDate}>
              Last reviewed: {new Date(dashboardData.kycStatus.reviewed_at).toLocaleDateString()}
            </Text>
          )}
        </View>
      </Card>

      {/* Recent AML Checks */}
      <Card style={styles.amlCard}>
        <View style={styles.cardHeader}>
          <Shield color="#1E40AF" size={20} />
          <Text style={styles.cardTitle}>Recent AML Checks</Text>
        </View>
        {dashboardData.amlChecks.length > 0 ? (
          dashboardData.amlChecks.map((check: any, index: number) => (
            <View key={index} style={styles.amlCheckItem}>
              <View style={styles.amlCheckInfo}>
                <Text style={styles.amlCheckType}>{check.check_type.toUpperCase()}</Text>
                <Text style={styles.amlCheckDate}>
                  {new Date(check.checked_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={[
                styles.amlResult,
                { backgroundColor: check.result === 'clear' ? '#10B981' : '#F59E0B' }
              ]}>
                <Text style={styles.amlResultText}>{check.result.toUpperCase()}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No AML checks performed yet</Text>
        )}
      </Card>

      {/* Quick Actions */}
      <Card style={styles.actionsCard}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <Button
            title="Generate Tax Report"
            onPress={handleGenerateTaxReport}
            variant="outline"
            size="small"
          />
          <Button
            title="Download Compliance Report"
            onPress={() => Alert.alert('Info', 'Feature coming soon')}
            variant="outline"
            size="small"
          />
        </View>
      </Card>
    </ScrollView>
  );

  const renderAlerts = () => (
    <ScrollView style={styles.tabContent}>
      {dashboardData.activeAlerts.length > 0 ? (
        dashboardData.activeAlerts.map((alert: ComplianceAlert) => (
          <Card key={alert.id} style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <AlertTriangle 
                color={alert.severity === 'critical' ? '#EF4444' : '#F59E0B'} 
                size={20} 
              />
              <View style={styles.alertInfo}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertDescription}>{alert.description}</Text>
              </View>
              <View style={[
                styles.severityBadge,
                { backgroundColor: alert.severity === 'critical' ? '#EF4444' : '#F59E0B' }
              ]}>
                <Text style={styles.severityText}>{alert.severity.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.alertDate}>
              Created: {new Date(alert.created_at).toLocaleString()}
            </Text>
          </Card>
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <CheckCircle color="#10B981" size={48} />
          <Text style={styles.emptyTitle}>No Active Alerts</Text>
          <Text style={styles.emptyText}>All compliance checks are passing</Text>
        </Card>
      )}
    </ScrollView>
  );

  const renderFilings = () => (
    <ScrollView style={styles.tabContent}>
      {dashboardData.upcomingFilings.length > 0 ? (
        dashboardData.upcomingFilings.map((filing: RegulatoryFiling) => (
          <Card key={filing.id} style={styles.filingCard}>
            <View style={styles.filingHeader}>
              <FileText color="#1E40AF" size={20} />
              <View style={styles.filingInfo}>
                <Text style={styles.filingType}>{filing.filing_type}</Text>
                <Text style={styles.filingJurisdiction}>{filing.jurisdiction}</Text>
              </View>
              <View style={styles.filingStatus}>
                <Text style={styles.filingStatusText}>{filing.status.toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.filingDeadline}>
              <Calendar color="#6B7280" size={16} />
              <Text style={styles.deadlineText}>
                Due: {new Date(filing.deadline).toLocaleDateString()}
              </Text>
            </View>
          </Card>
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <FileText color="#6B7280" size={48} />
          <Text style={styles.emptyTitle}>No Upcoming Filings</Text>
          <Text style={styles.emptyText}>All regulatory filings are up to date</Text>
        </Card>
      )}
    </ScrollView>
  );

  const renderReports = () => (
    <ScrollView style={styles.tabContent}>
      <Card style={styles.reportsCard}>
        <Text style={styles.cardTitle}>Available Reports</Text>
        
        <TouchableOpacity style={styles.reportItem}>
          <View style={styles.reportInfo}>
            <FileText color="#1E40AF" size={20} />
            <View style={styles.reportDetails}>
              <Text style={styles.reportName}>Annual Compliance Report</Text>
              <Text style={styles.reportDescription}>Comprehensive compliance overview</Text>
            </View>
          </View>
          <Download color="#6B7280" size={20} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.reportItem}>
          <View style={styles.reportInfo}>
            <TrendingUp color="#10B981" size={20} />
            <View style={styles.reportDetails}>
              <Text style={styles.reportName}>Tax Summary Report</Text>
              <Text style={styles.reportDescription}>Capital gains and losses summary</Text>
            </View>
          </View>
          <Download color="#6B7280" size={20} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.reportItem}>
          <View style={styles.reportInfo}>
            <Shield color="#8B5CF6" size={20} />
            <View style={styles.reportDetails}>
              <Text style={styles.reportName}>AML Screening Report</Text>
              <Text style={styles.reportDescription}>Anti-money laundering check results</Text>
            </View>
          </View>
          <Download color="#6B7280" size={20} />
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading compliance data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        {[
          { key: 'overview', label: 'Overview', icon: Shield },
          { key: 'alerts', label: 'Alerts', icon: AlertTriangle },
          { key: 'filings', label: 'Filings', icon: FileText },
          { key: 'reports', label: 'Reports', icon: Download },
        ].map(tab => {
          const IconComponent = tab.icon;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                selectedTab === tab.key && styles.tabButtonActive
              ]}
              onPress={() => setSelectedTab(tab.key as any)}
            >
              <IconComponent 
                color={selectedTab === tab.key ? '#1E40AF' : '#6B7280'} 
                size={20} 
              />
              <Text style={[
                styles.tabButtonText,
                selectedTab === tab.key && styles.tabButtonTextActive
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tab Content */}
      {selectedTab === 'overview' && renderOverview()}
      {selectedTab === 'alerts' && renderAlerts()}
      {selectedTab === 'filings' && renderFilings()}
      {selectedTab === 'reports' && renderReports()}
    </View>
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
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#EBF4FF',
  },
  tabButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginLeft: 6,
  },
  tabButtonTextActive: {
    color: '#1E40AF',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  riskScoreCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  riskScoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  riskScoreTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  riskScoreValue: {
    fontSize: 48,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  riskScoreLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  statusCard: {
    marginBottom: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginLeft: 8,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  statusDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  amlCard: {
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginLeft: 8,
  },
  amlCheckItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  amlCheckInfo: {
    flex: 1,
  },
  amlCheckType: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  amlCheckDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
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
  actionsCard: {
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  alertCard: {
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  alertInfo: {
    flex: 1,
    marginLeft: 12,
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
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  severityText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  alertDate: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  filingCard: {
    marginBottom: 12,
  },
  filingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  filingInfo: {
    flex: 1,
    marginLeft: 12,
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
  filingStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  filingStatusText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  filingDeadline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deadlineText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 6,
  },
  reportsCard: {
    marginBottom: 20,
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  reportInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reportDetails: {
    marginLeft: 12,
  },
  reportName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  reportDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
});