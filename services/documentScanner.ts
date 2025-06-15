import { Alert } from 'react-native';

export interface DocumentScanResult {
  success: boolean;
  confidence: number;
  extractedData: {
    documentType?: 'passport' | 'driver_license' | 'national_id' | 'utility_bill' | 'bank_statement';
    documentNumber?: string;
    fullName?: string;
    dateOfBirth?: string;
    expiryDate?: string;
    address?: string;
    issueDate?: string;
    nationality?: string;
    gender?: string;
  };
  rawText?: string;
  errors: string[];
}

export interface BiometricScanResult {
  success: boolean;
  confidence: number;
  livenessCheck: boolean;
  faceDetected: boolean;
  qualityScore: number;
  errors: string[];
}

class FreeDocumentScanner {
  private static instance: FreeDocumentScanner;

  static getInstance(): FreeDocumentScanner {
    if (!FreeDocumentScanner.instance) {
      FreeDocumentScanner.instance = new FreeDocumentScanner();
    }
    return FreeDocumentScanner.instance;
  }

  /**
   * Simulate document scanning and OCR
   * In a real implementation, this would use:
   * - ML Kit Text Recognition (Google)
   * - Tesseract.js (Open source OCR)
   * - AWS Textract
   * - Azure Computer Vision
   */
  async scanDocument(imageUri: string, expectedType?: string): Promise<DocumentScanResult> {
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate document analysis
      const confidence = Math.random() * 0.4 + 0.6; // 0.6 to 1.0
      const isHighQuality = confidence > 0.8;

      // Mock extracted data based on document type
      const mockData = this.generateMockDocumentData(expectedType, isHighQuality);

      return {
        success: isHighQuality,
        confidence,
        extractedData: mockData,
        rawText: this.generateMockRawText(expectedType),
        errors: isHighQuality ? [] : [
          'Image quality too low',
          'Some text is not clearly visible',
          'Document edges not fully visible'
        ],
      };
    } catch (error) {
      console.error('Document scan error:', error);
      return {
        success: false,
        confidence: 0,
        extractedData: {},
        errors: ['Failed to process document'],
      };
    }
  }

  /**
   * Simulate facial recognition and liveness detection
   * In a real implementation, this would use:
   * - ML Kit Face Detection
   * - AWS Rekognition
   * - Azure Face API
   * - FaceAPI.js (open source)
   */
  async scanFace(imageUri: string): Promise<BiometricScanResult> {
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 3000));

      const confidence = Math.random() * 0.3 + 0.7; // 0.7 to 1.0
      const livenessCheck = Math.random() > 0.15; // 85% success rate
      const qualityScore = Math.random() * 0.3 + 0.7; // 0.7 to 1.0

      const success = confidence > 0.8 && livenessCheck && qualityScore > 0.75;

      const errors: string[] = [];
      if (confidence <= 0.8) errors.push('Face detection confidence too low');
      if (!livenessCheck) errors.push('Liveness check failed - please ensure you are a real person');
      if (qualityScore <= 0.75) errors.push('Image quality insufficient - ensure good lighting');

      return {
        success,
        confidence,
        livenessCheck,
        faceDetected: confidence > 0.5,
        qualityScore,
        errors,
      };
    } catch (error) {
      console.error('Face scan error:', error);
      return {
        success: false,
        confidence: 0,
        livenessCheck: false,
        faceDetected: false,
        qualityScore: 0,
        errors: ['Failed to process biometric data'],
      };
    }
  }

  /**
   * Validate document against known patterns
   */
  validateDocument(scanResult: DocumentScanResult, expectedType?: string): boolean {
    if (!scanResult.success || scanResult.confidence < 0.7) {
      return false;
    }

    const data = scanResult.extractedData;

    switch (expectedType) {
      case 'passport':
        return !!(data.documentNumber && data.fullName && data.dateOfBirth && data.nationality);
      case 'driver_license':
        return !!(data.documentNumber && data.fullName && data.dateOfBirth && data.address);
      case 'national_id':
        return !!(data.documentNumber && data.fullName && data.dateOfBirth);
      case 'utility_bill':
      case 'bank_statement':
        return !!(data.fullName && data.address);
      default:
        return !!(data.fullName || data.documentNumber);
    }
  }

  /**
   * Extract and validate specific data fields
   */
  extractPersonalInfo(scanResult: DocumentScanResult): {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    dateOfBirth?: string;
    address?: string;
    documentNumber?: string;
  } {
    const data = scanResult.extractedData;
    
    let firstName, lastName;
    if (data.fullName) {
      const nameParts = data.fullName.split(' ');
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ');
    }

    return {
      firstName,
      lastName,
      fullName: data.fullName,
      dateOfBirth: data.dateOfBirth,
      address: data.address,
      documentNumber: data.documentNumber,
    };
  }

  /**
   * Check document expiry
   */
  isDocumentValid(scanResult: DocumentScanResult): boolean {
    const data = scanResult.extractedData;
    
    if (data.expiryDate) {
      const expiry = new Date(data.expiryDate);
      const now = new Date();
      return expiry > now;
    }

    // If no expiry date, assume valid
    return true;
  }

  /**
   * Generate mock document data for testing
   */
  private generateMockDocumentData(expectedType?: string, isHighQuality: boolean = true): any {
    if (!isHighQuality) {
      return {
        documentType: expectedType,
        fullName: 'PARTIALLY_READABLE',
      };
    }

    const mockNames = ['John Smith', 'Jane Doe', 'Michael Johnson', 'Sarah Wilson', 'David Brown'];
    const mockName = mockNames[Math.floor(Math.random() * mockNames.length)];

    const baseData = {
      documentType: expectedType,
      fullName: mockName,
      dateOfBirth: '1990-01-15',
    };

    switch (expectedType) {
      case 'passport':
        return {
          ...baseData,
          documentNumber: `P${Math.floor(Math.random() * 10000000)}`,
          nationality: 'United States',
          expiryDate: '2030-12-31',
          issueDate: '2020-01-01',
          gender: 'M',
        };
      case 'driver_license':
        return {
          ...baseData,
          documentNumber: `DL${Math.floor(Math.random() * 1000000)}`,
          address: '123 Main Street, Anytown, ST 12345',
          expiryDate: '2028-01-15',
          issueDate: '2022-01-15',
        };
      case 'national_id':
        return {
          ...baseData,
          documentNumber: `ID${Math.floor(Math.random() * 100000000)}`,
          nationality: 'United States',
          address: '123 Main Street, Anytown, ST 12345',
        };
      case 'utility_bill':
      case 'bank_statement':
        return {
          documentType: expectedType,
          fullName: mockName,
          address: '123 Main Street, Anytown, ST 12345',
          issueDate: new Date().toISOString().split('T')[0],
        };
      default:
        return baseData;
    }
  }

  /**
   * Generate mock raw text for testing
   */
  private generateMockRawText(expectedType?: string): string {
    switch (expectedType) {
      case 'passport':
        return `PASSPORT
United States of America
JOHN SMITH
Date of Birth: 15 JAN 1990
Passport No: P1234567
Nationality: USA
Sex: M
Date of Issue: 01 JAN 2020
Date of Expiry: 31 DEC 2030`;
      case 'driver_license':
        return `DRIVER LICENSE
JOHN SMITH
123 MAIN STREET
ANYTOWN ST 12345
DOB: 01/15/1990
DL: DL123456
EXPIRES: 01/15/2028`;
      case 'utility_bill':
        return `ELECTRIC COMPANY
MONTHLY STATEMENT
JOHN SMITH
123 MAIN STREET
ANYTOWN ST 12345
Account: 123456789
Statement Date: ${new Date().toLocaleDateString()}`;
      default:
        return 'Mock extracted text from document';
    }
  }
}

export const freeDocumentScanner = FreeDocumentScanner.getInstance();
export default freeDocumentScanner;
