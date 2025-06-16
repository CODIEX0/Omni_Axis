import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Home, 
  DollarSign, 
  FileText, 
  Camera, 
  Upload, 
  Check, 
  ArrowRight,
  Info,
  Shield,
  Globe,
  Users
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useCamera } from '../../hooks/useCamera';
import { useDocumentPicker } from '../../hooks/useDocumentPicker';
import { useTokenizeAsset } from '../../hooks/useTokenizeAsset';
import { useTypedSelector } from '../../hooks/useTypedSelector';
import { FloatingChatButton } from '../../components/FloatingChatButton';

interface AssetType {
  id: string;
  name: string;
  description: string;
  icon: string;
  minValue: number;
  maxValue: number;
  requiredDocuments: string[];
  examples: string[];
  color: string;
}

interface TokenizationStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
}

export default function TokenizeNewScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType | null>(null);
  const [assetDetails, setAssetDetails] = useState({
    name: '',
    description: '',
    location: '',
    totalValue: '',
    tokenSupply: '',
    tokenPrice: '',
    minimumInvestment: '',
    expectedReturn: '',
    duration: '',
  });
  const [documents, setDocuments] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, isAuthenticated } = useTypedSelector(state => state.auth);
  const { status: kycStatus } = useTypedSelector(state => state.kyc);
  const { requestPermission, takePicture } = useCamera();
  const { pickDocument } = useDocumentPicker();
  const { tokenizeAsset, isLoading } = useTokenizeAsset();

  const assetTypes: AssetType[] = [
    {
      id: 'real_estate',
      name: 'Real Estate',
      description: 'Properties, land, and real estate investments',
      icon: '🏢',
      minValue: 100000,
      maxValue: 100000000,
      requiredDocuments: ['property_deed', 'valuation_report', 'legal_documents'],
      examples: ['Commercial Property', 'Residential Building', 'Land', 'REIT'],
      color: '#1E40AF',
    },
    {
      id: 'bonds',
      name: 'Bonds & Securities',
      description: 'Government and corporate bonds, treasury bills',
      icon: '📊',
      minValue: 10000,
      maxValue: 50000000,
      requiredDocuments: ['bond_certificate', 'credit_rating', 'prospectus'],
      examples: ['Corporate Bonds', 'Government Bonds', 'Treasury Bills', 'Municipal Bonds'],
      color: '#059669',
    },
    {
      id: 'invoices',
      name: 'Invoices & Receivables',
      description: 'Trade finance and invoice factoring',
      icon: '🧾',
      minValue: 5000,
      maxValue: 10000000,
      requiredDocuments: ['invoice_copy', 'debtor_creditcheck', 'trade_agreement'],
      examples: ['Trade Invoices', 'Accounts Receivable', 'Purchase Orders', 'Letters of Credit'],
      color: '#7C3AED',
    },
    {
      id: 'commodities',
      name: 'Commodities',
      description: 'Physical commodities and precious metals',
      icon: '🥇',
      minValue: 25000,
      maxValue: 25000000,
      requiredDocuments: ['commodity_certificate', 'storage_receipt', 'quality_assurance'],
      examples: ['Gold', 'Silver', 'Oil', 'Agricultural Products', 'Precious Metals'],
      color: '#F59E0B',
    },
    {
      id: 'art',
      name: 'Art & Collectibles',
      description: 'Fine art, collectibles, and luxury items',
      icon: '🎨',
      minValue: 10000,
      maxValue: 50000000,
      requiredDocuments: ['authenticity_certificate', 'appraisal_report', 'provenance_history'],
      examples: ['Paintings', 'Sculptures', 'Rare Books', 'Wine Collections', 'Vintage Cars'],
      color: '#EF4444',
    },
    {
      id: 'intellectual_property',
      name: 'Intellectual Property',
      description: 'Patents, trademarks, and IP rights',
      icon: '💡',
      minValue: 50000,
      maxValue: 20000000,
      requiredDocuments: ['patent_certificate', 'valuation_report', 'legal_opinion'],
      examples: ['Patents', 'Trademarks', 'Copyrights', 'Software Licenses', 'Brand Rights'],
      color: '#8B5CF6',
    },
  ];

  const tokenizationSteps: TokenizationStep[] = [
    {
      id: 'asset_type',
      title: 'Select Asset Type',
      description: 'Choose the type of asset you want to tokenize',
      completed: !!selectedAssetType,
      required: true,
    },
    {
      id: 'asset_details',
      title: 'Asset Details',
      description: 'Provide detailed information about your asset',
      completed: assetDetails.name && assetDetails.totalValue,
      required: true,
    },
    {
      id: 'tokenomics',
      title: 'Token Configuration',
      description: 'Set up token supply and pricing',
      completed: assetDetails.tokenSupply && assetDetails.tokenPrice,
      required: true,
    },
    {
      id: 'documents',
      title: 'Documentation',
      description: 'Upload required legal and financial documents',
      completed: selectedAssetType ? selectedAssetType.requiredDocuments.every(doc => documents[doc]) : false,
      required: true,
    },
    {
      id: 'review',
      title: 'Review & Submit',
      description: 'Review your information and submit for tokenization',
      completed: false,
      required: true,
    },
  ];

  useEffect(() => {
    // Check if user is authenticated and KYC verified
    if (!isAuthenticated) {
      Alert.alert(
        'Authentication Required',
        'Please log in to tokenize assets.',
        [{ text: 'OK', onPress: () => router.push('/(auth)/login') }]
      );
      return;
    }

    if (kycStatus !== 'verified') {
      Alert.alert(
        'KYC Verification Required',
        'You must complete KYC verification before tokenizing assets.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Complete KYC', onPress: () => router.push('/(auth)/kyc') },
        ]
      );
      return;
    }
  }, [isAuthenticated, kycStatus]);

  const handleAssetTypeSelect = (assetType: AssetType) => {
    setSelectedAssetType(assetType);
    setCurrentStep(1);
  };

  const handleDocumentUpload = async (documentType: string) => {
    try {
      Alert.alert(
        'Upload Document',
        'Choose how you would like to upload your document',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: () => uploadDocument(documentType, 'camera') },
          { text: 'Choose File', onPress: () => uploadDocument(documentType, 'file') },
        ]
      );
    } catch (error) {
      console.error('Document upload error:', error);
      Alert.alert('Upload Failed', 'Failed to upload document. Please try again.');
    }
  };

  const uploadDocument = async (documentType: string, method: 'camera' | 'file') => {
    try {
      let result;
      
      if (method === 'camera') {
        const permission = await requestCameraPermission();
        if (!permission) {
          Alert.alert('Camera Permission', 'Camera access is required to take photos.');
          return;
        }
        result = await takePicture();
      } else {
        result = await pickDocument(['image/*', 'application/pdf']);
      }

      if (result && !result.cancelled) {
        setDocuments(prev => ({
          ...prev,
          [documentType]: result.uri,
        }));
        Alert.alert('Success', 'Document uploaded successfully!');
      }
    } catch (error) {
      console.error('Document upload error:', error);
      Alert.alert('Upload Failed', 'Failed to upload document. Please try again.');
    }
  };

  const calculateTokenPrice = () => {
    const totalValue = parseFloat(assetDetails.totalValue);
    const tokenSupply = parseFloat(assetDetails.tokenSupply);
    
    if (totalValue && tokenSupply && tokenSupply > 0) {
      const price = totalValue / tokenSupply;
      setAssetDetails(prev => ({ ...prev, tokenPrice: price.toFixed(2) }));
    }
  };

  const handleSubmitTokenization = async () => {
    if (isSubmitting || isLoading) return;

    // Validate all required information
    const missingSteps = tokenizationSteps.filter(step => step.required && !step.completed);
    if (missingSteps.length > 0) {
      Alert.alert(
        'Incomplete Information',
        `Please complete: ${missingSteps.map(step => step.title).join(', ')}`,
        [{ text: 'OK' }]
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const tokenizationData = {
        assetType: selectedAssetType!.id,
        name: assetDetails.name,
        description: assetDetails.description,
        location: assetDetails.location,
        totalValue: parseFloat(assetDetails.totalValue),
        tokenSupply: parseFloat(assetDetails.tokenSupply),
        tokenPrice: parseFloat(assetDetails.tokenPrice),
        minimumInvestment: parseFloat(assetDetails.minimumInvestment),
        expectedReturn: assetDetails.expectedReturn,
        duration: assetDetails.duration,
        documents,
        creator: user!.id,
      };

      await tokenizeAsset(tokenizationData);

      Alert.alert(
        'Tokenization Submitted',
        'Your asset has been submitted for tokenization. You will receive a notification once the review is complete.',
        [
          { 
            text: 'OK', 
            onPress: () => router.replace('/(tabs)/portfolio')
          }
        ]
      );
    } catch (error: any) {
      console.error('Tokenization error:', error);
      Alert.alert(
        'Tokenization Failed',
        error.message || 'Failed to submit asset for tokenization. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {tokenizationSteps.map((step, index) => (
        <View key={step.id} style={styles.stepItem}>
          <View style={[
            styles.stepCircle,
            currentStep === index && styles.stepCircleActive,
            step.completed && styles.stepCircleCompleted,
          ]}>
            {step.completed ? (
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
          {index < tokenizationSteps.length - 1 && (
            <View style={[
              styles.stepLine,
              step.completed && styles.stepLineCompleted,
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderAssetTypeSelection = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Select Asset Type</Text>
      <Text style={styles.stepDescription}>
        Choose the type of asset you want to tokenize. Each asset type has specific requirements and documentation needs.
      </Text>

      <View style={styles.assetTypeGrid}>
        {assetTypes.map((assetType) => (
          <TouchableOpacity
            key={assetType.id}
            style={[
              styles.assetTypeCard,
              { borderColor: assetType.color },
              selectedAssetType?.id === assetType.id && styles.assetTypeCardSelected,
            ]}
            onPress={() => handleAssetTypeSelect(assetType)}
          >
            <View style={[styles.assetTypeIcon, { backgroundColor: assetType.color + '20' }]}>
              <Text style={styles.assetTypeEmoji}>{assetType.icon}</Text>
            </View>
            
            <Text style={styles.assetTypeName}>{assetType.name}</Text>
            <Text style={styles.assetTypeDescription}>{assetType.description}</Text>
            
            <View style={styles.assetTypeDetails}>
              <Text style={styles.assetTypeRange}>
                ${assetType.minValue.toLocaleString()} - ${assetType.maxValue.toLocaleString()}
              </Text>
              <Text style={styles.assetTypeExamples}>
                {assetType.examples.slice(0, 2).join(', ')}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderAssetDetails = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Asset Details</Text>
      <Text style={styles.stepDescription}>
        Provide comprehensive information about your {selectedAssetType?.name.toLowerCase()}.
      </Text>

      <View style={styles.formSection}>
        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Asset Name *</Text>
          <TextInput
            style={styles.textInput}
            value={assetDetails.name}
            onChangeText={(text) => setAssetDetails(prev => ({ ...prev, name: text }))}
            placeholder="Enter a descriptive name for your asset"
          />
        </View>

        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Description *</Text>
          <TextInput
            style={[styles.textInput, styles.textAreaInput]}
            value={assetDetails.description}
            onChangeText={(text) => setAssetDetails(prev => ({ ...prev, description: text }))}
            placeholder="Detailed description of the asset, its condition, and key features"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Location</Text>
          <TextInput
            style={styles.textInput}
            value={assetDetails.location}
            onChangeText={(text) => setAssetDetails(prev => ({ ...prev, location: text }))}
            placeholder="Physical location or jurisdiction"
          />
        </View>

        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Total Asset Value (USD) *</Text>
          <TextInput
            style={styles.textInput}
            value={assetDetails.totalValue}
            onChangeText={(text) => {
              setAssetDetails(prev => ({ ...prev, totalValue: text }));
              // Auto-calculate token price if supply is set
              if (assetDetails.tokenSupply) {
                setTimeout(calculateTokenPrice, 100);
              }
            }}
            placeholder="Enter the total value in USD"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Expected Annual Return</Text>
          <TextInput
            style={styles.textInput}
            value={assetDetails.expectedReturn}
            onChangeText={(text) => setAssetDetails(prev => ({ ...prev, expectedReturn: text }))}
            placeholder="e.g., 8% or 5-12%"
          />
        </View>

        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Investment Duration</Text>
          <TextInput
            style={styles.textInput}
            value={assetDetails.duration}
            onChangeText={(text) => setAssetDetails(prev => ({ ...prev, duration: text }))}
            placeholder="e.g., 2 years, 5-10 years"
          />
        </View>
      </View>
    </View>
  );

  const renderTokenomics = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Token Configuration</Text>
      <Text style={styles.stepDescription}>
        Configure how your asset will be divided into tokens and priced for investors.
      </Text>

      <View style={styles.formSection}>
        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Total Token Supply *</Text>
          <TextInput
            style={styles.textInput}
            value={assetDetails.tokenSupply}
            onChangeText={(text) => {
              setAssetDetails(prev => ({ ...prev, tokenSupply: text }));
              // Auto-calculate token price if total value is set
              if (assetDetails.totalValue) {
                setTimeout(calculateTokenPrice, 100);
              }
            }}
            placeholder="Number of tokens to create"
            keyboardType="numeric"
          />
          <Text style={styles.fieldHint}>
            This determines how the asset ownership will be divided
          </Text>
        </View>

        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Price per Token (USD) *</Text>
          <TextInput
            style={styles.textInput}
            value={assetDetails.tokenPrice}
            onChangeText={(text) => setAssetDetails(prev => ({ ...prev, tokenPrice: text }))}
            placeholder="Calculated automatically or enter manually"
            keyboardType="numeric"
          />
          <Text style={styles.fieldHint}>
            Automatically calculated: Total Value ÷ Token Supply
          </Text>
        </View>

        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Minimum Investment (USD)</Text>
          <TextInput
            style={styles.textInput}
            value={assetDetails.minimumInvestment}
            onChangeText={(text) => setAssetDetails(prev => ({ ...prev, minimumInvestment: text }))}
            placeholder="Minimum amount investors can purchase"
            keyboardType="numeric"
          />
        </View>

        {assetDetails.totalValue && assetDetails.tokenSupply && assetDetails.tokenPrice && (
          <View style={styles.tokenomicsPreview}>
            <Text style={styles.previewTitle}>Token Overview</Text>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Asset Value:</Text>
              <Text style={styles.previewValue}>${parseFloat(assetDetails.totalValue).toLocaleString()}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Total Tokens:</Text>
              <Text style={styles.previewValue}>{parseFloat(assetDetails.tokenSupply).toLocaleString()}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Price per Token:</Text>
              <Text style={styles.previewValue}>${parseFloat(assetDetails.tokenPrice).toFixed(2)}</Text>
            </View>
            {assetDetails.minimumInvestment && (
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Min. Investment:</Text>
                <Text style={styles.previewValue}>${parseFloat(assetDetails.minimumInvestment).toLocaleString()}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );

  const renderDocumentation = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Required Documentation</Text>
      <Text style={styles.stepDescription}>
        Upload the required documents for {selectedAssetType?.name.toLowerCase()} tokenization.
      </Text>

      <View style={styles.documentsSection}>
        {selectedAssetType?.requiredDocuments.map((docType) => (
          <View key={docType} style={styles.documentCard}>
            <View style={styles.documentHeader}>
              <FileText color="#374151" size={20} />
              <Text style={styles.documentName}>
                {docType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
              {documents[docType] && <Check color="#10B981" size={20} />}
            </View>

            <Text style={styles.documentDescription}>
              {getDocumentDescription(docType)}
            </Text>

            {documents[docType] ? (
              <View style={styles.documentUploaded}>
                <Text style={styles.documentUploadedText}>✓ Document uploaded</Text>
                <TouchableOpacity 
                  style={styles.reuploadButton}
                  onPress={() => handleDocumentUpload(docType)}
                >
                  <Text style={styles.reuploadButtonText}>Replace</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.uploadButton}
                onPress={() => handleDocumentUpload(docType)}
              >
                <Upload color="#1E40AF" size={20} />
                <Text style={styles.uploadButtonText}>Upload Document</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      <View style={styles.documentNote}>
        <Info color="#F59E0B" size={20} />
        <Text style={styles.documentNoteText}>
          All documents will be stored securely and encrypted. Only authorized personnel and regulators will have access for compliance purposes.
        </Text>
      </View>
    </View>
  );

  const renderReview = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review & Submit</Text>
      <Text style={styles.stepDescription}>
        Review all information before submitting your asset for tokenization.
      </Text>

      <View style={styles.reviewSection}>
        <View style={styles.reviewCard}>
          <Text style={styles.reviewCardTitle}>Asset Information</Text>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Type:</Text>
            <Text style={styles.reviewValue}>{selectedAssetType?.name}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Name:</Text>
            <Text style={styles.reviewValue}>{assetDetails.name}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Total Value:</Text>
            <Text style={styles.reviewValue}>${parseFloat(assetDetails.totalValue).toLocaleString()}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Location:</Text>
            <Text style={styles.reviewValue}>{assetDetails.location || 'Not specified'}</Text>
          </View>
        </View>

        <View style={styles.reviewCard}>
          <Text style={styles.reviewCardTitle}>Token Configuration</Text>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Total Supply:</Text>
            <Text style={styles.reviewValue}>{parseFloat(assetDetails.tokenSupply).toLocaleString()} tokens</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Price per Token:</Text>
            <Text style={styles.reviewValue}>${parseFloat(assetDetails.tokenPrice).toFixed(2)}</Text>
          </View>
          {assetDetails.minimumInvestment && (
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Min. Investment:</Text>
              <Text style={styles.reviewValue}>${parseFloat(assetDetails.minimumInvestment).toLocaleString()}</Text>
            </View>
          )}
        </View>

        <View style={styles.reviewCard}>
          <Text style={styles.reviewCardTitle}>Documentation</Text>
          {selectedAssetType?.requiredDocuments.map((docType) => (
            <View key={docType} style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>
                {docType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
              </Text>
              <View style={styles.reviewDocStatus}>
                <Check color="#10B981" size={16} />
                <Text style={styles.reviewDocText}>Uploaded</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.submitSection}>
          <View style={styles.submitNote}>
            <Shield color="#1E40AF" size={20} />
            <Text style={styles.submitNoteText}>
              Your asset will be reviewed by our compliance team. This process typically takes 3-5 business days. You'll receive updates via email and in-app notifications.
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, (isSubmitting || isLoading) && styles.submitButtonDisabled]}
            onPress={handleSubmitTokenization}
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting || isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Submit for Tokenization</Text>
                <ArrowRight color="#FFFFFF" size={20} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const getDocumentDescription = (docType: string): string => {
    const descriptions: Record<string, string> = {
      property_deed: 'Official document proving ownership of the property',
      valuation_report: 'Professional appraisal from a certified valuator',
      legal_documents: 'Title deed, mortgage documents, and legal certificates',
      bond_certificate: 'Official bond certificate or electronic confirmation',
      credit_rating: 'Credit rating report from recognized agency',
      prospectus: 'Official prospectus or offering memorandum',
      invoice_copy: 'Copy of the original invoice or trade document',
      debtor_creditcheck: 'Credit check report of the debtor/buyer',
      trade_agreement: 'Underlying trade agreement or contract',
      commodity_certificate: 'Certificate of authenticity and quality',
      storage_receipt: 'Warehouse receipt or storage confirmation',
      quality_assurance: 'Quality assurance and testing reports',
      authenticity_certificate: 'Certificate of authenticity from recognized authority',
      appraisal_report: 'Professional appraisal from certified appraiser',
      provenance_history: 'Complete ownership history and provenance',
      patent_certificate: 'Official patent certificate or trademark registration',
    };
    
    return descriptions[docType] || 'Required supporting documentation';
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderAssetTypeSelection();
      case 1:
        return renderAssetDetails();
      case 2:
        return renderTokenomics();
      case 3:
        return renderDocumentation();
      case 4:
        return renderReview();
      default:
        return renderAssetTypeSelection();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#1E40AF', '#3B82F6']} style={styles.header}>
        <Text style={styles.headerTitle}>Tokenize Asset</Text>
        <Text style={styles.headerSubtitle}>
          Convert your real-world assets into digital tokens
        </Text>
      </LinearGradient>

      {renderStepIndicator()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCurrentStep()}
      </ScrollView>

      {currentStep < 4 && currentStep > 0 && (
        <View style={styles.navigation}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setCurrentStep(currentStep - 1)}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.nextButton,
              !tokenizationSteps[currentStep].completed && styles.nextButtonDisabled
            ]}
            onPress={() => setCurrentStep(currentStep + 1)}
            disabled={!tokenizationSteps[currentStep].completed}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === 3 ? 'Review' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <FloatingChatButton 
        context={{
          currentScreen: 'tokenize',
          assetType: selectedAssetType?.name,
          userRole: 'issuer',
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 20,
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
    width: 30,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 6,
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
  assetTypeGrid: {
    gap: 16,
  },
  assetTypeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  assetTypeCardSelected: {
    borderColor: '#1E40AF',
    backgroundColor: '#EFF6FF',
  },
  assetTypeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  assetTypeEmoji: {
    fontSize: 24,
  },
  assetTypeName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  assetTypeDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 12,
  },
  assetTypeDetails: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  assetTypeRange: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 4,
  },
  assetTypeExamples: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  formSection: {
    gap: 16,
  },
  formField: {
    marginBottom: 16,
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
  textAreaInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  fieldHint: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
  },
  tokenomicsPreview: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  previewValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  documentsSection: {
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
    marginBottom: 8,
  },
  documentName: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  documentDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 12,
  },
  documentUploaded: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  documentUploadedText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#10B981',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1E40AF',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1E40AF',
    marginLeft: 8,
  },
  documentNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  documentNoteText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#F59E0B',
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
  reviewCardTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 12,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
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
    flex: 1,
    textAlign: 'right',
  },
  reviewDocStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewDocText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#10B981',
    marginLeft: 4,
  },
  submitSection: {
    marginTop: 20,
  },
  submitNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  submitNoteText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1E40AF',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E40AF',
    paddingVertical: 16,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginRight: 8,
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
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});
