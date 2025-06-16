import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  ArrowRight,
  X
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { diditKYCService, DiditKYCSession } from '../services/diditKYC';

interface KYCStatusProps {
  onKYCComplete?: () => void;
  showModal?: boolean;
  onClose?: () => void;
}

export const KYCStatus: React.FC<KYCStatusProps> = ({ 
  onKYCComplete, 
  showModal = false, 
  onClose 
}) => {
  const { user, isDemoMode, demoAccount } = useAuth();
  const [kycSession, setKycSession] = useState<DiditKYCSession | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkKYCStatus();
  }, [user, isDemoMode]);

  const checkKYCStatus = async () => {
    if (!user && !isDemoMode) return;

    setLoading(true);
    try {
      let userId: string;
      
      if (isDemoMode && demoAccount) {
        userId = demoAccount.id;
      } else if (user) {
        userId = user.id || user.email || 'user';
      } else {
        return;
      }

      const session = await diditKYCService.getSessionStatus(userId);
      setKycSession(session);

      if (session?.status === 'completed' && session.overallScore >= 80 && onKYCComplete) {
        onKYCComplete();
      }
    } catch (error) {
      console.error('Error checking KYC status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = () => {
    if (!kycSession) {
      return {
        status: 'not_started',
        title: 'KYC Verification Required',
        description: 'Complete identity verification to access all features',
        color: '#6b7280',
        icon: AlertCircle,
        actionText: 'Start Verification',
      };
    }

    if (kycSession.status === 'completed' && kycSession.overallScore >= 80) {
      return {
        status: 'approved',
        title: 'KYC Verified',
        description: `Identity verified with ${kycSession.overallScore}% confidence`,
        color: '#10b981',
        icon: CheckCircle,
        actionText: 'View Details',
      };
    }

    if (kycSession.status === 'in_progress') {
      const completedDocs = kycSession.documents.filter(doc => doc.status === 'verified').length;
      const totalDocs = kycSession.documents.length;
      const biometricDone = kycSession.biometricResult?.status === 'approved';
      
      return {
        status: 'in_progress',
        title: 'Verification In Progress',
        description: `Documents: ${completedDocs}/${totalDocs}, Biometric: ${biometricDone ? 'Done' : 'Pending'}`,
        color: '#f59e0b',
        icon: Clock,
        actionText: 'Continue',
      };
    }

    if (kycSession.status === 'failed' || kycSession.overallScore < 50) {
      return {
        status: 'rejected',
        title: 'Verification Failed',
        description: 'Please review and retry your verification',
        color: '#ef4444',
        icon: AlertCircle,
        actionText: 'Retry Verification',
      };
    }

    return {
      status: 'unknown',
      title: 'Verification Status Unknown',
      description: 'Please check your verification status',
      color: '#6b7280',
      icon: AlertCircle,
      actionText: 'Check Status',
    };
  };

  const handleAction = () => {
    const statusInfo = getStatusInfo();
    
    if (statusInfo.status === 'approved') {
      const session = kycSession!;
      const documentNames = session.documents.map(doc => doc.name).join(', ');
      Alert.alert(
        'KYC Verified ✓',
        `Your account is fully verified with Didit!\n\nScore: ${session.overallScore}%\nDocuments: ${documentNames}\nBiometric: ${session.biometricResult?.status || 'N/A'}\n\nYou have access to all platform features.`,
        [{ text: 'OK' }]
      );
    } else {
      router.push('/(auth)/kyc');
    }
    
    if (onClose) onClose();
  };

  const statusInfo = getStatusInfo();
  const IconComponent = statusInfo.icon;

  const renderContent = () => (
    <View style={styles.container}>
      <LinearGradient
        colors={[statusInfo.color, statusInfo.color + '20']}
        style={styles.statusCard}
      >
        <View style={styles.statusHeader}>
          <View style={[styles.statusIcon, { backgroundColor: statusInfo.color }]}>
            <IconComponent size={24} color="white" />
          </View>
          <View style={styles.statusText}>
            <Text style={styles.statusTitle}>{statusInfo.title}</Text>
            <Text style={styles.statusDescription}>{statusInfo.description}</Text>
          </View>
        </View>

        {kycSession && kycSession.status !== 'completed' && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${kycSession.overallScore}%`, backgroundColor: statusInfo.color }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{kycSession.overallScore}% Complete</Text>
          </View>
        )}

        {kycSession?.complianceFlags && kycSession.complianceFlags.length > 0 && (
          <View style={styles.complianceWarning}>
            <AlertCircle size={16} color="#f59e0b" />
            <Text style={styles.complianceText}>
              {kycSession.complianceFlags.length} compliance issue(s) need attention
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.actionButton} onPress={handleAction}>
          <Text style={styles.actionButtonText}>{statusInfo.actionText}</Text>
          <ArrowRight size={16} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      {kycSession?.complianceFlags && kycSession.complianceFlags.length > 0 && (
        <View style={styles.warningContainer}>
          <AlertCircle size={20} color="#f59e0b" />
          <Text style={styles.warningText}>
            {kycSession.complianceFlags.length} issue(s) need attention
          </Text>
        </View>
      )}
    </View>
  );

  if (showModal) {
    return (
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        transparent={false}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>KYC Status</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          {renderContent()}
        </View>
      </Modal>
    );
  }

  return renderContent();
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: 'white',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  closeButton: {
    padding: 4,
  },
  statusCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'right',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    marginRight: 8,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
  },
  warningText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#92400e',
    fontWeight: '500',
  },
  complianceWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  complianceText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#92400e',
    fontWeight: '500',
  },
});

export default KYCStatus;
