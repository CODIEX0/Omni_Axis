import Constants from 'expo-constants';
import { Chain } from '@thirdweb-dev/sdk';

// Environment variables
export const ENV = {
  API_URL: Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || 'https://api.omniaxis.com',
  THIRDWEB_CLIENT_ID: Constants.expoConfig?.extra?.EXPO_PUBLIC_THIRDWEB_CLIENT_ID || '',
  THIRDWEB_SECRET_KEY: Constants.expoConfig?.extra?.EXPO_PUBLIC_THIRDWEB_SECRET_KEY || '',
  SUPABASE_URL: Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  PINATA_API_KEY: Constants.expoConfig?.extra?.EXPO_PUBLIC_PINATA_API_KEY || '',
  PINATA_SECRET_KEY: Constants.expoConfig?.extra?.EXPO_PUBLIC_PINATA_SECRET_KEY || '',
  IPFS_GATEWAY_URL: Constants.expoConfig?.extra?.EXPO_PUBLIC_IPFS_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs',
};

// Contract Addresses
export const CONTRACTS = {
  MARKETPLACE: Constants.expoConfig?.extra?.EXPO_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS || '',
  ASSET_TOKEN: Constants.expoConfig?.extra?.EXPO_PUBLIC_ASSET_TOKEN_CONTRACT_ADDRESS || '',
  ASSET_TOKEN_FACTORY: Constants.expoConfig?.extra?.EXPO_PUBLIC_ASSET_TOKEN_FACTORY_ADDRESS || '',
};

// Chain Configuration
export const POLYGON_MUMBAI: Chain = {
  chainId: 80001,
  name: 'Polygon Mumbai',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
  rpc: ['https://rpc-mumbai.maticvigil.com'],
  blockExplorers: [
    {
      name: 'PolygonScan',
      url: 'https://mumbai.polygonscan.com',
    },
  ],
  testnet: true,
};

// Supported Chains
export const SUPPORTED_CHAINS = [POLYGON_MUMBAI];

// Asset Types
export const ASSET_TYPES = [
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'art', label: 'Art & Collectibles' },
  { value: 'commodity', label: 'Commodities' },
  { value: 'intellectual_property', label: 'Intellectual Property' },
  { value: 'equipment', label: 'Equipment & Machinery' },
  { value: 'vehicle', label: 'Vehicles' },
  { value: 'other', label: 'Other' },
];

// KYC Status
export const KYC_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  NOT_STARTED: 'not_started',
};

// User Roles
export const USER_ROLES = {
  BUYER: 'buyer',
  SELLER: 'seller',
  ADMIN: 'admin',
};

// Transaction Status
export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  FAILED: 'failed',
};

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  USER: {
    PROFILE: '/user/profile',
    KYC: '/user/kyc',
    TRANSACTIONS: '/user/transactions',
  },
  ASSETS: {
    LIST: '/assets',
    CREATE: '/assets',
    UPDATE: '/assets',
    DELETE: '/assets',
  },
  ADMIN: {
    USERS: '/admin/users',
    ASSETS: '/admin/assets',
    KYC: '/admin/kyc',
  },
};

// App Configuration
export const APP_CONFIG = {
  NAME: 'Omni Axis',
  VERSION: '1.0.0',
  DESCRIPTION: 'Real World Asset Tokenization Platform',
  SUPPORT_EMAIL: 'support@omniaxis.com',
  PRIVACY_URL: 'https://omniaxis.com/privacy',
  TERMS_URL: 'https://omniaxis.com/terms',
};

// Styling Constants
export const COLORS = {
  PRIMARY: '#1E40AF',
  SECONDARY: '#7C3AED',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  BACKGROUND: '#F8FAFC',
  SURFACE: '#FFFFFF',
  TEXT_PRIMARY: '#1F2937',
  TEXT_SECONDARY: '#6B7280',
  BORDER: '#E5E7EB',
};

export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
};

export const FONT_SIZES = {
  XS: 12,
  SM: 14,
  MD: 16,
  LG: 18,
  XL: 20,
  XXL: 24,
  XXXL: 32,
};
