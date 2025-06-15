# Omni Axis - Real World Asset Tokenization Platform

A comprehensive blockchain-based platform for tokenizing and trading real-world assets including real estate, art, commodities, and luxury goods.

## 🌟 Features

### Mobile Application (React Native)
- **Multi-platform Support**: iOS, Android, and Web
- **User Authentication**: Email/password, biometric authentication, 2FA
- **KYC/AML Compliance**: Document upload, identity verification, address verification
- **Asset Marketplace**: Browse, filter, and invest in tokenized assets
- **Portfolio Management**: Track investments, view performance, manage holdings
- **Asset Tokenization**: Submit assets for tokenization with comprehensive workflow
- **Wallet Integration**: Connect Web3 wallets, manage crypto transactions
- **Multi-language Support**: English, French, Portuguese, Swahili
- **Offline Capabilities**: Local caching for critical functionality

### Smart Contracts (Solidity)
- **AssetToken**: ERC-20 tokens representing fractional asset ownership
- **AssetTokenFactory**: Gas-efficient token deployment using minimal proxy pattern
- **Marketplace**: Decentralized order book for trading asset tokens
- **ChainlinkPriceOracle**: Real-world asset price feeds with emergency fallbacks

### Key Technologies
- **Frontend**: React Native (Expo), TypeScript, Redux Toolkit
- **Blockchain**: Polygon PoS, Ethereum-compatible smart contracts
- **Backend**: Node.js microservices architecture (planned)
- **Storage**: IPFS for asset metadata and documents
- **Oracles**: Chainlink for price feeds and asset verification

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Expo CLI: `npm install -g @expo/cli`
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/omni-axis-rwa-platform.git
   cd omni-axis-rwa-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Copy `.env.example` to `.env` and update the values:
   ```bash
   cp .env.example .env
   ```
   
   **Important**: Update the following keys for real KYC verification:
   - `EXPO_PUBLIC_DIDIT_API_KEY`: Get your free API key from [Didit](https://didit.me) for real document scanning and facial recognition
   - Other API keys as needed for full functionality
   
   The application uses **Didit's real KYC service** for:
   - Document verification (passport, driver's license, ID cards)
   - Biometric facial recognition and liveness detection
   - Real-time identity verification with confidence scores
   - No simulation - actual document OCR and face matching

4. **Start the development server**
   ```bash
   npm run dev
   ```

### Smart Contract Development

1. **Navigate to smart contracts directory**
   ```bash
   cd smart-contracts
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Compile contracts**
   ```bash
   npm run compile
   ```

4. **Run tests**
   ```bash
   npm run test
   ```

5. **Deploy to testnet**
   ```bash
   npm run deploy:testnet
   ```

## 📱 Mobile App Architecture

### State Management
- **Redux Toolkit**: Centralized state management
- **Redux Persist**: Offline data persistence
- **MMKV**: High-performance key-value storage

### Key Features Implementation

#### Authentication & Security
```typescript
// Biometric authentication
const { authenticate } = useBiometric();
const success = await authenticate();

// Secure storage
import * as SecureStore from 'expo-secure-store';
await SecureStore.setItemAsync('userToken', token);
```

#### Asset Management
```typescript
// Fetch marketplace assets
dispatch(fetchMarketplaceAssets());

// Filter and search
dispatch(setFilters({ category: 'real-estate' }));
dispatch(setSearchQuery('Manhattan'));
```

#### Wallet Integration
```typescript
// Connect wallet
dispatch(connectWallet());

// Send transaction
dispatch(sendTransaction({ to, amount, symbol }));
```

## 🔗 Smart Contracts

### Contract Addresses (Polygon Testnet)
- **AssetTokenFactory**: `0x...` (deployed via scripts)
- **Marketplace**: `0x...` (deployed via scripts)
- **ChainlinkPriceOracle**: `0x...` (deployed via scripts)

### Key Contract Features

#### AssetToken.sol
- ERC-20 compliant with dividend distribution
- Role-based access control
- Pausable functionality
- Upgradeable using UUPS pattern

#### Marketplace.sol
- Order book trading system
- Market and limit orders
- Automatic order matching
- Fee collection mechanism

#### AssetTokenFactory.sol
- Minimal proxy pattern for gas efficiency
- Asset registry and management
- Creation fee mechanism

## 🌐 API Integration

### Environment Variables
```bash
# Blockchain
EXPO_PUBLIC_WEB3_PROVIDER_URL=https://polygon-rpc.com
EXPO_PUBLIC_CHAINLINK_ORACLE_ADDRESS=0x...

# Services
EXPO_PUBLIC_IPFS_GATEWAY_URL=https://gateway.pinata.cloud/ipfs
EXPO_PUBLIC_KYC_PROVIDER_API_KEY=your_kyc_key
EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

### Third-party Integrations
- **Chainlink**: Price oracles and asset verification
- **IPFS/Pinata**: Decentralized storage for asset metadata
- **WalletConnect**: Multi-wallet support
- **Stripe/MoonPay**: Fiat on/off-ramps

## 🧪 Testing

### Mobile App Testing
```bash
# Unit tests
npm test

# E2E tests (requires setup)
npm run test:e2e
```

### Smart Contract Testing
```bash
cd smart-contracts
npm run test
npm run coverage
```

### Test Coverage
- Smart contracts: 95%+ coverage required
- Mobile app: 80%+ coverage target
- Integration tests for critical user flows

## 🚀 Deployment

### Mobile App Deployment

#### Development Build
```bash
# iOS
npm run build:ios

# Android
npm run build:android
```

#### Production Deployment
```bash
# Build for app stores
eas build --platform all --profile production

# Submit to stores
eas submit --platform all
```

### Smart Contract Deployment

#### Testnet Deployment
```bash
cd smart-contracts
npm run deploy:testnet
```

#### Mainnet Deployment
```bash
cd smart-contracts
npm run deploy:mainnet
npm run verify
```

## 🔒 Security

### Security Measures
- **Smart Contract Audits**: Required before mainnet deployment
- **Access Control**: Role-based permissions throughout
- **Rate Limiting**: API and transaction rate limits
- **Input Validation**: Comprehensive validation on all inputs
- **Secure Storage**: Sensitive data encrypted at rest

### Security Best Practices
- Regular dependency updates
- Automated security scanning
- Bug bounty program (planned)
- Multi-signature wallets for admin functions

## 🌍 Internationalization

### Supported Languages
- English (en)
- French (fr)
- Portuguese (pt)
- Swahili (sw)

### Adding New Languages
1. Create translation file: `i18n/locales/{language}.json`
2. Add language to `i18n/index.ts`
3. Update language selector in settings

## 📊 Analytics & Monitoring

### Monitoring Stack
- **Sentry**: Error tracking and performance monitoring
- **Analytics**: User behavior and app performance
- **Smart Contract Events**: On-chain activity monitoring

### Key Metrics
- User acquisition and retention
- Transaction volume and success rates
- Asset tokenization pipeline metrics
- Platform revenue and fees collected

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Standards
- TypeScript for type safety
- ESLint + Prettier for code formatting
- Conventional commits for commit messages
- Comprehensive testing required

### Review Process
- All PRs require review
- Automated testing must pass
- Security review for smart contract changes
- Performance impact assessment

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [API Documentation](docs/api.md)
- [Smart Contract Documentation](docs/contracts.md)
- [User Guide](docs/user-guide.md)

### Community
- [Discord](https://discord.gg/omniaxis)
- [Telegram](https://t.me/omniaxis)
- [Twitter](https://twitter.com/omniaxis)

### Support Channels
- GitHub Issues for bug reports
- Email: support@omniaxis.com
- Documentation: docs.omniaxis.com

---

**Built with ❤️ by the Omni Axis Team**

*Democratizing access to real-world assets through blockchain technology*