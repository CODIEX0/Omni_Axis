import Constants from 'expo-constants';

const getEnvVar = (name: string, defaultValue?: string): string => {
  return Constants.expoConfig?.extra?.[name] || process.env[name] || defaultValue || '';
};

export const config = {
  // API Configuration
  API_URL: getEnvVar('EXPO_PUBLIC_API_URL', 'http://localhost:3001'),
  WEB3_PROVIDER_URL: getEnvVar('EXPO_PUBLIC_WEB3_PROVIDER_URL', 'http://127.0.0.1:7545'),

  // Thirdweb Configuration
  THIRDWEB_CLIENT_ID: getEnvVar('EXPO_PUBLIC_THIRDWEB_CLIENT_ID'),
  THIRDWEB_SECRET_KEY: getEnvVar('EXPO_PUBLIC_THIRDWEB_SECRET_KEY'),

  // Contract Addresses
  MARKETPLACE_CONTRACT_ADDRESS: getEnvVar('EXPO_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS'),
  ASSET_TOKEN_CONTRACT_ADDRESS: getEnvVar('EXPO_PUBLIC_ASSET_TOKEN_CONTRACT_ADDRESS'),
  ASSET_TOKEN_FACTORY_ADDRESS: getEnvVar('EXPO_PUBLIC_ASSET_TOKEN_FACTORY_ADDRESS'),
  DECENTRALIZED_KYC_ADDRESS: getEnvVar('EXPO_PUBLIC_DECENTRALIZED_KYC_ADDRESS'),

  // IPFS Configuration
  IPFS_GATEWAY_URL: getEnvVar('EXPO_PUBLIC_IPFS_GATEWAY_URL', 'https://gateway.pinata.cloud/ipfs'),
  PINATA_API_KEY: getEnvVar('EXPO_PUBLIC_PINATA_API_KEY'),
  PINATA_SECRET_KEY: getEnvVar('EXPO_PUBLIC_PINATA_SECRET_KEY'),

  // Supabase Configuration
  SUPABASE_URL: getEnvVar('EXPO_PUBLIC_SUPABASE_URL'),
  SUPABASE_ANON_KEY: getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY'),

  // KYC Configuration
  ONFIDO_API_KEY: getEnvVar('EXPO_PUBLIC_ONFIDO_API_KEY'),
  ONFIDO_SDK_TOKEN: getEnvVar('EXPO_PUBLIC_ONFIDO_SDK_TOKEN'),

  // Payment Configuration
  STRIPE_PUBLISHABLE_KEY: getEnvVar('EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
  MOONPAY_API_KEY: getEnvVar('EXPO_PUBLIC_MOONPAY_API_KEY'),

  // Chain Configuration
  CHAIN_ID: parseInt(getEnvVar('EXPO_PUBLIC_CHAIN_ID', '1337')),
  CHAIN_NAME: getEnvVar('EXPO_PUBLIC_CHAIN_NAME', 'Ganache Local'),
  CHAIN_RPC_URL: getEnvVar('EXPO_PUBLIC_CHAIN_RPC_URL', 'http://127.0.0.1:7545'),
  CHAIN_NATIVE_CURRENCY_NAME: getEnvVar('EXPO_PUBLIC_CHAIN_NATIVE_CURRENCY_NAME', 'Ethereum'),
  CHAIN_NATIVE_CURRENCY_SYMBOL: getEnvVar('EXPO_PUBLIC_CHAIN_NATIVE_CURRENCY_SYMBOL', 'ETH'),
  CHAIN_NATIVE_CURRENCY_DECIMALS: parseInt(getEnvVar('EXPO_PUBLIC_CHAIN_NATIVE_CURRENCY_DECIMALS', '18')),
  CHAIN_BLOCK_EXPLORER_URL: getEnvVar('EXPO_PUBLIC_CHAIN_BLOCK_EXPLORER_URL', 'http://127.0.0.1:7545'),

  // AI Services
  OPENAI_API_KEY: getEnvVar('EXPO_PUBLIC_OPENAI_API_KEY'),
  DEEPSEEK_API_KEY: getEnvVar('EXPO_PUBLIC_DEEPSEEK_API_KEY'),
  DEEPSEEK_API_URL: getEnvVar('EXPO_PUBLIC_DEEPSEEK_API_URL', 'https://api.deepseek.com/v1'),

  // Bank API Integration
  BANK_API_URL: getEnvVar('EXPO_PUBLIC_BANK_API_URL', 'http://localhost:3002'),
  BANK_API_KEY: getEnvVar('EXPO_PUBLIC_BANK_API_KEY', 'mock_bank_api_key'),

  // Security and Privacy
  ENCRYPTION_KEY: getEnvVar('EXPO_PUBLIC_ENCRYPTION_KEY'),
  JWT_SECRET: getEnvVar('EXPO_PUBLIC_JWT_SECRET'),
};

// Chain configuration object for wallet connections
export const chainConfig = {
  chainId: config.CHAIN_ID,
  name: config.CHAIN_NAME,
  rpcUrls: [config.CHAIN_RPC_URL],
  nativeCurrency: {
    name: config.CHAIN_NATIVE_CURRENCY_NAME,
    symbol: config.CHAIN_NATIVE_CURRENCY_SYMBOL,
    decimals: config.CHAIN_NATIVE_CURRENCY_DECIMALS,
  },
  blockExplorerUrls: [config.CHAIN_BLOCK_EXPLORER_URL],
};

export default config;
