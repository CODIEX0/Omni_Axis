import Constants from 'expo-constants';
// import { Chain } from '@thirdweb-dev/sdk';

interface Chain {
  chainId: number;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpc: string[];
  blockExplorers: Array<{
    name: string;
    url: string;
  }>;
  testnet: boolean;
}

// Environment variables
export const ENV = {
  API_URL: Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || 'https://api.omniaxis.com',
  THIRDWEB_CLIENT_ID: Constants.expoConfig?.extra?.EXPO_PUBLIC_THIRDWEB_CLIENT_ID || '5500bc58013187faab5e562881e117b4',
  THIRDWEB_SECRET_KEY: Constants.expoConfig?.extra?.EXPO_PUBLIC_THIRDWEB_SECRET_KEY || 'o5AvaQTd6vjNOLNoKOug0hvIvek0wArDulnyxNbNAP8ugNYXkvsrd9FAmXehiQ7hLg7CSc2T-bWz1n8egwXuaQ',
  SUPABASE_URL: Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || 'https://frdiliqbwdvckwbabfzn.supabase.co',
  SUPABASE_ANON_KEY: Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyZGlsaXFid2R2Y2t3YmFiZnpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNzY0NjYsImV4cCI6MjA2NTY1MjQ2Nn0.jRCuBieJd2TnDZ3yIjLQVclGRbPFoWZCiWzj1oZVetg',
  PINATA_API_KEY: Constants.expoConfig?.extra?.EXPO_PUBLIC_PINATA_API_KEY || 'https://gateway.pinata.cloud/ipfs',
  PINATA_SECRET_KEY: Constants.expoConfig?.extra?.EXPO_PUBLIC_PINATA_SECRET_KEY || 'ea6f04e57ef5c5c3d7fa4296d6f4e8c0ba5eb74903e803b2484fe267a87cdedd',
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
  { 
    id: 'real_estate',
    value: 'real_estate', 
    label: 'Real Estate',
    name: 'Real Estate',
    description: 'Commercial & residential properties',
    color: '#1E40AF',
    icon: 'Building'
  },
  { 
    id: 'art',
    value: 'art', 
    label: 'Art & Collectibles',
    name: 'Art & Collectibles',
    description: 'Artwork, antiques, and collectibles',
    color: '#8B5CF6',
    icon: 'Palette'
  },
  { 
    id: 'commodities',
    value: 'commodities', 
    label: 'Commodities',
    name: 'Commodities',
    description: 'Precious metals, oil, and raw materials',
    color: '#F59E0B',
    icon: 'Zap'
  },
  { 
    id: 'collectibles',
    value: 'collectibles', 
    label: 'Collectibles',
    name: 'Collectibles',
    description: 'Luxury goods, watches, and rare items',
    color: '#EF4444',
    icon: 'Star'
  },
  { 
    id: 'bonds',
    value: 'bonds', 
    label: 'Bonds',
    name: 'Bonds',
    description: 'Corporate and government bonds',
    color: '#10B981',
    icon: 'TrendingUp'
  },
  { 
    id: 'equity',
    value: 'equity', 
    label: 'Equity',
    name: 'Equity',
    description: 'Private equity and business shares',
    color: '#6366F1',
    icon: 'Building'
  },
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
