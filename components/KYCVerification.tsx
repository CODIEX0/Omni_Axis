import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Shield, 
  Camera, 
  FileText, 
  User, 
  MapPin, 
  Check, 
  AlertCircle,
  Upload,
  Eye,
  EyeOff
} from 'lucide-react-native';
import { useCamera } from '../hooks/useCamera';
import { useDocumentPicker } from '../hooks/useDocumentPicker';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useTypedSelector } from '../hooks/useTypedSelector';
import { router } from 'expo-router';

interface KYCDocument {
  id: string;
  type: 'passport' | 'driver_license' | 'national_id' | 'proof_of_address' | 'selfie';
  name: string;
  uri?: string;
  status: 'pending' | 'uploaded' | 'verified' | 'rejected';
  required: boolean;
}

interface KYCStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  required: boolean;
}

export function KYCVerification() {
  const [currentStep, setCurrentStep] = useState(0);
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    nationality: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
    phoneNumber: '',
    occupation: '',
  });
  const [documents, setDocuments] = useState<KYCDocument[]>([
    {
      id: 'passport',
      type: 'passport',
      name: 'Passport',
      status: 'pending',
      required: true,
    },
    {
      id: 'proof_address',
      type: 'proof_of_address',
      name: 'Proof of Address',
      status: 'pending',
      required: true,
    },
    {
      id: 'selfie',
      type: 'selfie',
      name: 'Selfie Verification',
      status: 'pending',
      required: true,
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSensitiveData, setShowSensitiveData] = useState(false);

  const dispatch = useAppDispatch();
  const { user, kycStatus } = useTypedSelector(state => state.user);
  const { requestCameraPermission, takePicture } = useCamera();
  const { pickDocument } = useDocumentPicker();

  const kycSteps: KYCStep[] = [
    {
      id: 'personal_info',
      title: 'Personal Information',
      description: 'Provide your basic personal details',
      status: personalInfo.firstName && personalInfo.lastName ? 'completed' : 'pending',
      required: true,
    },
    {
      id: 'documents',
      title: 'Document Upload',
      description: 'Upload required identity documents',
      status: documents.every(doc => doc.required ? doc.status === 'uploaded' : true) ? 'completed' : 'pending',
      required: true,
    },
    {
      id: 'verification',
      title: 'Identity Verification',
      description: 'Complete biometric verification',
      status: 'pending',
      required: true,
    },
    {
      id: 'review',
      title: 'Review & Submit',
      description: 'Review your information and submit for approval',
      status: 'pending',
      required: true,
    },
  ];

  useEffect(() => {
    // Check existing KYC status
    if (kycStatus === 'verified') {
      Alert.alert(
        'KYC Already Verified',
        'Your identity has already been verified.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  }, [kycStatus]);

  const handleDocumentUpload = async (documentId: string, method: 'camera' | 'gallery') => {
    try {
      let result;
      
      if (method === 'camera') {
        const permission = await requestCameraPermission();
        if (!permission) {
          Alert.alert('Camera Permission', 'Camera access is required to take photos of documents.');
          return;
        }
        result = await takePicture();
      } else {
        result = await pickDocument(['image/*', 'application/pdf']);
      }

      if (result && !result.cancelled) {
        setDocuments(prev => 
          prev.map(doc => 
            doc.id === documentId 
              ? { ...doc, uri: result.uri, status: 'uploaded' as const }
              : doc
          )
        );
        
        Alert.alert('Success', 'Document uploaded successfully!');
      }
    } catch (error) {
      console.error('Document upload error:', error);
      Alert.alert('Upload Failed', 'Failed to upload document. Please try again.');
    }
  };

  const showDocumentOptions = (documentId: string) => {
    Alert.alert(
      'Upload Document',
      'Choose how you would like to upload your document',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: () => handleDocumentUpload(documentId, 'camera') },
        { text: 'Choose from Gallery', onPress: () => handleDocumentUpload(documentId, 'gallery') },
      ]
    );
  };

  const handleBiometricVerification = async () => {
    try {
      // This would integrate with a biometric verification service
      // For demo purposes, we'll simulate the process
      Alert.alert(
        'Biometric Verification',
        'This will use your device camera to verify your identity. Make sure you are in a well-lit area.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Start Verification', 
            onPress: async () => {
              const permission = await requestCameraPermission();
              if (permission) {
                // Simulate biometric verification
                setTimeout(() => {
                  Alert.alert('Success', 'Biometric verification completed successfully!');
                  setCurrentStep(3); // Move to review step
                }, 2000);
              }
            }
          },
        ]
      );
    } catch (error) {
      console.error('Biometric verification error:', error);
      Alert.alert('Verification Failed', 'Biometric verification failed. Please try again.');
    }
  };

  const handleSubmitKYC = async () => {
    if (isSubmitting) return;

    // Validate all required information
    const missingInfo = [];
    if (!personalInfo.firstName || !personalInfo.lastName) missingInfo.push('Personal Information');
    if (!documents.every(doc => doc.required ? doc.status === 'uploaded' : true)) {
      missingInfo.push('Required Documents');
    }

    if (missingInfo.length > 0) {
      Alert.alert(
        'Missing Information',
        `Please complete: ${missingInfo.join(', ')}`,
        [{ text: 'OK' }]
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate KYC submission
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      Alert.alert(
        'KYC Submitted Successfully',
        'Your KYC information has been submitted for review. You will receive a notification once the verification is complete (typically 1-3 business days).',
        [
          { 
            text: 'OK', 
            onPress: () => {
              // Update user KYC status
              router.replace('/(tabs)/profile');
            }
          }
        ]
      );
    } catch (error) {
      console.error('KYC submission error:', error);
      Alert.alert('Submission Failed', 'Failed to submit KYC information. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {kycSteps.map((step, index) => (
        <View key={step.id} style={styles.stepItem}>
          <View style={[
            styles.stepCircle,
            currentStep === index && styles.stepCircleActive,
            currentStep > index && styles.stepCircleCompleted,
          ]}>
            {currentStep > index ? (
              <Check color="#FFFFFF" size={16} />
            ) : (
              <Text style={[
                styles.stepNumber,
                currentStep === index && styles.stepNumberActive,
              ]}>
                {index + 1}
              </Text>
            )}
          </View>
          {index < kycSteps.length - 1 && (
            <View style={[
              styles.stepLine,
              currentStep > index && styles.stepLineCompleted,
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderPersonalInfoStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Personal Information</Text>
      <Text style={styles.stepDescription}>
        Please provide accurate personal information as it appears on your identity documents.
      </Text>

      <View style={styles.formSection}>
        <View style={styles.formRow}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>First Name *</Text>
            <TextInput
              style={styles.textInput}
              value={personalInfo.firstName}
              onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, firstName: text }))}
              placeholder="Enter first name"
            />
          </View>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Last Name *</Text>
            <TextInput
              style={styles.textInput}
              value={personalInfo.lastName}
              onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, lastName: text }))}
              placeholder="Enter last name"
            />
          </View>
        </View>

        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Date of Birth *</Text>
          <TextInput
            style={styles.textInput}
            value={personalInfo.dateOfBirth}
            onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, dateOfBirth: text }))}
            placeholder="MM/DD/YYYY"
          />
        </View>

        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Nationality *</Text>
          <TextInput
            style={styles.textInput}
            value={personalInfo.nationality}
            onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, nationality: text }))}
            placeholder="Enter nationality"
          />
        </View>

        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Phone Number *</Text>
          <TextInput
            style={styles.textInput}
            value={personalInfo.phoneNumber}
            onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, phoneNumber: text }))}
            placeholder="+1 (555) 123-4567"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.addressSection}>
          <Text style={styles.sectionTitle}>Address Information</Text>
          
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Street Address *</Text>
            <TextInput
              style={styles.textInput}
              value={personalInfo.address.street}
              onChangeText={(text) => setPersonalInfo(prev => ({ 
                ...prev, 
                address: { ...prev.address, street: text }
              }))}
              placeholder="Enter street address"
            />
          </View>

          <View style={styles.formRow}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>City *</Text>
              <TextInput
                style={styles.textInput}
                value={personalInfo.address.city}
                onChangeText={(text) => setPersonalInfo(prev => ({ 
                  ...prev, 
                  address: { ...prev.address, city: text }
                }))}
                placeholder="Enter city"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>State/Province *</Text>
              <TextInput
                style={styles.textInput}
                value={personalInfo.address.state}
                onChangeText={(text) => setPersonalInfo(prev => ({ 
                  ...prev, 
                  address: { ...prev.address, state: text }
                }))}
                placeholder="Enter state"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>ZIP/Postal Code *</Text>
              <TextInput
                style={styles.textInput}
                value={personalInfo.address.zipCode}
                onChangeText={(text) => setPersonalInfo(prev => ({ 
                  ...prev, 
                  address: { ...prev.address, zipCode: text }
                }))}
                placeholder="Enter ZIP code"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Country *</Text>
              <TextInput
                style={styles.textInput}
                value={personalInfo.address.country}
                onChangeText={(text) => setPersonalInfo(prev => ({ 
                  ...prev, 
                  address: { ...prev.address, country: text }
                }))}
                placeholder="Enter country"
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderDocumentsStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Document Upload</Text>
      <Text style={styles.stepDescription}>
        Upload clear, high-quality photos of your identity documents. All text should be clearly visible.
      </Text>

      <View style={styles.documentsGrid}>
        {documents.map((document) => (
          <View key={document.id} style={styles.documentCard}>
            <View style={styles.documentHeader}>
              <View style={styles.documentInfo}>
                <FileText color="#374151" size={20} />
                <Text style={styles.documentName}>{document.name}</Text>
              </View>
              <View style={[
                styles.documentStatus,
                document.status === 'uploaded' && styles.documentStatusUploaded,
                document.status === 'verified' && styles.documentStatusVerified,
              ]}>
                <Text style={[
                  styles.documentStatusText,
                  document.status === 'uploaded' && styles.documentStatusTextUploaded,
                  document.status === 'verified' && styles.documentStatusTextVerified,
                ]}>
                  {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                </Text>
              </View>
            </View>

            {document.uri ? (
              <View style={styles.documentPreview}>
                <Image source={{ uri: document.uri }} style={styles.documentImage} />
                <TouchableOpacity 
                  style={styles.reuploadButton}
                  onPress={() => showDocumentOptions(document.id)}
                >
                  <Text style={styles.reuploadButtonText}>Re-upload</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.uploadButton}
                onPress={() => showDocumentOptions(document.id)}
              >
                <Upload color="#1E40AF" size={24} />
                <Text style={styles.uploadButtonText}>Upload {document.name}</Text>
                <Text style={styles.uploadButtonSubtext}>
                  Take photo or choose from gallery
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    </View>
  );

  const renderVerificationStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Identity Verification</Text>
      <Text style={styles.stepDescription}>
        Complete biometric verification to confirm your identity matches your documents.
      </Text>

      <View style={styles.verificationSection}>
        <View style={styles.verificationCard}>
          <Camera color="#1E40AF" size={48} />
          <Text style={styles.verificationTitle}>Live Selfie Verification</Text>
          <Text style={styles.verificationText}>
            Take a selfie to verify that you are the person in the uploaded documents. 
            Make sure you are in a well-lit area and look directly at the camera.
          </Text>
          
          <TouchableOpacity 
            style={styles.verificationButton}
            onPress={handleBiometricVerification}
          >
            <Text style={styles.verificationButtonText}>Start Verification</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.securityNote}>
          <Shield color="#10B981" size={20} />
          <Text style={styles.securityNoteText}>
            Your biometric data is processed securely and is not stored permanently. 
            We use advanced AI to ensure the highest level of security.
          </Text>
        </View>
      </View>
    </View>
  );

  const renderReviewStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review & Submit</Text>
      <Text style={styles.stepDescription}>
        Please review all your information before submitting for verification.
      </Text>

      <View style={styles.reviewSection}>
        <View style={styles.reviewCard}>
          <View style={styles.reviewCardHeader}>
            <User color="#374151" size={20} />
            <Text style={styles.reviewCardTitle}>Personal Information</Text>
            <TouchableOpacity onPress={() => setShowSensitiveData(!showSensitiveData)}>
              {showSensitiveData ? (
                <EyeOff color="#6B7280" size={20} />
              ) : (
                <Eye color="#6B7280" size={20} />
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.reviewInfo}>
            <Text style={styles.reviewLabel}>Full Name</Text>
            <Text style={styles.reviewValue}>
              {showSensitiveData 
                ? `${personalInfo.firstName} ${personalInfo.lastName}`
                : '••••••••••'
              }
            </Text>
          </View>
          
          <View style={styles.reviewInfo}>
            <Text style={styles.reviewLabel}>Date of Birth</Text>
            <Text style={styles.reviewValue}>
              {showSensitiveData ? personalInfo.dateOfBirth : '••/••/••••'}
            </Text>
          </View>
          
          <View style={styles.reviewInfo}>
            <Text style={styles.reviewLabel}>Address</Text>
            <Text style={styles.reviewValue}>
              {showSensitiveData 
                ? `${personalInfo.address.street}, ${personalInfo.address.city}, ${personalInfo.address.state} ${personalInfo.address.zipCode}`
                : '••••••••••••••••••••'
              }
            </Text>
          </View>
        </View>

        <View style={styles.reviewCard}>
          <View style={styles.reviewCardHeader}>
            <FileText color="#374151" size={20} />
            <Text style={styles.reviewCardTitle}>Documents</Text>
          </View>
          
          {documents.map((doc) => (
            <View key={doc.id} style={styles.reviewInfo}>
              <Text style={styles.reviewLabel}>{doc.name}</Text>
              <View style={styles.reviewDocumentStatus}>
                <Check color="#10B981" size={16} />
                <Text style={styles.reviewDocumentText}>Uploaded</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.submitSection}>
          <View style={styles.disclaimer}>
            <AlertCircle color="#F59E0B" size={20} />
            <Text style={styles.disclaimerText}>
              By submitting, you confirm that all information provided is accurate and truthful. 
              False information may result in account suspension.
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmitKYC}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Submit for Verification</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderPersonalInfoStep();
      case 1:
        return renderDocumentsStep();
      case 2:
        return renderVerificationStep();
      case 3:
        return renderReviewStep();
      default:
        return renderPersonalInfoStep();
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1E40AF', '#3B82F6']} style={styles.header}>
        <Text style={styles.headerTitle}>KYC Verification</Text>
        <Text style={styles.headerSubtitle}>
          Complete identity verification to access all platform features
        </Text>
      </LinearGradient>

      {renderStepIndicator()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCurrentStep()}
      </ScrollView>

      {currentStep < 3 && (
        <View style={styles.navigation}>
          {currentStep > 0 && (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setCurrentStep(currentStep - 1)}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.nextButton}
            onPress={() => setCurrentStep(currentStep + 1)}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === 2 ? 'Review' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#F9FAFB',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#1E40AF',
  },
  stepCircleCompleted: {
    backgroundColor: '#10B981',
  },
  stepNumber: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  stepLineCompleted: {
    backgroundColor: '#10B981',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContent: {
    paddingVertical: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 24,
  },
  formSection: {
    gap: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  addressSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 16,
  },
  documentsGrid: {
    gap: 16,
  },
  documentCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentName: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginLeft: 8,
  },
  documentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
  },
  documentStatusUploaded: {
    backgroundColor: '#DBEAFE',
  },
  documentStatusVerified: {
    backgroundColor: '#D1FAE5',
  },
  documentStatusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#F59E0B',
  },
  documentStatusTextUploaded: {
    color: '#1E40AF',
  },
  documentStatusTextVerified: {
    color: '#059669',
  },
  documentPreview: {
    alignItems: 'center',
  },
  documentImage: {
    width: 120,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  reuploadButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1E40AF',
  },
  reuploadButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#1E40AF',
  },
  uploadButton: {
    alignItems: 'center',
    paddingVertical: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  uploadButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1E40AF',
    marginTop: 8,
  },
  uploadButtonSubtext: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
  },
  verificationSection: {
    alignItems: 'center',
  },
  verificationCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  verificationTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  verificationText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  verificationButton: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  verificationButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 8,
    width: '100%',
  },
  securityNoteText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#059669',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  reviewSection: {
    gap: 16,
  },
  reviewCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewCardTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  reviewInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  reviewLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  reviewValue: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  reviewDocumentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewDocumentText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#10B981',
    marginLeft: 4,
  },
  submitSection: {
    marginTop: 20,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  disclaimerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#F59E0B',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#1E40AF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  nextButton: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});
