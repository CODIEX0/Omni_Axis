# Omni Axis - Real World Asset Tokenization Platform

A comprehensive platform for tokenizing real-world assets with full compliance features for financial and legal purposes.

## 🌟 Features

### Core Platform
- 🏠 **Asset Tokenization**: Convert real-world assets (real estate, art, commodities) into digital tokens
- 🛡️ **Comprehensive Compliance Suite**: Full KYC/AML, tax reporting, and regulatory compliance
- 💼 **Portfolio Management**: Track investments, performance, and returns
- 🏪 **Marketplace**: Buy and sell tokenized assets with integrated wallet support
- 👥 **Community**: Engage with other investors and asset owners
- 📊 **Analytics & Reporting**: Comprehensive insights and compliance reporting

### Compliance & Legal Features
- **KYC/AML Verification**: Identity verification with document upload and biometric checks
- **Anti-Money Laundering**: Automated sanctions screening and PEP checks
- **Tax Reporting**: Generate 1099-B, 8949, Schedule D, and other tax forms
- **Regulatory Filings**: Track SAR, CTR, FBAR, and other regulatory requirements
- **Audit Trails**: Complete transaction and activity logging for compliance
- **Risk Assessment**: Automated risk scoring and monitoring
- **Document Management**: Secure storage and verification of compliance documents
- **Alerts & Monitoring**: Real-time compliance alerts and suspicious activity detection

### Technical Features
- **Blockchain Integration**: Polygon network for low-cost, fast transactions
- **IPFS Storage**: Decentralized storage for asset metadata and documents
- **Multi-Wallet Support**: MetaMask and other wallet integrations
- **Real-time Updates**: Live portfolio and market data
- **Mobile-First Design**: Optimized for mobile and tablet devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g @expo/cli`)
- React Native development environment
- Supabase account (for backend)
- Pinata account (for IPFS storage)

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd omni-axis
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration (see Configuration section below)
```

4. **Set up the database:**
```bash
# Run the SQL scripts in your Supabase dashboard:
# 1. database/compliance_schema.sql (for compliance features)
# 2. Update user_profiles table to include new roles
```

5. **Start the development server:**
```bash
npx expo start
```

## ⚙️ Configuration

### Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your URL and anon key
3. Run the SQL scripts in `database/` to set up tables:
   - `compliance_schema.sql` - Compliance and regulatory tables
   - Update existing tables as needed
4. Add your credentials to `.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### IPFS Setup (Pinata)

1. Create account at [pinata.cloud](https://pinata.cloud)
2. Generate API keys
3. Add to `.env`:
```env
EXPO_PUBLIC_PINATA_API_KEY=your_pinata_api_key_here
EXPO_PUBLIC_PINATA_SECRET_KEY=your_pinata_secret_key_here
```

### Blockchain Setup (Optional)

For full blockchain functionality:
1. Deploy smart contracts to Polygon Mumbai testnet
2. Add contract addresses to `.env`:
```env
EXPO_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS=your_contract_address
EXPO_PUBLIC_ASSET_TOKEN_FACTORY_ADDRESS=your_factory_address
```

## 🎭 Demo Mode

The app includes a comprehensive demo mode for testing and demonstration:

### Accessing Demo Mode
- Click "Use Demo Account" on login/signup screens
- Choose from different role types:
  - **Investor**: Portfolio management and asset purchasing
  - **Issuer**: Asset tokenization and listing
  - **Compliance**: KYC/AML management and regulatory oversight
  - **Admin**: Full system administration

### Demo Features
- Pre-populated realistic data for all features
- Simulated transactions and portfolio performance
- Mock compliance checks and regulatory filings
- No real money or blockchain transactions
- Complete feature demonstration

## 🏗️ Architecture

### Frontend
- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **State Management**: Redux Toolkit
- **UI Components**: Custom component library with Lucide icons
- **Styling**: StyleSheet with consistent design system

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: IPFS via Pinata
- **Real-time**: Supabase Realtime subscriptions

### Blockchain
- **Network**: Polygon (Mumbai testnet)
- **Smart Contracts**: Asset tokenization and marketplace contracts
- **Wallet Integration**: MetaMask and WalletConnect

### Compliance Infrastructure
- **Data Storage**: Encrypted compliance data in Supabase
- **Document Management**: IPFS storage with hash verification
- **Audit Trails**: Immutable transaction logs
- **Risk Scoring**: Automated algorithms with manual review
- **Reporting**: Automated generation of compliance reports

## 📋 Compliance & Legal

### Regulatory Compliance
This platform includes features designed for compliance with:

- **SEC Regulations**: Securities and Exchange Commission requirements
- **AML/BSA**: Anti-Money Laundering and Bank Secrecy Act
- **KYC Requirements**: Know Your Customer verification
- **Tax Reporting**: IRS and international tax obligations
- **GDPR/Privacy**: Data protection and privacy regulations
- **International Standards**: FATF and other international frameworks

### Key Compliance Features

1. **Identity Verification**
   - Document upload and verification
   - Biometric verification
   - Address verification
   - Enhanced due diligence for high-risk customers

2. **Transaction Monitoring**
   - Real-time transaction screening
   - Suspicious activity detection
   - Large transaction reporting
   - Pattern analysis and alerts

3. **Regulatory Reporting**
   - Automated SAR (Suspicious Activity Report) generation
   - CTR (Currency Transaction Report) filing
   - FBAR (Foreign Bank Account Report) support
   - Tax form generation (1099-B, 8949, Schedule D)

4. **Risk Management**
   - Customer risk scoring
   - Ongoing monitoring
   - Sanctions screening
   - PEP (Politically Exposed Person) checks

5. **Audit & Documentation**
   - Complete audit trails
   - Document retention policies
   - Compliance reporting dashboards
   - Regulatory examination support

### ⚠️ Important Legal Notice

This is a demonstration platform designed to showcase compliance capabilities. Before using in production:

1. **Consult Legal Experts**: Engage qualified legal and compliance professionals
2. **Regulatory Review**: Ensure compliance with local and international regulations
3. **Security Audit**: Conduct thorough security assessments
4. **License Requirements**: Obtain necessary licenses and registrations
5. **Insurance**: Secure appropriate insurance coverage

## 🧪 Testing

### Running Tests
```bash
npm test
```

### Demo Account Testing
Use the built-in demo accounts to test all features:
- Each role has pre-configured data and permissions
- Test compliance workflows without real data
- Simulate regulatory scenarios and reporting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Maintain consistent code formatting
- Add tests for new features
- Update documentation as needed
- Ensure compliance features meet regulatory standards

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in this repository
- Check the documentation in `/docs`
- Review the demo mode for feature examples

## 🔮 Roadmap

### Upcoming Features
- [ ] Additional blockchain networks (Ethereum, BSC)
- [ ] Advanced DeFi integrations
- [ ] Institutional investor features
- [ ] Enhanced compliance automation
- [ ] Mobile app store deployment
- [ ] Multi-language support
- [ ] Advanced analytics and reporting

### Compliance Enhancements
- [ ] Additional regulatory frameworks
- [ ] Enhanced risk scoring algorithms
- [ ] Automated regulatory filing
- [ ] Integration with compliance service providers
- [ ] Advanced fraud detection
- [ ] Regulatory change management

---

**Built with ❤️ for the future of asset tokenization and regulatory compliance**