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
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Info
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { useCamera } from '../hooks/useCamera';
import { useDocumentPicker } from '../hooks/useDocumentPicker';
import { diditKYCService, DiditKYCSession, DiditDocument, DiditVerificationResult } from '../services/diditKYC';

interface KYCStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  completed: boolean;
}

interface PersonalInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  phoneNumber: string;
  occupation: string;
  employerName: string;
  annualIncome: string;
  sourceOfFunds: string;
}

export const EnhancedKYCVerification: React.FC = () => {
  const { user, isDemoMode, demoAccount } = useAuth();
  const { requestCameraPermission, takePicture } = useCamera();
  const { pickDocument } = useDocumentPicker();

  const [currentStep, setCurrentStep] = useState(0);
  const [kycSession, setKycSession] = useState<DiditKYCSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string>('');
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
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
    employerName: '',
    annualIncome: '',
    sourceOfFunds: '',
  });

  const kycSteps: KYCStep[] = [
    {
      id: 'personal_info',
      title: 'Personal Information',
      description: 'Provide your basic personal details',
      icon: User,
      completed: false,
    },
    {
      id: 'document_verification',
      title: 'Document Verification',
      description: 'Upload government-issued ID and proof of address',
      icon: FileText,
      completed: false,
    },
    {
      id: 'biometric_verification',
      title: 'Identity Verification',
      description: 'Take a selfie for identity confirmation',
      icon: Camera,
      completed: false,
    },
    {
      id: 'review',
      title: 'Review & Submit',
      description: 'Review your information and submit for approval',
      icon: Shield,
      completed: false,
    },
  ];

  useEffect(() => {
    initializeKYC();
  }, [user]);

  const initializeKYC = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      let userId = user.id || user.email || 'demo_user';
      
      // Auto-approve demo accounts
      if (isDemoMode && demoAccount) {
        const approvedKYC = await diditKYCService.autoApproveDemoAccount(userId, demoAccount.role);
        setKycSession(approvedKYC);
        Alert.alert(
          'Demo Account KYC',
          'Your demo account has been automatically verified with all KYC requirements met.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }

      // Initialize or get existing KYC session
      let existingSession = await diditKYCService.getKYCSession(userId);
      if (!existingSession) {
        existingSession = await diditKYCService.initializeKYCSession(userId);
      } else {
        // Check for updates from Didit API
        existingSession = await diditKYCService.getSessionStatus(userId) || existingSession;
      }
      
      setKycSession(existingSession);
      
      // Extract personal info from Didit if available
      const extractedInfo = diditKYCService.getExtractedPersonalInfo(existingSession);
      if (extractedInfo) {
        setPersonalInfo({
          ...personalInfo,
          firstName: extractedInfo.firstName || '',
          lastName: extractedInfo.lastName || '',
          dateOfBirth: extractedInfo.dateOfBirth || '',
          nationality: extractedInfo.nationality || '',
        });
      }
    } catch (error) {
      console.error('KYC initialization error:', error);
      Alert.alert('Error', 'Failed to initialize KYC verification. Please check your internet connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePersonalInfoSubmit = async () => {
    if (!user || !kycSession) return;

    // Basic validation
    if (!personalInfo.firstName || !personalInfo.lastName || !personalInfo.dateOfBirth) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      // Personal info is stored locally, we'll use it when submitting documents
      // Move to next step - document verification
      setCurrentStep(1);
    } catch (error) {
      console.error('Personal info validation error:', error);
      Alert.alert('Error', 'Failed to validate personal information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentUpload = async (documentId: string, method: 'camera' | 'gallery') => {
    if (!user || !kycSession) return;

    try {
      let result;
      if (method === 'camera') {
        const permission = await requestCameraPermission();
        if (!permission) {
          Alert.alert('Permission Required', 'Camera permission is required to take photos');
          return;
        }
        result = await takePicture();
      } else {
        result = await pickDocument(['image/*']);
      }

      if (result && !result.cancelled && result.uri) {
        setIsLoading(true);
        setVerificationStatus('Uploading document to Didit for verification...');

        const userId = user.id || user.email || 'demo_user';
        
        // Determine document type for Didit
        let diditDocumentType = 'government_id';
        if (documentId === 'proof_address') {
          diditDocumentType = 'proof_of_address';
        }

        try {
          // Upload and verify document with Didit
          const updatedSession = await diditKYCService.verifyDocument(
            userId,
            documentId,
            result.uri,
            diditDocumentType
          );
          
          setKycSession(updatedSession);
          
          // Check verification result
          const document = updatedSession.documents.find(doc => doc.id === documentId);
          if (document?.verificationData) {
            const confidence = document.verificationData.confidence;
            const status = document.verificationData.status;
            
            if (status === 'approved' && confidence > 0.8) {
              Alert.alert(
                'Document Verified ✓',
                `Your ${document.name} has been successfully verified with ${Math.round(confidence * 100)}% confidence.`,
                [{ text: 'OK' }]
              );
            } else if (status === 'rejected') {
              Alert.alert(
                'Document Verification Failed',
                `Your ${document.name} could not be verified. Please ensure the document is clear, complete, and valid.`,
                [{ text: 'Retry', onPress: () => handleDocumentUpload(documentId, method) }]
              );
            } else {
              setVerificationStatus('Document uploaded. Verification in progress...');
            }
          }
        } catch (error) {
          console.error('Document verification error:', error);
          Alert.alert(
            'Verification Error',
            'Failed to verify document with Didit. Please check your internet connection and try again.',
            [{ text: 'Retry', onPress: () => handleDocumentUpload(documentId, method) }]
          );
        }
      }
    } catch (error) {
      console.error('Document upload error:', error);
      Alert.alert('Error', 'Failed to process document');
    } finally {
      setIsLoading(false);
      setVerificationStatus('');
    }
  };
        setIsLoading(true);
        const userId = user.id || user.email || 'demo_user';
        const updatedKYC = await freeKYCService.processDocument(userId, documentId, result.uri, result.base64);
        setKycData(updatedKYC);

        const document = updatedKYC.documents.find(doc => doc.id === documentId);
        if (document?.status === 'verified') {
          Alert.alert('Success', 'Document verified successfully!');
        } else if (document?.status === 'rejected') {
          Alert.alert('Verification Failed', 'Document could not be verified. Please ensure the image is clear and try again.');
        }
      }
    } catch (error) {
      console.error('Document upload error:', error);
      Alert.alert('Upload Failed', 'Failed to process document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricVerification = async () => {
    if (!user || !kycSession) return;

    try {
      const permission = await requestCameraPermission();
      if (!permission) {
        Alert.alert('Permission Required', 'Camera permission is required for identity verification');
        return;
      }

      Alert.alert(
        'Identity Verification',
        'Please take a clear selfie for face verification and liveness detection. Make sure your face is well-lit and clearly visible.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Take Selfie', 
            onPress: async () => {
              const result = await takePicture();
              if (result && !result.cancelled && result.uri) {
                setIsLoading(true);
                setVerificationStatus('Verifying your identity with Didit...');

                try {
                  const userId = user.id || user.email || 'demo_user';
                  const updatedSession = await diditKYCService.verifyBiometric(userId, result.uri);
                  setKycSession(updatedSession);

                  const biometricResult = updatedSession.biometricResult;
                  if (biometricResult) {
                    if (biometricResult.status === 'approved' && 
                        biometricResult.livenessCheck && 
                        biometricResult.livenessScore > 0.8) {
                      Alert.alert(
                        'Identity Verified ✓',
                        `Your identity has been successfully verified!\n\nLiveness Score: ${Math.round(biometricResult.livenessScore * 100)}%\nFace Match: ${biometricResult.faceMatchScore ? Math.round(biometricResult.faceMatchScore * 100) + '%' : 'N/A'}`,
                        [{ text: 'Continue', onPress: () => setCurrentStep(3) }]
                      );
                    } else if (biometricResult.status === 'rejected') {
                      Alert.alert(
                        'Identity Verification Failed',
                        'We could not verify your identity. Please ensure good lighting and that your face is clearly visible.',
                        [{ text: 'Retry', onPress: () => handleBiometricVerification() }]
                      );
                    } else {
                      setVerificationStatus('Biometric verification in progress...');
                    }
                  }
                } catch (error) {
                  console.error('Biometric verification error:', error);
                  Alert.alert(
                    'Verification Error',
                    'Failed to verify your identity with Didit. Please check your internet connection and try again.',
                    [{ text: 'Retry', onPress: () => handleBiometricVerification() }]
                  );
                }
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Biometric verification error:', error);
      Alert.alert('Verification Failed', 'Failed to complete identity verification. Please try again.');
    } finally {
      setIsLoading(false);
      setVerificationStatus('');
    }
  };

  const handleFinalSubmission = async () => {
    if (!user || !kycSession) return;

    setIsLoading(true);
    setVerificationStatus('Finalizing your KYC verification...');
    
    try {
      const userId = user.id || user.email || 'demo_user';
      const finalSession = await diditKYCService.finalizeKYCSession(userId);
      setKycSession(finalSession);

      if (finalSession.status === 'completed' && finalSession.overallScore >= 80) {
        Alert.alert(
          'KYC Approved! ✓',
          `Your identity verification has been completed successfully with a score of ${finalSession.overallScore}%.\n\nYou now have full access to all platform features.`,
          [{ text: 'Continue', onPress: () => router.back() }]
        );
      } else if (finalSession.status === 'in_progress') {
        Alert.alert(
          'Under Review',
          'Your verification is under manual review. You will be notified once the review is completed.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert(
          'Verification Incomplete',
          `Your KYC verification needs attention (Score: ${finalSession.overallScore}%). Please ensure all documents are verified and try again.`,
          [{ text: 'Review', onPress: () => setCurrentStep(0) }]
        );
      }
    } catch (error) {
      console.error('Final submission error:', error);
      Alert.alert('Error', 'Failed to submit verification. Please try again.');
    } finally {
      setIsLoading(false);
      setVerificationStatus('');
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {kycSteps.map((step, index) => {
        const isActive = currentStep === index;
        const isCompleted = getStepCompletion(step.id);
        
        return (
          <View key={step.id} style={styles.stepContainer}>
            <View style={[
              styles.stepCircle,
              isActive && styles.stepCircleActive,
              isCompleted && styles.stepCircleCompleted,
            ]}>
              {isCompleted ? (
                <Check size={16} color="white" />
              ) : (
                <Text style={[styles.stepNumber, isActive && styles.stepNumberActive]}>
                  {index + 1}
                </Text>
              )}
            </View>
            {index < kycSteps.length - 1 && (
              <View style={[styles.stepLine, isCompleted && styles.stepLineCompleted]} />
            )}
          </View>
        );
      })}
    </View>
  );

  // Helper function to check step completion
  const getStepCompletion = (stepId: string): boolean => {
    if (!kycSession) return false;
    
    switch (stepId) {
      case 'personal_info':
        return personalInfo.firstName !== '' && personalInfo.lastName !== '';
      case 'document_verification':
        return kycSession.documents.some(doc => doc.status === 'verified');
      case 'biometric_verification':
        return kycSession.biometricResult?.status === 'approved';
      case 'review':
        return kycSession.status === 'completed';
      default:
        return false;
    }
  };

  const renderPersonalInfoStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Personal Information</Text>
      <Text style={styles.stepDescription}>
        Please provide accurate personal information as it appears on your government-issued ID.
      </Text>

      <View style={styles.inputRow}>
        <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>First Name *</Text>
          <TextInput
            style={styles.textInput}
            value={personalInfo.firstName}
            onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, firstName: text }))}
            placeholder="Enter first name"
          />
        </View>
        <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>Last Name *</Text>
          <TextInput
            style={styles.textInput}
            value={personalInfo.lastName}
            onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, lastName: text }))}
            placeholder="Enter last name"
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Date of Birth *</Text>
        <TextInput
          style={styles.textInput}
          value={personalInfo.dateOfBirth}
          onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, dateOfBirth: text }))}
          placeholder="YYYY-MM-DD"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Nationality *</Text>
        <TextInput
          style={styles.textInput}
          value={personalInfo.nationality}
          onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, nationality: text }))}
          placeholder="Enter nationality"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Phone Number *</Text>
        <TextInput
          style={styles.textInput}
          value={personalInfo.phoneNumber}
          onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, phoneNumber: text }))}
          placeholder="+1234567890"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Occupation</Text>
        <TextInput
          style={styles.textInput}
          value={personalInfo.occupation}
          onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, occupation: text }))}
          placeholder="Enter occupation"
        />
      </View>

      <Text style={styles.sectionTitle}>Address Information</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Street Address *</Text>
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

      <View style={styles.inputRow}>
        <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>City *</Text>
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
        <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>State</Text>
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

      <View style={styles.inputRow}>
        <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>ZIP Code</Text>
          <TextInput
            style={styles.textInput}
            value={personalInfo.address.zipCode}
            onChangeText={(text) => setPersonalInfo(prev => ({ 
              ...prev, 
              address: { ...prev.address, zipCode: text }
            }))}
            placeholder="12345"
          />
        </View>
        <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>Country *</Text>
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
  );

  const renderDocumentStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Document Verification</Text>
      <Text style={styles.stepDescription}>
        Upload clear photos of your documents. Ensure all text is readable and the document is fully visible.
      </Text>

      {kycSession?.documents.map((document) => (
        <View key={document.id} style={styles.documentCard}>
          <View style={styles.documentHeader}>
            <FileText size={24} color="#2563eb" />
            <View style={styles.documentInfo}>
              <Text style={styles.documentName}>{document.name}</Text>
              <Text style={styles.documentStatus}>
                {document.status === 'verified' ? 'Verified ✓' : 
                 document.status === 'processing' ? 'Processing...' :
                 document.status === 'rejected' ? 'Rejected ✗' : 'Pending Upload'}
              </Text>
              {document.verificationData?.confidence && (
                <Text style={styles.confidenceScore}>
                  Confidence: {Math.round(document.verificationData.confidence * 100)}%
                </Text>
              )}
            </View>
            <View style={styles.documentStatusIcon}>
              {document.status === 'verified' && <CheckCircle size={20} color="#10b981" />}
              {document.status === 'processing' && <Clock size={20} color="#f59e0b" />}
              {document.status === 'rejected' && <XCircle size={20} color="#ef4444" />}
              {document.status === 'pending' && <AlertCircle size={20} color="#6b7280" />}
            </View>
          </View>

          {document.uri && (
            <Image source={{ uri: document.uri }} style={styles.documentPreview} />
          )}

          {document.status === 'pending' || document.status === 'rejected' ? (
            <View style={styles.documentActions}>
              <TouchableOpacity
                style={styles.documentButton}
                onPress={() => showDocumentOptions(document.id)}
              >
                <Camera size={16} color="white" />
                <Text style={styles.documentButtonText}>Upload Document</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {document.status === 'verified' && document.verificationData?.extractedData && (
            <View style={styles.extractedDataContainer}>
              <Text style={styles.extractedDataTitle}>Verified Information:</Text>
              {document.verificationData.extractedData.fullName && (
                <Text style={styles.extractedDataText}>Name: {document.verificationData.extractedData.fullName}</Text>
              )}
              {document.verificationData.extractedData.documentNumber && (
                <Text style={styles.extractedDataText}>Document #: {document.verificationData.extractedData.documentNumber}</Text>
              )}
            </View>
          )}
        </View>
      ))}
    </View>
  );

  const renderBiometricStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Identity Verification</Text>
      <Text style={styles.stepDescription}>
        Take a selfie to verify your identity. This helps us confirm that you are the person in your ID document.
      </Text>

      <View style={styles.biometricCard}>
        <View style={styles.biometricIcon}>
          <Camera size={48} color="#2563eb" />
        </View>
        <Text style={styles.biometricTitle}>Selfie Verification</Text>
        <Text style={styles.biometricInstructions}>
          • Look directly at the camera{'\n'}
          • Ensure good lighting{'\n'}
          • Remove glasses or hats{'\n'}
          • Keep a neutral expression
        </Text>

        {kycSession?.biometricResult && (
          <View style={styles.biometricResultContainer}>
            <Text style={styles.biometricResultTitle}>Verification Results:</Text>
            <Text style={styles.biometricResultText}>
              Status: {kycSession.biometricResult.status}
            </Text>
            <Text style={styles.biometricResultText}>
              Liveness Score: {Math.round(kycSession.biometricResult.livenessScore * 100)}%
            </Text>
            {kycSession.biometricResult.faceMatchScore && (
              <Text style={styles.biometricResultText}>
                Face Match: {Math.round(kycSession.biometricResult.faceMatchScore * 100)}%
              </Text>
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.biometricButton}
          onPress={handleBiometricVerification}
          disabled={isLoading}
        >
          <Camera size={20} color="white" />
          <Text style={styles.biometricButtonText}>
            {kycSession?.biometricResult ? 'Retake Selfie' : 'Take Selfie'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderReviewStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review & Submit</Text>
      <Text style={styles.stepDescription}>
        Please review your information before submitting for verification.
      </Text>

      <View style={styles.reviewCard}>
        <Text style={styles.reviewTitle}>Personal Information</Text>
        <Text style={styles.reviewText}>
          {personalInfo.firstName} {personalInfo.lastName}{'\n'}
          {personalInfo.dateOfBirth}{'\n'}
          {personalInfo.nationality}{'\n'}
          {personalInfo.phoneNumber}
        </Text>
      </View>

      <View style={styles.reviewCard}>
        <Text style={styles.reviewTitle}>Address</Text>
        <Text style={styles.reviewText}>
          {personalInfo.address.street}{'\n'}
          {personalInfo.address.city}, {personalInfo.address.state} {personalInfo.address.zipCode}{'\n'}
          {personalInfo.address.country}
        </Text>
      </View>

      <View style={styles.reviewCard}>
        <Text style={styles.reviewTitle}>Verification Status</Text>
        <Text style={styles.reviewText}>
          Overall Score: {kycSession?.overallScore || 0}%{'\n'}
          Documents Verified: {kycSession?.documents.filter(doc => doc.status === 'verified').length || 0}/{kycSession?.documents.length || 0}{'\n'}
          Biometric Status: {kycSession?.biometricResult?.status || 'Pending'}{'\n'}
          Session Status: {kycSession?.status || 'Created'}
        </Text>
      </View>

      {kycSession?.complianceFlags && kycSession.complianceFlags.length > 0 && (
        <View style={styles.warningCard}>
          <AlertCircle size={20} color="#f59e0b" />
          <Text style={styles.warningText}>
            Compliance Issues: {kycSession.complianceFlags.join(', ')}
          </Text>
        </View>
      )}
    </View>
  );

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

  const canProceedToNext = () => {
    if (currentStep === 0) {
      return personalInfo.firstName && personalInfo.lastName && personalInfo.dateOfBirth && 
             personalInfo.nationality && personalInfo.phoneNumber && personalInfo.address.street &&
             personalInfo.address.city && personalInfo.address.country;
    }
    if (currentStep === 1) {
      return kycSession?.documents.some(doc => doc.status === 'verified');
    }
    if (currentStep === 2) {
      return kycSession?.biometricResult?.status === 'approved';
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 0) {
      handlePersonalInfoSubmit();
    } else if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      handleFinalSubmission();
    }
  };

  if (isLoading && !kycSession) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Initializing KYC Verification...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1e40af', '#3b82f6']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KYC Verification</Text>
        <Text style={styles.headerSubtitle}>
          {kycSteps[currentStep]?.title || 'Identity Verification'}
        </Text>
        
        {/* Add verification status indicator */}
        {verificationStatus && (
          <View style={styles.statusIndicator}>
            <Text style={styles.statusText}>{verificationStatus}</Text>
          </View>
        )}
      </LinearGradient>

      {renderStepIndicator()}

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollContent}>
          {currentStep === 0 && renderPersonalInfoStep()}
          {currentStep === 1 && renderDocumentStep()}
          {currentStep === 2 && renderBiometricStep()}
          {currentStep === 3 && renderReviewStep()}
        </ScrollView>

        <View style={styles.navigationButtons}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={styles.backNavigationButton}
              onPress={() => setCurrentStep(currentStep - 1)}
            >
              <ArrowLeft size={20} color="#2563eb" />
              <Text style={styles.backNavigationText}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.nextButton, (!canProceedToNext() || isLoading) && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!canProceedToNext() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Text style={styles.nextButtonText}>
                  {currentStep === 3 ? 'Submit for Review' : 'Continue'}
                </Text>
                <ArrowRight size={20} color="white" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  backButton: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'white',
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#2563eb',
  },
  stepCircleCompleted: {
    backgroundColor: '#10b981',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748b',
  },
  stepNumberActive: {
    color: 'white',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 8,
  },
  stepLineCompleted: {
    backgroundColor: '#10b981',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 24,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  documentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  documentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  documentStatus: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  documentStatusIcon: {
    marginLeft: 8,
  },
  documentPreview: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 12,
  },
  documentActions: {
    flexDirection: 'row',
  },
  documentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  documentButtonText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 8,
  },
  biometricCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  biometricIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  biometricTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  biometricInstructions: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  biometricPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  biometricButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  reviewCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  warningCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
    marginLeft: 12,
    fontWeight: '500',
  },
  warningItem: {
    fontSize: 12,
    color: '#92400e',
    marginLeft: 12,
    marginTop: 4,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  backNavigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backNavigationText: {
    color: '#2563eb',
    fontWeight: '500',
    marginLeft: 8,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    marginLeft: 16,
  },
  nextButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  nextButtonText: {
    color: 'white',
    fontWeight: '600',
    marginRight: 8,
  },
  confidenceScore: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
    marginTop: 2,
  },
  extractedDataContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0ea5e9',
  },
  extractedDataTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0c4a6e',
    marginBottom: 8,
  },
  extractedDataText: {
    fontSize: 13,
    color: '#0c4a6e',
    marginBottom: 4,
  },
  biometricResultContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  biometricResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 8,
  },
  biometricResultText: {
    fontSize: 14,
    color: '#166534',
    marginBottom: 4,
  },
  statusIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
});

export default EnhancedKYCVerification;
