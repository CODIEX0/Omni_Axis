import axios from 'axios';
import { ethers } from 'ethers';
import { config } from '../config';

export interface BankAccount {
  id: string;
  accountNumber: string;
  accountType: 'checking' | 'savings' | 'business';
  balance: number;
  currency: string;
  isActive: boolean;
  kycStatus: 'pending' | 'verified' | 'rejected';
}

export interface FiatToTokenOrder {
  id: string;
  userId: string;
  bankAccountId: string;
  fiatAmount: number;
  fiatCurrency: string;
  tokenAmount: number;
  tokenContract: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  transactionHash?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface TokenToFiatOrder {
  id: string;
  userId: string;
  bankAccountId: string;
  tokenAmount: number;
  tokenContract: string;
  fiatAmount: number;
  fiatCurrency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  transactionHash?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface BankAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

class BankAPIService {
  private apiUrl: string;
  private apiKey: string;
  private headers: Record<string, string>;

  constructor() {
    this.apiUrl = config.BANK_API_URL || 'http://localhost:3002';
    this.apiKey = config.BANK_API_KEY || 'mock_bank_api_key';
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'X-API-Version': '1.0',
    };
  }

  /**
   * Authenticate user with bank API
   */
  async authenticateUser(userId: string, credentials: {
    username: string;
    password: string;
    mfaToken?: string;
  }): Promise<BankAPIResponse<{ accessToken: string; refreshToken: string }>> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/auth/login`,
        { userId, ...credentials },
        { headers: this.headers }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Authentication failed',
        code: error.response?.status?.toString(),
      };
    }
  }

  /**
   * Get user's bank accounts
   */
  async getBankAccounts(userId: string, accessToken: string): Promise<BankAPIResponse<BankAccount[]>> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/accounts/${userId}`,
        {
          headers: {
            ...this.headers,
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch accounts',
        code: error.response?.status?.toString(),
      };
    }
  }

  /**
   * Initiate fiat to token purchase
   */
  async initiateFiatToTokenPurchase(
    userId: string,
    accessToken: string,
    request: {
      bankAccountId: string;
      fiatAmount: number;
      fiatCurrency: string;
      tokenContract: string;
      tokenAmount: number;
      walletAddress: string;
    }
  ): Promise<BankAPIResponse<FiatToTokenOrder>> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/orders/fiat-to-token`,
        {
          userId,
          ...request,
        },
        {
          headers: {
            ...this.headers,
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to initiate purchase',
        code: error.response?.status?.toString(),
      };
    }
  }

  /**
   * Initiate token to fiat sale
   */
  async initiateTokenToFiatSale(
    userId: string,
    accessToken: string,
    request: {
      bankAccountId: string;
      tokenContract: string;
      tokenAmount: number;
      fiatAmount: number;
      fiatCurrency: string;
      walletAddress: string;
    }
  ): Promise<BankAPIResponse<TokenToFiatOrder>> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/orders/token-to-fiat`,
        {
          userId,
          ...request,
        },
        {
          headers: {
            ...this.headers,
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to initiate sale',
        code: error.response?.status?.toString(),
      };
    }
  }

  /**
   * Get order status
   */
  async getOrderStatus(
    orderId: string,
    accessToken: string
  ): Promise<BankAPIResponse<FiatToTokenOrder | TokenToFiatOrder>> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/orders/${orderId}`,
        {
          headers: {
            ...this.headers,
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get order status',
        code: error.response?.status?.toString(),
      };
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(
    orderId: string,
    accessToken: string
  ): Promise<BankAPIResponse<{ cancelled: boolean }>> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/orders/${orderId}/cancel`,
        {},
        {
          headers: {
            ...this.headers,
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to cancel order',
        code: error.response?.status?.toString(),
      };
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(
    userId: string,
    accessToken: string,
    params?: {
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
      status?: string;
    }
  ): Promise<BankAPIResponse<(FiatToTokenOrder | TokenToFiatOrder)[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());
      if (params?.startDate) queryParams.append('startDate', params.startDate.toISOString());
      if (params?.endDate) queryParams.append('endDate', params.endDate.toISOString());
      if (params?.status) queryParams.append('status', params.status);

      const response = await axios.get(
        `${this.apiUrl}/transactions/${userId}?${queryParams.toString()}`,
        {
          headers: {
            ...this.headers,
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get transaction history',
        code: error.response?.status?.toString(),
      };
    }
  }

  /**
   * Verify bank account ownership
   */
  async verifyBankAccount(
    userId: string,
    accessToken: string,
    request: {
      bankAccountId: string;
      verificationMethod: 'micro_deposits' | 'instant_verification';
      verificationData?: {
        deposit1?: number;
        deposit2?: number;
        routingNumber?: string;
        accountNumber?: string;
      };
    }
  ): Promise<BankAPIResponse<{ verified: boolean; status: string }>> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/accounts/verify`,
        {
          userId,
          ...request,
        },
        {
          headers: {
            ...this.headers,
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to verify account',
        code: error.response?.status?.toString(),
      };
    }
  }

  /**
   * Get supported currencies and exchange rates
   */
  async getSupportedCurrencies(): Promise<BankAPIResponse<{
    currencies: string[];
    exchangeRates: Record<string, number>;
  }>> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/currencies`,
        { headers: this.headers }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get currencies',
        code: error.response?.status?.toString(),
      };
    }
  }

  /**
   * Get compliance status for user
   */
  async getComplianceStatus(
    userId: string,
    accessToken: string
  ): Promise<BankAPIResponse<{
    kycStatus: 'pending' | 'verified' | 'rejected';
    amlStatus: 'clear' | 'flagged' | 'under_review';
    complianceLevel: 'basic' | 'enhanced' | 'institutional';
    lastReviewDate: Date;
    nextReviewDate: Date;
  }>> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/compliance/${userId}`,
        {
          headers: {
            ...this.headers,
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get compliance status',
        code: error.response?.status?.toString(),
      };
    }
  }

  /**
   * Request compliance review
   */
  async requestComplianceReview(
    userId: string,
    accessToken: string,
    request: {
      reviewType: 'kyc' | 'aml' | 'full';
      urgency: 'low' | 'medium' | 'high';
      reason?: string;
      documents?: string[]; // IPFS hashes or URLs
    }
  ): Promise<BankAPIResponse<{ reviewId: string; estimatedCompletion: Date }>> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/compliance/review`,
        {
          userId,
          ...request,
        },
        {
          headers: {
            ...this.headers,
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to request review',
        code: error.response?.status?.toString(),
      };
    }
  }
}

export const bankAPIService = new BankAPIService();
