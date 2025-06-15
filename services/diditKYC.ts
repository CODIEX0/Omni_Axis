import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Didit KYC API Configuration
const DIDIT_API_BASE_URL = process.env.EXPO_PUBLIC_DIDIT_API_URL || 'https://api.didit.me/v1';
const DIDIT_API_KEY = process.env.EXPO_PUBLIC_DIDIT_API_KEY || 'your_didit_api_key';

export interface DiditDocument {
  id: string;
  type: 'passport' | 'driver_license' | 'national_id' | 'proof_of_address';
  name: string;
  uri?: string;
  status: 'pending' | 'uploaded' | 'processing' | 'verified' | 'rejected';
  required: boolean;
  diditVerificationId?: string;
  verificationData?: DiditVerificationResult;
}

export interface DiditVerificationResult {
  verificationId: string;
  status: 'pending' | 'processing' | 'approved' | 'rejected' | 'expired';
  confidence: number;
  documentType: string;
  extractedData: {
    documentNumber?: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    expiryDate?: string;
    issueDate?: string;
    nationality?: string;
    gender?: string;
    address?: string;
    placeOfBirth?: string;
  };
  securityFeatures?: {
    hologram: boolean;
    rfid: boolean;
    barcode: boolean;
    watermark: boolean;
  };
  qualityChecks?: {
    blur: number;
    glare: number;
    darkness: number;
    completeness: number;
  };
  fraudChecks?: {
    tampering: boolean;
    photoSubstitution: boolean;
    screenRecapture: boolean;
  };
  errors?: string[];
  warnings?: string[];
}

export interface DiditBiometricResult {
  verificationId: string;
  status: 'pending' | 'processing' | 'approved' | 'rejected';
  livenessScore: number;
  faceMatchScore?: number;
  qualityScore: number;
  faceDetected: boolean;
  livenessCheck: boolean;
  spoofDetection: {
    printAttack: boolean;
    replayAttack: boolean;
    maskAttack: boolean;
  };
  errors?: string[];
}

export interface DiditKYCSession {
  sessionId: string;
  status: 'created' | 'in_progress' | 'completed' | 'expired' | 'failed';
  userId: string;
  createdAt: string;
  updatedAt: string;
  documents: DiditDocument[];
  biometricResult?: DiditBiometricResult;
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  complianceFlags: string[];
}

class DiditKYCService {
  private static instance: DiditKYCService;
  private readonly STORAGE_KEY = 'didit_kyc_session';

  static getInstance(): DiditKYCService {
    if (!DiditKYCService.instance) {
      DiditKYCService.instance = new DiditKYCService();
    }
    return DiditKYCService.instance;
  }

  /**
   * Initialize a new KYC session with Didit
   */
  async initializeKYCSession(userId: string): Promise<DiditKYCSession> {
    try {
      const response = await fetch(`${DIDIT_API_BASE_URL}/kyc/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DIDIT_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          session_type: 'full_kyc',
          required_documents: ['government_id', 'proof_of_address'],
          require_biometric: true,
          webhook_url: 'https://your-app.com/webhooks/didit',
        }),
      });

      if (!response.ok) {
        throw new Error(`Didit API error: ${response.status}`);
      }

      const data = await response.json();
      
      const session: DiditKYCSession = {
        sessionId: data.session_id,
        status: 'created',
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
        ],
        overallScore: 0,
        riskLevel: 'medium',
        complianceFlags: [],
      };

      await AsyncStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(session));
      return session;
    } catch (error) {
      console.error('Error initializing Didit KYC session:', error);
      throw error;
    }
  }

  /**
   * Upload and verify document using Didit's document verification
   */
  async verifyDocument(
    userId: string, 
    documentId: string, 
    imageUri: string, 
    documentType: string
  ): Promise<DiditKYCSession> {
    try {
      const session = await this.getKYCSession(userId);
      if (!session) throw new Error('KYC session not found');

      // Prepare form data for Didit API
      const formData = new FormData();
      formData.append('session_id', session.sessionId);
      formData.append('document_type', documentType);
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `${documentId}.jpg`,
      } as any);

      const response = await fetch(`${DIDIT_API_BASE_URL}/kyc/documents/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DIDIT_API_KEY}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Didit document verification error: ${response.status}`);
      }

      const verificationResult: DiditVerificationResult = await response.json();

      // Update local session with verification result
      const documentIndex = session.documents.findIndex(doc => doc.id === documentId);
      if (documentIndex !== -1) {
        session.documents[documentIndex].diditVerificationId = verificationResult.verificationId;
        session.documents[documentIndex].verificationData = verificationResult;
        session.documents[documentIndex].status = this.mapDiditStatusToLocal(verificationResult.status);
        session.documents[documentIndex].uri = imageUri;

        // Update overall score based on verification result
        if (verificationResult.status === 'approved' && verificationResult.confidence > 0.8) {
          session.overallScore += 25;
        }

        // Add any compliance flags
        if (verificationResult.errors && verificationResult.errors.length > 0) {
          session.complianceFlags.push(...verificationResult.errors);
        }
        if (verificationResult.warnings && verificationResult.warnings.length > 0) {
          session.complianceFlags.push(...verificationResult.warnings);
        }
      }

      session.updatedAt = new Date().toISOString();
      await AsyncStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(session));
      return session;
    } catch (error) {
      console.error('Error verifying document with Didit:', error);
      throw error;
    }
  }

  /**
   * Perform biometric verification using Didit's face verification
   */
  async verifyBiometric(userId: string, selfieUri: string): Promise<DiditKYCSession> {
    try {
      const session = await this.getKYCSession(userId);
      if (!session) throw new Error('KYC session not found');

      const formData = new FormData();
      formData.append('session_id', session.sessionId);
      formData.append('selfie', {
        uri: selfieUri,
        type: 'image/jpeg',
        name: 'selfie.jpg',
      } as any);
      formData.append('liveness_check', 'true');
      formData.append('face_match', 'true'); // Match with ID document photo

      const response = await fetch(`${DIDIT_API_BASE_URL}/kyc/biometric/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DIDIT_API_KEY}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Didit biometric verification error: ${response.status}`);
      }

      const biometricResult: DiditBiometricResult = await response.json();

      // Update session with biometric result
      session.biometricResult = biometricResult;

      // Update overall score based on biometric verification
      if (biometricResult.status === 'approved' && 
          biometricResult.livenessScore > 0.8 && 
          biometricResult.qualityScore > 0.7) {
        session.overallScore += 25;
      }

      // Add compliance flags for biometric issues
      if (biometricResult.errors && biometricResult.errors.length > 0) {
        session.complianceFlags.push(...biometricResult.errors);
      }

      if (!biometricResult.livenessCheck) {
        session.complianceFlags.push('Liveness check failed');
      }

      if (biometricResult.spoofDetection.printAttack || 
          biometricResult.spoofDetection.replayAttack || 
          biometricResult.spoofDetection.maskAttack) {
        session.complianceFlags.push('Spoof attack detected');
      }

      session.updatedAt = new Date().toISOString();
      await AsyncStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(session));
      return session;
    } catch (error) {
      console.error('Error verifying biometric with Didit:', error);
      throw error;
    }
  }

  /**
   * Get current KYC session status from Didit
   */
  async getSessionStatus(userId: string): Promise<DiditKYCSession | null> {
    try {
      const localSession = await this.getKYCSession(userId);
      if (!localSession) return null;

      // Fetch latest status from Didit
      const response = await fetch(`${DIDIT_API_BASE_URL}/kyc/sessions/${localSession.sessionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${DIDIT_API_KEY}`,
        },
      });

      if (!response.ok) {
        console.warn(`Could not fetch session status from Didit: ${response.status}`);
        return localSession; // Return local data if API fails
      }

      const remoteData = await response.json();
      
      // Update local session with remote status
      localSession.status = remoteData.status;
      localSession.overallScore = remoteData.overall_score || localSession.overallScore;
      localSession.riskLevel = remoteData.risk_level || localSession.riskLevel;
      
      if (remoteData.compliance_flags) {
        localSession.complianceFlags = remoteData.compliance_flags;
      }

      localSession.updatedAt = new Date().toISOString();
      await AsyncStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(localSession));
      return localSession;
    } catch (error) {
      console.error('Error getting session status from Didit:', error);
      return await this.getKYCSession(userId); // Return local data on error
    }
  }

  /**
   * Finalize KYC session and get final approval status
   */
  async finalizeKYCSession(userId: string): Promise<DiditKYCSession> {
    try {
      const session = await this.getKYCSession(userId);
      if (!session) throw new Error('KYC session not found');

      const response = await fetch(`${DIDIT_API_BASE_URL}/kyc/sessions/${session.sessionId}/finalize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DIDIT_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Didit session finalization error: ${response.status}`);
      }

      const finalResult = await response.json();
      
      // Update session with final status
      session.status = finalResult.status;
      session.overallScore = finalResult.overall_score;
      session.riskLevel = finalResult.risk_level;
      session.complianceFlags = finalResult.compliance_flags || session.complianceFlags;
      session.updatedAt = new Date().toISOString();

      await AsyncStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(session));
      return session;
    } catch (error) {
      console.error('Error finalizing KYC session with Didit:', error);
      throw error;
    }
  }

  /**
   * Get local KYC session data
   */
  async getKYCSession(userId: string): Promise<DiditKYCSession | null> {
    try {
      const data = await AsyncStorage.getItem(`${this.STORAGE_KEY}_${userId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting local KYC session:', error);
      return null;
    }
  }

  /**
   * Check if user has completed KYC with Didit
   */
  async isKYCApproved(userId: string): Promise<boolean> {
    const session = await this.getSessionStatus(userId);
    return session?.status === 'completed' && session.overallScore >= 80;
  }

  /**
   * Get KYC completion percentage
   */
  async getKYCProgress(userId: string): Promise<number> {
    const session = await this.getKYCSession(userId);
    if (!session) return 0;

    let completedSteps = 0;
    const totalSteps = session.documents.length + (session.biometricResult ? 1 : 0);

    // Count completed documents
    session.documents.forEach(doc => {
      if (doc.status === 'verified') completedSteps++;
    });

    // Count biometric verification
    if (session.biometricResult?.status === 'approved') {
      completedSteps++;
    }

    return Math.min(100, (completedSteps / totalSteps) * 100);
  }

  /**
   * Auto-approve demo accounts (bypass Didit for demo purposes)
   */
  async autoApproveDemoAccount(userId: string, role: string): Promise<DiditKYCSession> {
    const session: DiditKYCSession = {
      sessionId: `demo_${userId}_${Date.now()}`,
      status: 'completed',
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      documents: [
        {
          id: 'government_id',
          type: 'passport',
          name: 'Government-issued ID',
          status: 'verified',
          required: true,
          diditVerificationId: `demo_doc_${Date.now()}`,
          verificationData: {
            verificationId: `demo_doc_${Date.now()}`,
            status: 'approved',
            confidence: 0.95,
            documentType: 'passport',
            extractedData: {
              fullName: `Demo ${role.charAt(0).toUpperCase() + role.slice(1)} User`,
              firstName: 'Demo',
              lastName: `${role.charAt(0).toUpperCase() + role.slice(1)}`,
              dateOfBirth: '1990-01-01',
              documentNumber: `DEMO${Date.now()}`,
              nationality: 'United States',
              expiryDate: '2030-12-31',
            },
            securityFeatures: {
              hologram: true,
              rfid: true,
              barcode: true,
              watermark: true,
            },
            qualityChecks: {
              blur: 0.95,
              glare: 0.95,
              darkness: 0.95,
              completeness: 0.95,
            },
            fraudChecks: {
              tampering: false,
              photoSubstitution: false,
              screenRecapture: false,
            },
          },
        },
        {
          id: 'proof_address',
          type: 'proof_of_address',
          name: 'Proof of Address',
          status: 'verified',
          required: true,
          diditVerificationId: `demo_addr_${Date.now()}`,
          verificationData: {
            verificationId: `demo_addr_${Date.now()}`,
            status: 'approved',
            confidence: 0.92,
            documentType: 'utility_bill',
            extractedData: {
              fullName: `Demo ${role.charAt(0).toUpperCase() + role.slice(1)} User`,
              address: '123 Demo Street, Demo City, Demo State 12345',
            },
          },
        },
      ],
      biometricResult: {
        verificationId: `demo_bio_${Date.now()}`,
        status: 'approved',
        livenessScore: 0.95,
        faceMatchScore: 0.92,
        qualityScore: 0.90,
        faceDetected: true,
        livenessCheck: true,
        spoofDetection: {
          printAttack: false,
          replayAttack: false,
          maskAttack: false,
        },
      },
      overallScore: 95,
      riskLevel: 'low',
      complianceFlags: [],
    };

    await AsyncStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(session));
    return session;
  }

  /**
   * Map Didit status to local status
   */
  private mapDiditStatusToLocal(diditStatus: string): 'pending' | 'uploaded' | 'processing' | 'verified' | 'rejected' {
    switch (diditStatus) {
      case 'approved':
        return 'verified';
      case 'rejected':
        return 'rejected';
      case 'processing':
        return 'processing';
      case 'pending':
      default:
        return 'pending';
    }
  }

  /**
   * Extract personal information from Didit verification results
   */
  getExtractedPersonalInfo(session: DiditKYCSession): any {
    const govIdDoc = session.documents.find(doc => doc.id === 'government_id');
    if (govIdDoc?.verificationData?.extractedData) {
      return govIdDoc.verificationData.extractedData;
    }
    return null;
  }
}

export const diditKYCService = DiditKYCService.getInstance();
export default diditKYCService;
