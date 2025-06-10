import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Upload, Camera, FileText, DollarSign, CircleCheck as CheckCircle, ArrowRight, Building } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { useWalletConnection } from '../../hooks/useWallet';
import { useTokenizeAsset, TokenizeAssetData } from '../../hooks/useTokenizeAsset';
import { useCamera } from '../../hooks/useCamera';
import { useDocumentPicker } from '../../hooks/useDocumentPicker';
import { WalletConnector } from '../../components/WalletConnector';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ASSET_TYPES, COLORS, SPACING, FONT_SIZES } from '../../constants';

export default function TokenizeScreen() {
  const { user, canTokenizeAssets, isKYCCompleted } = useAuth();
  const { isConnected, address } = useWalletConnection();
  const { tokenizeAsset, tokenizationStatus, resetStatus } = useTokenizeAsset();
  const { takePhoto, pickImage } = useCamera();
  const { pickDocument } = useDocumentPicker();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    assetType: '',
    assetName: '',
    description: '',
    totalValue: '',
    location: '',
    images: [] as string[],
    documents: [] as string[],
  });

  const steps = [
    'Asset Details',
    'Media & Documents',
    'Review & Submit'
  ];

  const updateFormData = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImagePick = async () => {
    try {
      const result = await pickImage();
      if (result?.uri) {
        updateFormData('images', [...formData.images, result.uri]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const result = await takePhoto();
      if (result?.uri) {
        updateFormData('images', [...formData.images, result.uri]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleDocumentPick = async () => {
    try {
      const result = await pickDocument();
      if (result?.uri) {
        updateFormData('documents', [...formData.documents, result.uri]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 0:
        return !!(formData.assetType && formData.assetName && formData.description && formData.totalValue);
      case 1:
        return formData.images.length > 0 && formData.documents.length > 0;
      case 2:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      Alert.alert('Incomplete Information', 'Please fill in all required fields before proceeding.');
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!canTokenizeAssets()) {
      Alert.alert(
        'KYC Required', 
        'You need to complete KYC verification before tokenizing assets.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Complete KYC', onPress: () => {/* Navigate to KYC */} }
        ]
      );
      return;
    }

    if (!isConnected || !address) {
      Alert.alert('Wallet Required', 'Please connect your wallet to tokenize assets.');
      return;
    }

    try {
      const tokenizeData: TokenizeAssetData = {
        title: formData.assetName,
        description: formData.description,
        assetType: formData.assetType,
        estimatedValue: parseFloat(formData.totalValue),
        imageUris: formData.images,
        documentUris: formData.documents,
        location: formData.location,
      };

      const result = await tokenizeAsset(tokenizeData);
      
      if (result.success) {
        Alert.alert(
          'Success!', 
          `Asset successfully tokenized! Token ID: ${result.tokenId}`,
          [
            { text: 'OK', onPress: () => {
              resetStatus();
              setCurrentStep(0);
              setFormData({
                assetType: '',
                assetName: '',
                description: '',
                totalValue: '',
                location: '',
                images: [],
                documents: [],
              });
            }}
          ]
        );
      } else {
        Alert.alert('Tokenization Failed', result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Tokenization error:', error);
      Alert.alert('Error', 'Failed to tokenize asset');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Asset Details</Text>
            <Text style={styles.stepDescription}>
              Tell us about the asset you want to tokenize
            </Text>

            <View style={styles.assetTypeGrid}>
              {ASSET_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.assetTypeCard,
                    formData.assetType === type.value && styles.assetTypeCardActive
                  ]}
                  onPress={() => updateFormData('assetType', type.value)}
                >
                  <View style={styles.assetTypeIcon}>
                    <Building color="#FFFFFF" size={24} />
                  </View>
                  <Text style={[
                    styles.assetTypeName,
                    formData.assetType === type.value && styles.assetTypeNameActive
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Asset Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.assetName}
                onChangeText={(value) => updateFormData('assetName', value)}
                placeholder="e.g., Manhattan Office Building"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(value) => updateFormData('description', value)}
                placeholder="Describe your asset, its location, key features, and investment potential..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Total Asset Value (USD) *</Text>
              <View style={styles.inputWithIcon}>
                <DollarSign color="#6B7280" size={20} />
                <TextInput
                  style={styles.inputWithIconText}
                  value={formData.totalValue}
                  onChangeText={(value) => updateFormData('totalValue', value)}
                  placeholder="2,500,000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location (Optional)</Text>
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={(value) => updateFormData('location', value)}
                placeholder="e.g., New York, NY"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Media & Documents</Text>
            <Text style={styles.stepDescription}>
              Upload supporting documents and images for your asset
            </Text>

            <View style={styles.uploadSection}>
              <Text style={styles.sectionTitle}>Asset Images</Text>
              <Text style={styles.sectionDescription}>
                High-quality photos of your asset
              </Text>
              
              <View style={styles.uploadGrid}>
                <TouchableOpacity style={styles.uploadCard} onPress={handleTakePhoto}>
                  <Camera color="#6B7280" size={32} />
                  <Text style={styles.uploadCardText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.uploadCard} onPress={handleImagePick}>
                  <Upload color="#6B7280" size={32} />
                  <Text style={styles.uploadCardText}>Upload Images</Text>
                </TouchableOpacity>
              </View>

              {formData.images.length > 0 && (
                <View style={styles.imagePreview}>
                  <Text style={styles.previewTitle}>Selected Images ({formData.images.length})</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {formData.images.map((uri, index) => (
                      <Image key={index} source={{ uri }} style={styles.previewImage} />
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={styles.uploadSection}>
              <Text style={styles.sectionTitle}>Legal Documents</Text>
              <Text style={styles.sectionDescription}>
                Ownership certificates, valuations, legal documentation
              </Text>
              
              <TouchableOpacity style={styles.documentUpload} onPress={handleDocumentPick}>
                <FileText color="#1E40AF" size={24} />
                <View style={styles.documentUploadContent}>
                  <Text style={styles.documentUploadTitle}>Upload Documents</Text>
                  <Text style={styles.documentUploadDescription}>
                    PDF, DOC, or image files (max 25MB each)
                  </Text>
                </View>
                <ArrowRight color="#6B7280" size={20} />
              </TouchableOpacity>

              {formData.documents.length > 0 && (
                <View style={styles.documentsList}>
                  <Text style={styles.previewTitle}>Selected Documents ({formData.documents.length})</Text>
                  {formData.documents.map((uri, index) => (
                    <View key={index} style={styles.documentItem}>
                      <FileText color="#6B7280" size={16} />
                      <Text style={styles.documentName}>Document {index + 1}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Review & Submit</Text>
            <Text style={styles.stepDescription}>
              Review your asset details before tokenization
            </Text>

            <Card style={styles.reviewCard}>
              <Text style={styles.reviewTitle}>Asset Summary</Text>
              
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Asset Type:</Text>
                <Text style={styles.reviewValue}>
                  {ASSET_TYPES.find(t => t.value === formData.assetType)?.label || formData.assetType}
                </Text>
              </View>

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Asset Name:</Text>
                <Text style={styles.reviewValue}>{formData.assetName}</Text>
              </View>

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Estimated Value:</Text>
                <Text style={styles.reviewValue}>${formData.totalValue}</Text>
              </View>

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Location:</Text>
                <Text style={styles.reviewValue}>{formData.location || 'Not specified'}</Text>
              </View>

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Images:</Text>
                <Text style={styles.reviewValue}>{formData.images.length} uploaded</Text>
              </View>

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Documents:</Text>
                <Text style={styles.reviewValue}>{formData.documents.length} uploaded</Text>
              </View>

              <View style={styles.reviewDescription}>
                <Text style={styles.reviewLabel}>Description:</Text>
                <Text style={styles.reviewDescriptionText}>{formData.description}</Text>
              </View>
            </Card>

            {/* Tokenization Status */}
            {tokenizationStatus.step !== 'idle' && (
              <Card style={styles.statusCard}>
                <View style={styles.statusHeader}>
                  <Text style={styles.statusTitle}>Tokenization Progress</Text>
                  {tokenizationStatus.step === 'completed' && (
                    <CheckCircle color="#10B981" size={20} />
                  )}
                </View>
                <Text style={styles.statusMessage}>{tokenizationStatus.message}</Text>
                {tokenizationStatus.progress > 0 && (
                  <View style={styles.progressBar}>
                    <View 
                      style={[styles.progressFill, { width: `${tokenizationStatus.progress}%` }]} 
                    />
                  </View>
                )}
                {tokenizationStatus.error && (
                  <Text style={styles.errorText}>{tokenizationStatus.error}</Text>
                )}
              </Card>
            )}

            {/* Wallet Connection */}
            {!isConnected && (
              <Card style={styles.walletCard}>
                <Text style={styles.walletTitle}>Connect Wallet Required</Text>
                <Text style={styles.walletDescription}>
                  You need to connect your wallet to tokenize this asset.
                </Text>
                <WalletConnector />
              </Card>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  // Show loading spinner during tokenization
  if (tokenizationStatus.step === 'uploading' || tokenizationStatus.step === 'minting' || tokenizationStatus.step === 'saving') {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message={tokenizationStatus.message} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1E40AF', '#3B82F6']}
        style={styles.header}
      >
        <Text style={styles.title}>Tokenize Asset</Text>
        <Text style={styles.subtitle}>
          Step {currentStep + 1} of {steps.length}
        </Text>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBarContainer}>
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
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

      <View style={styles.buttonContainer}>
        {currentStep > 0 && (
          <Button
            title="Previous"
            onPress={handleBack}
            variant="outline"
            style={styles.backButton}
          />
        )}
        
        <Button
          title={currentStep === steps.length - 1 ? 'Tokenize Asset' : 'Continue'}
          onPress={handleNext}
          disabled={!validateCurrentStep() || tokenizationStatus.step === 'uploading' || tokenizationStatus.step === 'minting'}
          loading={tokenizationStatus.step === 'uploading' || tokenizationStatus.step === 'minting' || tokenizationStatus.step === 'saving'}
          style={[styles.nextButton, currentStep === 0 && { flex: 1 }]}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    paddingHorizontal: SPACING.LG,
    paddingTop: SPACING.LG,
    paddingBottom: SPACING.LG,
  },
  title: {
    fontSize: FONT_SIZES.XXXL,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FONT_SIZES.MD,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: SPACING.LG,
  },
  progressContainer: {
    marginBottom: SPACING.SM,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginBottom: SPACING.SM,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 2,
  },
  progressText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.LG,
    paddingTop: SPACING.LG,
  },
  stepContent: {
    paddingBottom: SPACING.LG,
  },
  stepTitle: {
    fontSize: FONT_SIZES.XXL,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  stepDescription: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XXL,
    lineHeight: 24,
  },
  assetTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
    marginBottom: SPACING.XXL,
  },
  assetTypeCard: {
    width: '48%',
    backgroundColor: COLORS.SURFACE,
    borderRadius: 16,
    padding: SPACING.LG,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.BORDER,
  },
  assetTypeCardActive: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: '#F8FAFF',
  },
  assetTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  assetTypeName: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  assetTypeNameActive: {
    color: COLORS.PRIMARY,
  },
  inputGroup: {
    marginBottom: SPACING.LG,
  },
  label: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  input: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  inputWithIconText: {
    flex: 1,
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.SM,
  },
  uploadSection: {
    marginBottom: SPACING.XXL,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  sectionDescription: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.MD,
    lineHeight: 20,
  },
  uploadGrid: {
    flexDirection: 'row',
    gap: SPACING.SM,
  },
  uploadCard: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: SPACING.LG,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.BORDER,
    borderStyle: 'dashed',
  },
  uploadCardText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '500',
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.SM,
  },
  imagePreview: {
    marginTop: SPACING.MD,
  },
  previewTitle: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: SPACING.SM,
  },
  documentUpload: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: SPACING.MD,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  documentUploadContent: {
    flex: 1,
    marginLeft: SPACING.MD,
  },
  documentUploadTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  documentUploadDescription: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  documentsList: {
    marginTop: SPACING.MD,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.SM,
  },
  documentName: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.SM,
  },
  reviewCard: {
    marginBottom: SPACING.LG,
  },
  reviewTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  reviewLabel: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  reviewValue: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  reviewDescription: {
    marginTop: SPACING.MD,
  },
  reviewDescriptionText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.SM,
    lineHeight: 20,
  },
  statusCard: {
    marginBottom: SPACING.LG,
    backgroundColor: '#F8FAFC',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  statusTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  statusMessage: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.SM,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.BORDER,
    borderRadius: 2,
    marginBottom: SPACING.SM,
  },
  errorText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.ERROR,
  },
  walletCard: {
    marginBottom: SPACING.LG,
    backgroundColor: '#FFF7ED',
  },
  walletTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: '#EA580C',
    marginBottom: SPACING.SM,
  },
  walletDescription: {
    fontSize: FONT_SIZES.SM,
    color: '#C2410C',
    marginBottom: SPACING.MD,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.LG,
    paddingBottom: SPACING.XXL,
    gap: SPACING.SM,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 1,
  },
});
