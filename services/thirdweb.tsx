import { 
  ThirdwebProvider, 
  metamaskWallet, 
  coinbaseWallet, 
  walletConnect,
  ChainId,
} from '@thirdweb-dev/react-native';
import { POLYGON_MUMBAI, ENV } from '../constants';

// Wallet configuration
export const supportedWallets = [
  metamaskWallet(),
  coinbaseWallet(),
  walletConnect({
    projectId: ENV.THIRDWEB_CLIENT_ID, // Use your WalletConnect project ID
  }),
];

// Thirdweb Provider Props
export const thirdwebConfig = {
  clientId: ENV.THIRDWEB_CLIENT_ID,
  activeChain: POLYGON_MUMBAI as any,
  supportedWallets,
  supportedChains: [POLYGON_MUMBAI] as any,
  dAppMeta: {
    name: 'Omni Axis',
    description: 'Real World Asset Tokenization Platform',
    logoUrl: 'https://omniaxis.com/logo.png',
    url: 'https://omniaxis.com',
    isDarkMode: false,
  },
};

// Thirdweb Provider Component
export const ThirdwebProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThirdwebProvider
      clientId={thirdwebConfig.clientId}
      activeChain={thirdwebConfig.activeChain}
      supportedWallets={thirdwebConfig.supportedWallets}
      supportedChains={thirdwebConfig.supportedChains}
      dAppMeta={thirdwebConfig.dAppMeta}
    >
      {children}
    </ThirdwebProvider>
  );
};
