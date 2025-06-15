import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { freeDocumentScanner, DocumentScanResult, BiometricScanResult } from './documentScanner';

export interface KYCDocument {
  id: string;
  type: 'passport' | 'driver_license' | 'national_id' | 'proof_of_address' | 'selfie';
  name: string;
  uri?: string;
  base64?: string;
  status: 'pending' | 'uploaded' | 'processing' | 'verified' | 'rejected';
  required: boolean;
  verificationData?: {
    extractedText?: string;
    confidence?: number;
    documentType?: string;
    expiryDate?: string;
    documentNumber?: string;
    errors?: string[];
  };
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  documentNumber?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  phoneNumber: string;
  occupation: string;
  employerName?: string;
  annualIncome?: string;
  sourceOfFunds?: string;
}

export interface BiometricData {
  faceImage?: string;
  livenessCheck?: boolean;
  confidenceScore?: number;
  faceMatch?: boolean;
}

export interface KYCVerificationResult {
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'requires_review';
  riskLevel: 'low' | 'medium' | 'high';
  completedSteps: string[];
  failedSteps: string[];
  overallScore: number;
  documents: KYCDocument[];
  personalInfo: PersonalInfo;
  biometricData?: BiometricData;
  complianceFlags: string[];
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

class FreeKYCService {
  private static instance: FreeKYCService;
  private readonly STORAGE_KEY = 'kyc_verification_data';

  static getInstance(): FreeKYCService {
    if (!FreeKYCService.instance) {
      FreeKYCService.instance = new FreeKYCService();
    }
    return FreeKYCService.instance;
  }

  /**
   * Initialize KYC verification for a user
   */
  async initializeKYC(userId: string): Promise<KYCVerificationResult> {
    const kycData: KYCVerificationResult = {
      status: 'pending',
      riskLevel: 'medium',
      completedSteps: [],
      failedSteps: [],
      overallScore: 0,
      documents: [
        {
          id: 'government_id',
          type: 'passport',
          name: 'Government-issued ID',
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
          id: 'selfie_verification',
          type: 'selfie',
          name: 'Selfie Verification',
          status: 'pending',
          required: true,
        },
      ],
      personalInfo: {
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
      },
      complianceFlags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(kycData));
    return kycData;
  }

  /**
   * Update personal information
   */
  async updatePersonalInfo(userId: string, personalInfo: PersonalInfo): Promise<KYCVerificationResult> {
    const kycData = await this.getKYCData(userId);
    if (!kycData) throw new Error('KYC data not found');

    kycData.personalInfo = personalInfo;
    kycData.updatedAt = new Date().toISOString();

    // Add personal info validation
    const validationResult = this.validatePersonalInfo(personalInfo);
    if (validationResult.isValid) {
      kycData.completedSteps.push('personal_info');
      kycData.overallScore += 25;
    } else {
      kycData.failedSteps.push('personal_info');
      kycData.complianceFlags.push(...validationResult.errors);
    }

    await AsyncStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(kycData));
    return kycData;
  }

  /**
   * Process document upload and perform OCR-like validation
   */
  async processDocument(userId: string, documentId: string, imageUri: string, base64?: string): Promise<KYCVerificationResult> {
    const kycData = await this.getKYCData(userId);
    if (!kycData) throw new Error('KYC data not found');

    // Find the document
    const documentIndex = kycData.documents.findIndex(doc => doc.id === documentId);
    if (documentIndex === -1) throw new Error('Document not found');

    kycData.documents[documentIndex].uri = imageUri;
    kycData.documents[documentIndex].base64 = base64;
    kycData.documents[documentIndex].status = 'processing';

    // Use document scanner for OCR and validation
    const expectedType = kycData.documents[documentIndex].type;
    const scanResult: DocumentScanResult = await freeDocumentScanner.scanDocument(imageUri, expectedType);
    
    // Validate the document
    const isValid = freeDocumentScanner.validateDocument(scanResult, expectedType);
    const isNotExpired = freeDocumentScanner.isDocumentValid(scanResult);

    // Extract personal info for cross-validation
    const extractedInfo = freeDocumentScanner.extractPersonalInfo(scanResult);

    // Update document verification data
    kycData.documents[documentIndex].verificationData = {
      extractedText: scanResult.rawText,
      confidence: scanResult.confidence,
      documentType: expectedType,
      expiryDate: scanResult.extractedData.expiryDate,
      documentNumber: scanResult.extractedData.documentNumber,
      errors: scanResult.errors,
    };

    // Determine status based on validation results
    if (isValid && isNotExpired && scanResult.confidence > 0.7) {
      kycData.documents[documentIndex].status = 'verified';
      kycData.completedSteps.push(`document_${documentId}`);
      kycData.overallScore += 25;

      // Cross-validate with personal info if available
      if (extractedInfo.fullName && kycData.personalInfo.firstName && kycData.personalInfo.lastName) {
        const providedName = `${kycData.personalInfo.firstName} ${kycData.personalInfo.lastName}`.toLowerCase();
        const extractedName = extractedInfo.fullName.toLowerCase();
        
        if (!extractedName.includes(kycData.personalInfo.firstName.toLowerCase()) ||
            !extractedName.includes(kycData.personalInfo.lastName.toLowerCase())) {
          kycData.complianceFlags.push('Name mismatch between document and provided information');
          kycData.documents[documentIndex].status = 'rejected';
          kycData.failedSteps.push(`document_${documentId}`);
          kycData.overallScore -= 25;
        }
      }
    } else {
      kycData.documents[documentIndex].status = 'rejected';
      kycData.failedSteps.push(`document_${documentId}`);
      
      if (!isValid) kycData.complianceFlags.push(`Document validation failed for ${kycData.documents[documentIndex].name}`);
      if (!isNotExpired) kycData.complianceFlags.push(`Document is expired: ${kycData.documents[documentIndex].name}`);
      if (scanResult.confidence <= 0.7) kycData.complianceFlags.push(`Poor image quality for ${kycData.documents[documentIndex].name}`);
    }

    kycData.updatedAt = new Date().toISOString();
    await AsyncStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(kycData));
    return kycData;
  }

  /**
   * Process biometric verification (selfie + liveness check)
   */
  async processBiometricVerification(userId: string, selfieUri: string, base64?: string): Promise<KYCVerificationResult> {
    const kycData = await this.getKYCData(userId);
    if (!kycData) throw new Error('KYC data not found');

    // Use biometric scanner for face detection and liveness
    const biometricResult: BiometricScanResult = await freeDocumentScanner.scanFace(selfieUri);
    
    kycData.biometricData = {
      faceImage: selfieUri,
      livenessCheck: biometricResult.livenessCheck,
      confidenceScore: biometricResult.confidence,
      faceMatch: biometricResult.success && biometricResult.faceDetected,
    };
    
    if (biometricResult.success && biometricResult.confidence > 0.8 && biometricResult.livenessCheck) {
      kycData.completedSteps.push('biometric_verification');
      kycData.overallScore += 25;
    } else {
      kycData.failedSteps.push('biometric_verification');
      
      if (!biometricResult.livenessCheck) {
        kycData.complianceFlags.push('Liveness detection failed - please ensure you are a real person');
      }
      if (biometricResult.confidence <= 0.8) {
        kycData.complianceFlags.push('Face detection confidence too low');
      }
      if (!biometricResult.faceDetected) {
        kycData.complianceFlags.push('No face detected in the image');
      }
      
      // Add specific errors from biometric scan
      kycData.complianceFlags.push(...biometricResult.errors);
    }

    kycData.updatedAt = new Date().toISOString();
    await AsyncStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(kycData));
    return kycData;
  }

  /**
   * Finalize KYC verification and determine approval status
   */
  async finalizeKYC(userId: string): Promise<KYCVerificationResult> {
    const kycData = await this.getKYCData(userId);
    if (!kycData) throw new Error('KYC data not found');

    // Calculate final status based on completed steps and overall score
    const requiredSteps = ['personal_info', 'document_government_id', 'document_proof_address', 'biometric_verification'];
    const completedRequiredSteps = requiredSteps.filter(step => kycData.completedSteps.includes(step));

    if (completedRequiredSteps.length === requiredSteps.length && kycData.overallScore >= 80) {
      kycData.status = 'approved';
      kycData.riskLevel = 'low';
    } else if (kycData.overallScore >= 60 && completedRequiredSteps.length >= 3) {
      kycData.status = 'requires_review';
      kycData.riskLevel = 'medium';
    } else {
      kycData.status = 'rejected';
      kycData.riskLevel = 'high';
    }

    kycData.updatedAt = new Date().toISOString();
    await AsyncStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(kycData));
    return kycData;
  }

  /**
   * Get KYC data for a user
   */
  async getKYCData(userId: string): Promise<KYCVerificationResult | null> {
    try {
      const data = await AsyncStorage.getItem(`${this.STORAGE_KEY}_${userId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting KYC data:', error);
      return null;
    }
  }

  /**
   * Validate personal information
   */
  private validatePersonalInfo(personalInfo: PersonalInfo): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!personalInfo.firstName.trim()) errors.push('First name is required');
    if (!personalInfo.lastName.trim()) errors.push('Last name is required');
    if (!personalInfo.dateOfBirth) errors.push('Date of birth is required');
    if (!personalInfo.nationality) errors.push('Nationality is required');
    if (!personalInfo.phoneNumber) errors.push('Phone number is required');
    if (!personalInfo.address.street) errors.push('Street address is required');
    if (!personalInfo.address.city) errors.push('City is required');
    if (!personalInfo.address.country) errors.push('Country is required');

    // Validate date of birth (must be at least 18 years old)
    if (personalInfo.dateOfBirth) {
      const birthDate = new Date(personalInfo.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18) errors.push('Must be at least 18 years old');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Simulate document verification (OCR and validation)
   */
  private async simulateDocumentVerification(document: KYCDocument): Promise<any> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate OCR and document validation
    const confidence = Math.random() * 0.4 + 0.6; // Random confidence between 0.6 and 1.0
    const mockExpiryDate = new Date();
    mockExpiryDate.setFullYear(mockExpiryDate.getFullYear() + 2);

    return {
      extractedText: `Mock extracted text from ${document.name}`,
      confidence: confidence,
      documentType: document.type,
      expiryDate: mockExpiryDate.toISOString().split('T')[0],
      documentNumber: `DOC${Math.floor(Math.random() * 100000)}`,
      errors: confidence < 0.7 ? ['Low image quality', 'Text not clearly visible'] : [],
    };
  }

  /**
   * Simulate biometric verification (face detection and liveness)
   */
  private async simulateBiometricVerification(imageUri: string, base64?: string): Promise<BiometricData> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    const confidence = Math.random() * 0.3 + 0.7; // Random confidence between 0.7 and 1.0
    const livenessCheck = Math.random() > 0.1; // 90% success rate

    return {
      faceImage: imageUri,
      livenessCheck: livenessCheck,
      confidenceScore: confidence,
      faceMatch: confidence > 0.8 && livenessCheck,
    };
  }

  /**
   * Check if user has completed KYC
   */
  async isKYCApproved(userId: string): Promise<boolean> {
    const kycData = await this.getKYCData(userId);
    return kycData?.status === 'approved' || false;
  }

  /**
   * Get KYC completion percentage
   */
  async getKYCProgress(userId: string): Promise<number> {
    const kycData = await this.getKYCData(userId);
    if (!kycData) return 0;

    const totalSteps = 4; // personal_info, 2 documents, biometric
    return Math.min(100, (kycData.completedSteps.length / totalSteps) * 100);
  }

  /**
   * Auto-approve demo accounts
   */
  async autoApproveDemoAccount(userId: string, role: string): Promise<KYCVerificationResult> {
    const kycData: KYCVerificationResult = {
      status: 'approved',
      riskLevel: 'low',
      completedSteps: ['personal_info', 'document_government_id', 'document_proof_address', 'biometric_verification'],
      failedSteps: [],
      overallScore: 100,
      documents: [
        {
          id: 'government_id',
          type: 'passport',
          name: 'Government-issued ID',
          status: 'verified',
          required: true,
          verificationData: {
            confidence: 0.95,
            documentType: 'passport',
            extractedText: `Demo ${role} passport verification`,
            documentNumber: `DEMO${Date.now()}`,
          },
        },
        {
          id: 'proof_address',
          type: 'proof_of_address',
          name: 'Proof of Address',
          status: 'verified',
          required: true,
          verificationData: {
            confidence: 0.92,
            documentType: 'utility_bill',
            extractedText: `Demo address verification for ${role}`,
          },
        },
        {
          id: 'selfie_verification',
          type: 'selfie',
          name: 'Selfie Verification',
          status: 'verified',
          required: true,
          verificationData: {
            confidence: 0.98,
            documentType: 'selfie',
            extractedText: 'Biometric verification completed',
          },
        },
      ],
      personalInfo: {
        firstName: `Demo ${role}`,
        lastName: 'User',
        dateOfBirth: '1990-01-01',
        nationality: 'United States',
        documentNumber: `DEMO${Date.now()}`,
        address: {
          street: '123 Demo Street',
          city: 'Demo City',
          state: 'Demo State',
          zipCode: '12345',
          country: 'United States',
        },
        phoneNumber: '+1-555-DEMO',
        occupation: role.charAt(0).toUpperCase() + role.slice(1),
        employerName: 'Demo Company',
        annualIncome: '$100,000+',
        sourceOfFunds: 'Employment',
      },
      biometricData: {
        livenessCheck: true,
        confidenceScore: 0.95,
        faceMatch: true,
      },
      complianceFlags: [],
      reviewNotes: `Auto-approved demo account for ${role} role`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(kycData));
    return kycData;
  }
}

export const freeKYCService = FreeKYCService.getInstance();
export default freeKYCService;
