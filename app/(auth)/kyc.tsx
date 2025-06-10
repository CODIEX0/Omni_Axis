import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, Upload, Check, Shield } from 'lucide-react-native';

export default function KYCScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [documents, setDocuments] = useState({
    idDocument: false,
    proofOfAddress: false,
    selfie: false,
  });

  const steps = [
    'Identity Verification',
    'Address Verification', 
    'Biometric Verification',
    'Review & Submit'
  ];

  const handleDocumentUpload = (docType: string) => {
    // Simulate document upload
    setDocuments(prev => ({ ...prev, [docType]: true }));
    Alert.alert('Success', 'Document uploaded successfully');
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete KYC process
      Alert.alert(
        'KYC Submitted',
        'Your documents are being reviewed. You will receive an email within 24 hours.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
      );
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Shield color="#F59E0B" size={48} />
              <Text style={styles.stepTitle}>Identity Verification</Text>
              <Text style={styles.stepDescription}>
                Upload a clear photo of your government-issued ID
              </Text>
            </View>

            <View style={styles.documentSection}>
              <Text style={styles.sectionTitle}>Government ID</Text>
              <Text style={styles.sectionDescription}>
                Passport, Driver's License, or National ID
              </Text>
              
              <View style={styles.uploadOptions}>
                <TouchableOpacity
                  style={[styles.uploadButton, documents.idDocument && styles.uploadButtonSuccess]}
                  onPress={() => handleDocumentUpload('idDocument')}
                >
                  <Camera color={documents.idDocument ? "#FFFFFF" : "#F59E0B"} size={24} />
                  <Text style={[styles.uploadButtonText, documents.idDocument && styles.uploadButtonTextSuccess]}>
                    {documents.idDocument ? 'Uploaded' : 'Take Photo'}
                  </Text>
                  {documents.idDocument && <Check color="#FFFFFF" size={20} />}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.uploadButton, documents.idDocument && styles.uploadButtonSuccess]}
                  onPress={() => handleDocumentUpload('idDocument')}
                >
                  <Upload color={documents.idDocument ? "#FFFFFF" : "#F59E0B"} size={24} />
                  <Text style={[styles.uploadButtonText, documents.idDocument && styles.uploadButtonTextSuccess]}>
                    {documents.idDocument ? 'Uploaded' : 'Upload File'}
                  </Text>
                  {documents.idDocument && <Check color="#FFFFFF" size={20} />}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Shield color="#F59E0B" size={48} />
              <Text style={styles.stepTitle}>Address Verification</Text>
              <Text style={styles.stepDescription}>
                Upload a document showing your current address
              </Text>
            </View>

            <View style={styles.documentSection}>
              <Text style={styles.sectionTitle}>Proof of Address</Text>
              <Text style={styles.sectionDescription}>
                Utility bill, bank statement, or lease agreement (within 3 months)
              </Text>
              
              <View style={styles.uploadOptions}>
                <TouchableOpacity
                  style={[styles.uploadButton, documents.proofOfAddress && styles.uploadButtonSuccess]}
                  onPress={() => handleDocumentUpload('proofOfAddress')}
                >
                  <Camera color={documents.proofOfAddress ? "#FFFFFF" : "#F59E0B"} size={24} />
                  <Text style={[styles.uploadButtonText, documents.proofOfAddress && styles.uploadButtonTextSuccess]}>
                    {documents.proofOfAddress ? 'Uploaded' : 'Take Photo'}
                  </Text>
                  {documents.proofOfAddress && <Check color="#FFFFFF" size={20} />}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.uploadButton, documents.proofOfAddress && styles.uploadButtonSuccess]}
                  onPress={() => handleDocumentUpload('proofOfAddress')}
                >
                  <Upload color={documents.proofOfAddress ? "#FFFFFF" : "#F59E0B"} size={24} />
                  <Text style={[styles.uploadButtonText, documents.proofOfAddress && styles.uploadButtonTextSuccess]}>
                    {documents.proofOfAddress ? 'Uploaded' : 'Upload File'}
                  </Text>
                  {documents.proofOfAddress && <Check color="#FFFFFF" size={20} />}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Shield color="#F59E0B" size={48} />
              <Text style={styles.stepTitle}>Biometric Verification</Text>
              <Text style={styles.stepDescription}>
                Take a selfie for identity confirmation
              </Text>
            </View>

            <View style={styles.documentSection}>
              <Text style={styles.sectionTitle}>Live Selfie</Text>
              <Text style={styles.sectionDescription}>
                Hold your phone at eye level and look directly at the camera
              </Text>
              
              <TouchableOpacity
                style={[styles.selfieButton, documents.selfie && styles.uploadButtonSuccess]}
                onPress={() => handleDocumentUpload('selfie')}
              >
                <Camera color={documents.selfie ? "#FFFFFF" : "#F59E0B"} size={32} />
                <Text style={[styles.selfieButtonText, documents.selfie && styles.uploadButtonTextSuccess]}>
                  {documents.selfie ? 'Selfie Captured' : 'Take Selfie'}
                </Text>
                {documents.selfie && <Check color="#FFFFFF" size={24} />}
              </TouchableOpacity>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Check color="#10B981" size={48} />
              <Text style={styles.stepTitle}>Review & Submit</Text>
              <Text style={styles.stepDescription}>
                Please review your submitted documents
              </Text>
            </View>

            <View style={styles.reviewSection}>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Government ID</Text>
                <View style={styles.reviewStatus}>
                  <Check color="#10B981" size={20} />
                  <Text style={styles.reviewStatusText}>Uploaded</Text>
                </View>
              </View>

              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Proof of Address</Text>
                <View style={styles.reviewStatus}>
                  <Check color="#10B981" size={20} />
                  <Text style={styles.reviewStatusText}>Uploaded</Text>
                </View>
              </View>

              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Live Selfie</Text>
                <View style={styles.reviewStatus}>
                  <Check color="#10B981" size={20} />
                  <Text style={styles.reviewStatusText}>Captured</Text>
                </View>
              </View>
            </View>

            <View style={styles.disclaimer}>
              <Text style={styles.disclaimerText}>
                By submitting these documents, you confirm that all information provided is accurate and belongs to you. 
                Your documents will be securely processed and reviewed within 24 hours.
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return documents.idDocument;
      case 1:
        return documents.proofOfAddress;
      case 2:
        return documents.selfie;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1E40AF', '#3B82F6']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft color="#FFFFFF" size={24} />
            </TouchableOpacity>

            <Text style={styles.title}>KYC Verification</Text>
            <Text style={styles.subtitle}>
              Step {currentStep + 1} of {steps.length}
            </Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${((currentStep + 1) / steps.length) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {steps[currentStep]}
            </Text>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {renderStepContent()}
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
              onPress={handleNext}
              disabled={!canProceed()}
            >
              <Text style={styles.nextButtonText}>
                {currentStep === steps.length - 1 ? 'Submit for Review' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  stepContent: {
    paddingBottom: 20,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  documentSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 24,
    lineHeight: 20,
  },
  uploadOptions: {
    gap: 12,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#F59E0B',
    gap: 12,
  },
  uploadButtonSuccess: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  uploadButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#F59E0B',
  },
  uploadButtonTextSuccess: {
    color: '#FFFFFF',
  },
  selfieButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#F59E0B',
    gap: 12,
  },
  selfieButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#F59E0B',
  },
  reviewSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 24,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  reviewLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  reviewStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewStatusText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#10B981',
  },
  disclaimer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  disclaimerText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
    textAlign: 'center',
  },
  buttonContainer: {
    paddingVertical: 20,
  },
  nextButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});