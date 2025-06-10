import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface KYCDocument {
  id: string;
  type: 'id' | 'address' | 'selfie' | 'additional';
  name: string;
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface KYCStep {
  id: string;
  name: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'rejected';
  required: boolean;
  documents: KYCDocument[];
}

interface KYCState {
  currentStep: number;
  steps: KYCStep[];
  overallStatus: 'not_started' | 'in_progress' | 'under_review' | 'approved' | 'rejected';
  isLoading: boolean;
  error: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
}

const initialState: KYCState = {
  currentStep: 0,
  steps: [
    {
      id: 'identity',
      name: 'Identity Verification',
      status: 'not_started',
      required: true,
      documents: [],
    },
    {
      id: 'address',
      name: 'Address Verification',
      status: 'not_started',
      required: true,
      documents: [],
    },
    {
      id: 'biometric',
      name: 'Biometric Verification',
      status: 'not_started',
      required: true,
      documents: [],
    },
    {
      id: 'review',
      name: 'Review & Submit',
      status: 'not_started',
      required: true,
      documents: [],
    },
  ],
  overallStatus: 'not_started',
  isLoading: false,
  error: null,
  submittedAt: null,
  reviewedAt: null,
  rejectionReason: null,
};

// Async thunks
export const uploadDocument = createAsyncThunk(
  'kyc/uploadDocument',
  async ({ 
    stepId, 
    documentType, 
    file 
  }: { 
    stepId: string; 
    documentType: string; 
    file: any; 
  }) => {
    // Simulate file upload
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const document: KYCDocument = {
      id: Date.now().toString(),
      type: documentType as any,
      name: file.name || `${documentType}_document`,
      url: `https://storage.example.com/${Date.now()}_${file.name}`,
      status: 'pending',
      uploadedAt: new Date().toISOString(),
    };

    return { stepId, document };
  }
);

export const submitKYC = createAsyncThunk(
  'kyc/submit',
  async () => {
    // Simulate KYC submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      submittedAt: new Date().toISOString(),
    };
  }
);

export const fetchKYCStatus = createAsyncThunk(
  'kyc/fetchStatus',
  async () => {
    // Simulate API call to fetch KYC status
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      overallStatus: 'approved' as const,
      reviewedAt: new Date().toISOString(),
    };
  }
);

const kycSlice = createSlice({
  name: 'kyc',
  initialState,
  reducers: {
    setCurrentStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
    },
    updateStepStatus: (state, action: PayloadAction<{ stepId: string; status: KYCStep['status'] }>) => {
      const step = state.steps.find(s => s.id === action.payload.stepId);
      if (step) {
        step.status = action.payload.status;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    resetKYC: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // Upload Document
      .addCase(uploadDocument.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadDocument.fulfilled, (state, action) => {
        state.isLoading = false;
        const step = state.steps.find(s => s.id === action.payload.stepId);
        if (step) {
          step.documents.push(action.payload.document);
          step.status = 'completed';
        }
        state.error = null;
      })
      .addCase(uploadDocument.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to upload document';
      })
      // Submit KYC
      .addCase(submitKYC.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(submitKYC.fulfilled, (state, action) => {
        state.isLoading = false;
        state.overallStatus = 'under_review';
        state.submittedAt = action.payload.submittedAt;
        state.error = null;
      })
      .addCase(submitKYC.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to submit KYC';
      })
      // Fetch KYC Status
      .addCase(fetchKYCStatus.fulfilled, (state, action) => {
        state.overallStatus = action.payload.overallStatus;
        state.reviewedAt = action.payload.reviewedAt;
      });
  },
});

export const { 
  setCurrentStep, 
  updateStepStatus, 
  clearError, 
  resetKYC 
} = kycSlice.actions;
export default kycSlice.reducer;