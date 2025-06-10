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
import { Upload, Camera, FileText, DollarSign, Users, Calendar, CircleCheck as CheckCircle, ArrowRight, Building, Palette, Zap, Info } from 'lucide-react-native';

export default function TokenizeScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    assetType: '',
    assetName: '',
    description: '',
    totalValue: '',
    tokenPrice: '',
    totalTokens: '',
    minimumInvestment: '',
    expectedROI: '',
    duration: '',
    documents: [],
    images: [],
  });

  const steps = [
    'Asset Details',
    'Tokenization Parameters',
    'Documentation',
    'Review & Submit'
  ];

  const assetTypes = [
    { id: 'real-estate', name: 'Real Estate', icon: Building, color: '#1E40AF', description: 'Properties, commercial buildings, land' },
    { id: 'art', name: 'Art & Collectibles', icon: Palette, color: '#8B5CF6', description: 'Paintings, sculptures, rare collectibles' },
    { id: 'luxury', name: 'Luxury Goods', icon: Zap, color: '#EF4444', description: 'Watches, jewelry, vintage items' },
    { id: 'commodities', name: 'Commodities', icon: DollarSign, color: '#F59E0B', description: 'Gold, wine, oil, agricultural products' },
  ];

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit tokenization request
      Alert.alert(
        'Tokenization Request Submitted',
        'Your asset tokenization request has been submitted for review. Our team will contact you within 48 hours.',
        [{ text: 'OK' }]
      );
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.assetType && formData.assetName && formData.description && formData.totalValue;
      case 1:
        return formData.tokenPrice && formData.totalTokens && formData.minimumInvestment;
      case 2:
        return true; // Documentation is optional in this demo
      case 3:
        return true;
      default:
        return false;
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
              {assetTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.assetTypeCard,
                    formData.assetType === type.id && styles.assetTypeCardActive
                  ]}
                  onPress={() => updateFormData('assetType', type.id)}
                >
                  <View style={[styles.assetTypeIcon, { backgroundColor: type.color }]}>
                    <type.icon color="#FFFFFF" size={24} />
                  </View>
                  <Text style={[
                    styles.assetTypeName,
                    formData.assetType === type.id && styles.assetTypeNameActive
                  ]}>
                    {type.name}
                  </Text>
                  <Text style={styles.assetTypeDescription}>
                    {type.description}
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
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Tokenization Parameters</Text>
            <Text style={styles.stepDescription}>
              Set the parameters for your token offering
            </Text>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Token Price (USD) *</Text>
                <View style={styles.inputWithIcon}>
                  <DollarSign color="#6B7280" size={16} />
                  <TextInput
                    style={styles.inputWithIconText}
                    value={formData.tokenPrice}
                    onChangeText={(value) => updateFormData('tokenPrice', value)}
                    placeholder="125.50"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Total Tokens *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.totalTokens}
                  onChangeText={(value) => updateFormData('totalTokens', value)}
                  placeholder="20,000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Minimum Investment (USD) *</Text>
              <View style={styles.inputWithIcon}>
                <DollarSign color="#6B7280" size={20} />
                <TextInput
                  style={styles.inputWithIconText}
                  value={formData.minimumInvestment}
                  onChangeText={(value) => updateFormData('minimumInvestment', value)}
                  placeholder="1,000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Expected ROI (%)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.expectedROI}
                  onChangeText={(value) => updateFormData('expectedROI', value)}
                  placeholder="8.5"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Duration (years)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.duration}
                  onChangeText={(value) => updateFormData('duration', value)}
                  placeholder="5"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.infoCard}>
              <Info color="#1E40AF" size={20} />
              <Text style={styles.infoText}>
                These parameters will determine how your asset is divided into tokens and offered to investors. 
                You can adjust these values based on market conditions and investment strategy.
              </Text>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Documentation</Text>
            <Text style={styles.stepDescription}>
              Upload supporting documents and images for your asset
            </Text>

            <View style={styles.uploadSection}>
              <Text style={styles.sectionTitle}>Asset Images</Text>
              <Text style={styles.sectionDescription}>
                High-quality photos of your asset (up to 10 images)
              </Text>
              
              <View style={styles.uploadGrid}>
                <TouchableOpacity style={styles.uploadCard}>
                  <Camera color="#6B7280" size={32} />
                  <Text style={styles.uploadCardText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.uploadCard}>
                  <Upload color="#6B7280" size={32} />
                  <Text style={styles.uploadCardText}>Upload Images</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.uploadSection}>
              <Text style={styles.sectionTitle}>Legal Documents</Text>
              <Text style={styles.sectionDescription}>
                Ownership certificates, valuations, legal documentation
              </Text>
              
              <TouchableOpacity style={styles.documentUpload}>
                <FileText color="#1E40AF" size={24} />
                <View style={styles.documentUploadContent}>
                  <Text style={styles.documentUploadTitle}>Upload Documents</Text>
                  <Text style={styles.documentUploadDescription}>
                    PDF, DOC, or image files (max 25MB each)
                  </Text>
                </View>
                <ArrowRight color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.uploadSection}>
              <Text style={styles.sectionTitle}>Valuation Report</Text>
              <Text style={styles.sectionDescription}>
                Professional appraisal or valuation report
              </Text>
              
              <TouchableOpacity style={styles.documentUpload}>
                <DollarSign color="#F59E0B" size={24} />
                <View style={styles.documentUploadContent}>
                  <Text style={styles.documentUploadTitle}>Upload Valuation</Text>
                  <Text style={styles.documentUploadDescription}>
                    Independent valuation or appraisal report
                  </Text>
                </View>
                <ArrowRight color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Review & Submit</Text>
            <Text style={styles.stepDescription}>
              Please review your tokenization request before submitting
            </Text>

            <View style={styles.reviewCard}>
              <Text style={styles.reviewCardTitle}>Asset Information</Text>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Asset Type</Text>
                <Text style={styles.reviewValue}>
                  {assetTypes.find(t => t.id === formData.assetType)?.name || 'Not specified'}
                </Text>
              </View>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Asset Name</Text>
                <Text style={styles.reviewValue}>{formData.assetName || 'Not specified'}</Text>
              </View>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Total Value</Text>
                <Text style={styles.reviewValue}>
                  ${formData.totalValue ? parseInt(formData.totalValue).toLocaleString() : 'Not specified'}
                </Text>
              </View>
            </View>

            <View style={styles.reviewCard}>
              <Text style={styles.reviewCardTitle}>Token Parameters</Text>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Token Price</Text>
                <Text style={styles.reviewValue}>${formData.tokenPrice || 'Not specified'}</Text>
              </View>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Total Tokens</Text>
                <Text style={styles.reviewValue}>
                  {formData.totalTokens ? parseInt(formData.totalTokens).toLocaleString() : 'Not specified'}
                </Text>
              </View>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Minimum Investment</Text>
                <Text style={styles.reviewValue}>
                  ${formData.minimumInvestment ? parseInt(formData.minimumInvestment).toLocaleString() : 'Not specified'}
                </Text>
              </View>
            </View>

            <View style={styles.submissionNote}>
              <CheckCircle color="#10B981" size={24} />
              <Text style={styles.submissionNoteText}>
                Your tokenization request will be reviewed by our team within 48 hours. 
                We'll contact you to discuss next steps and answer any questions.
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

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
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

      <View style={styles.buttonContainer}>
        {currentStep > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={handlePrevious}>
            <Text style={styles.backButtonText}>Previous</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[
            styles.nextButton,
            currentStep === 0 && { flex: 1 },
            !canProceed() && styles.nextButtonDisabled
          ]}
          onPress={handleNext}
          disabled={!canProceed()}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === steps.length - 1 ? 'Submit Request' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 24,
  },
  progressContainer: {
    marginBottom: 8,
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  stepContent: {
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 32,
    lineHeight: 24,
  },
  assetTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  assetTypeCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  assetTypeCardActive: {
    borderColor: '#1E40AF',
    backgroundColor: '#F8FAFF',
  },
  assetTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  assetTypeName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  assetTypeNameActive: {
    color: '#1E40AF',
  },
  assetTypeDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputWithIconText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    marginLeft: 12,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1E40AF',
    marginLeft: 12,
    lineHeight: 20,
  },
  uploadSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  uploadGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  uploadCardText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginTop: 12,
  },
  documentUpload: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  documentUploadContent: {
    flex: 1,
    marginLeft: 16,
  },
  documentUploadTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  documentUploadDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reviewCardTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  reviewLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  reviewValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  submissionNote: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  submissionNoteText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#166534',
    marginLeft: 12,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
    gap: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#1E40AF',
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