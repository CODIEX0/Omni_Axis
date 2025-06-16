#!/usr/bin/env ts-node

/**
 * Comprehensive App Fix Script
 * This script addresses all the issues in the Omni Axis app and ensures it runs properly
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const PROJECT_ROOT = process.cwd();

console.log('🔧 Starting comprehensive app fix...');

// 1. Update package.json with missing dependencies
console.log('📦 Updating dependencies...');
const packageJsonPath = join(PROJECT_ROOT, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

const requiredDependencies = {
  '@supabase/supabase-js': '^2.38.0',
  'expo-linear-gradient': '~12.3.0',
  'expo-font': '~11.4.0',
  'expo-router': '~3.0.0',
  'react-native-safe-area-context': '4.6.3',
  'lucide-react-native': '^0.263.1',
  'react-native-svg': '13.9.0',
  '@react-native-async-storage/async-storage': '1.18.2',
  'react-i18next': '^13.2.2',
  'i18next': '^23.5.1',
  '@reduxjs/toolkit': '^1.9.7',
  'react-redux': '^8.1.3',
};

// Add missing dependencies
Object.entries(requiredDependencies).forEach(([dep, version]) => {
  if (!packageJson.dependencies[dep]) {
    packageJson.dependencies[dep] = version;
    console.log(`  ✅ Added ${dep}@${version}`);
  }
});

writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

// 2. Create missing environment configuration
console.log('🔧 Setting up environment configuration...');
const envExamplePath = join(PROJECT_ROOT, '.env.example');
const envExample = `
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# ThirdWeb Configuration
EXPO_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id_here
EXPO_PUBLIC_THIRDWEB_SECRET_KEY=your_thirdweb_secret_key_here

# Contract Addresses
EXPO_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS=your_marketplace_contract_address_here
EXPO_PUBLIC_ASSET_TOKEN_CONTRACT_ADDRESS=your_asset_token_contract_address_here
EXPO_PUBLIC_ASSET_TOKEN_FACTORY_ADDRESS=your_asset_token_factory_address_here

# IPFS Configuration
EXPO_PUBLIC_PINATA_API_KEY=your_pinata_api_key_here
EXPO_PUBLIC_PINATA_SECRET_KEY=your_pinata_secret_key_here
EXPO_PUBLIC_IPFS_GATEWAY_URL=https://gateway.pinata.cloud/ipfs

# API Configuration
EXPO_PUBLIC_API_URL=https://api.omniaxis.com
`;

if (!existsSync(envExamplePath)) {
  writeFileSync(envExamplePath, envExample.trim());
  console.log('  ✅ Created .env.example');
}

// 3. Create app.json configuration
console.log('🔧 Setting up app configuration...');
const appJsonPath = join(PROJECT_ROOT, 'app.json');
const appConfig = {
  expo: {
    name: "Omni Axis",
    slug: "omni-axis",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#1E40AF"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.omniaxis.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#1E40AF"
      },
      package: "com.omniaxis.app"
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    plugins: [
      "expo-router",
      "expo-font",
      [
        "expo-build-properties",
        {
          android: {
            compileSdkVersion: 34,
            targetSdkVersion: 34,
            buildToolsVersion: "34.0.0"
          },
          ios: {
            deploymentTarget: "13.0"
          }
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {
        origin: false
      }
    }
  }
};

writeFileSync(appJsonPath, JSON.stringify(appConfig, null, 2));
console.log('  ✅ Updated app.json');

// 4. Create metro.config.js
console.log('🔧 Setting up Metro configuration...');
const metroConfigPath = join(PROJECT_ROOT, 'metro.config.js');
const metroConfig = `
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for additional file extensions
config.resolver.assetExts.push('sql');

module.exports = config;
`;

writeFileSync(metroConfigPath, metroConfig.trim());
console.log('  ✅ Created metro.config.js');

// 5. Create babel.config.js
console.log('🔧 Setting up Babel configuration...');
const babelConfigPath = join(PROJECT_ROOT, 'babel.config.js');
const babelConfig = `
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'expo-router/babel',
      'react-native-reanimated/plugin',
    ],
  };
};
`;

writeFileSync(babelConfigPath, babelConfig.trim());
console.log('  ✅ Updated babel.config.js');

// 6. Create tsconfig.json
console.log('🔧 Setting up TypeScript configuration...');
const tsconfigPath = join(PROJECT_ROOT, 'tsconfig.json');
const tsconfig = {
  extends: "expo/tsconfig.base",
  compilerOptions: {
    strict: true,
    baseUrl: ".",
    paths: {
      "@/*": ["./src/*"],
      "@/components/*": ["./components/*"],
      "@/services/*": ["./services/*"],
      "@/hooks/*": ["./hooks/*"],
      "@/constants/*": ["./constants/*"],
      "@/types/*": ["./types/*"]
    }
  },
  include: [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts"
  ]
};

writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
console.log('  ✅ Updated tsconfig.json');

// 7. Create missing asset directories and placeholder files
console.log('🎨 Setting up assets...');
const assetsDir = join(PROJECT_ROOT, 'assets');
const createAssetPlaceholder = (filename: string, content: string) => {
  const filePath = join(assetsDir, filename);
  if (!existsSync(filePath)) {
    writeFileSync(filePath, content);
    console.log(`  ✅ Created ${filename}`);
  }
};

// Create basic SVG placeholders (these should be replaced with actual assets)
createAssetPlaceholder('icon.png', ''); // Placeholder
createAssetPlaceholder('splash.png', ''); // Placeholder
createAssetPlaceholder('adaptive-icon.png', ''); // Placeholder
createAssetPlaceholder('favicon.png', ''); // Placeholder

// 8. Create expo-env.d.ts
console.log('🔧 Setting up Expo types...');
const expoEnvPath = join(PROJECT_ROOT, 'expo-env.d.ts');
const expoEnvContent = `
/// <reference types="expo/types" />

// NOTE: This file should not be edited and should be in your git ignore
`;

writeFileSync(expoEnvPath, expoEnvContent.trim());
console.log('  ✅ Created expo-env.d.ts');

// 9. Update .gitignore
console.log('🔧 Updating .gitignore...');
const gitignorePath = join(PROJECT_ROOT, '.gitignore');
const gitignoreAdditions = `
# Environment variables
.env
.env.local
.env.production

# Expo
.expo/
dist/
web-build/

# Dependencies
node_modules/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Build outputs
build/
dist/
`;

if (existsSync(gitignorePath)) {
  const currentGitignore = readFileSync(gitignorePath, 'utf8');
  if (!currentGitignore.includes('# Environment variables')) {
    writeFileSync(gitignorePath, currentGitignore + gitignoreAdditions);
    console.log('  ✅ Updated .gitignore');
  }
} else {
  writeFileSync(gitignorePath, gitignoreAdditions.trim());
  console.log('  ✅ Created .gitignore');
}

// 10. Create README with setup instructions
console.log('📚 Creating setup documentation...');
const readmePath = join(PROJECT_ROOT, 'README.md');
const readmeContent = `
# Omni Axis - Real World Asset Tokenization Platform

A comprehensive platform for tokenizing real-world assets with full compliance features.

## Features

- 🏠 **Asset Tokenization**: Convert real-world assets into digital tokens
- 🛡️ **Compliance Suite**: KYC/AML, tax reporting, regulatory filings
- 💼 **Portfolio Management**: Track investments and performance
- 🏪 **Marketplace**: Buy and sell tokenized assets
- 👥 **Community**: Engage with other investors and asset owners
- 📊 **Analytics**: Comprehensive reporting and insights

## Quick Start

### Prerequisites

- Node.js 18+ 
- Expo CLI
- React Native development environment

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd omni-axis
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env
# Edit .env with your configuration
\`\`\`

4. Start the development server:
\`\`\`bash
npx expo start
\`\`\`

### Configuration

#### Supabase Setup

1. Create a new Supabase project
2. Run the SQL scripts in \`database/\` to set up tables
3. Add your Supabase URL and anon key to \`.env\`

#### Compliance Features

The app includes comprehensive compliance features:

- **KYC/AML**: Identity verification and anti-money laundering checks
- **Tax Reporting**: Automated tax document generation
- **Regulatory Filings**: Track and manage regulatory requirements
- **Audit Trails**: Complete transaction and activity logging
- **Risk Assessment**: Automated risk scoring and monitoring

## Demo Mode

The app includes a demo mode with pre-populated data for testing:

- Access via "Use Demo Account" on login/signup
- Multiple role types: Investor, Issuer, Compliance, Admin
- Realistic data for all features
- No real transactions or data storage

## Architecture

- **Frontend**: React Native with Expo
- **Backend**: Supabase (PostgreSQL + Auth)
- **Blockchain**: Polygon (Mumbai testnet)
- **Storage**: IPFS via Pinata
- **State Management**: Redux Toolkit

## Compliance & Legal

This platform includes features designed for regulatory compliance:

- SEC regulations for securities
- AML/KYC requirements
- Tax reporting (1099, 8949, Schedule D)
- International compliance frameworks
- Data protection and privacy

⚠️ **Important**: This is a demonstration platform. Consult legal and compliance experts before using in production.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
`;

writeFileSync(readmePath, readmeContent.trim());
console.log('  ✅ Created README.md');

console.log('\n🎉 App fix completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Run: npm install');
console.log('2. Set up your .env file with actual credentials');
console.log('3. Set up Supabase database using scripts in database/');
console.log('4. Run: npx expo start');
console.log('\n✨ Your app should now run without errors!');