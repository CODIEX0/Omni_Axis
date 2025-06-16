const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add support for additional file extensions
config.resolver.assetExts.push('sql');

// Add polyfills for Node.js modules
config.resolver.alias = {
  ...config.resolver.alias,
  'crypto': 'expo-crypto',
  'stream': 'readable-stream',
  'buffer': '@craftzdog/react-native-buffer',
};

// Add support for CommonJS modules
config.resolver.unstable_enablePackageExports = true;

// Resolve node_modules issues
config.resolver.platforms = ['native', 'ios', 'android', 'web'];

// Handle source extensions
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'cjs',
  'mjs',
  'ts',
  'tsx',
  'json',
  'js',
  'jsx'
];

// Transform crypto modules
config.transformer.unstable_allowRequireContext = true;

// Add support for crypto polyfills
config.resolver.resolverMainFields = [
  'react-native',
  'browser',
  'main'
];

// Handle node_modules resolution
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
];

// Custom resolver for problematic modules
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle @noble/hashes crypto module
  if (moduleName === '@noble/hashes/crypto') {
    try {
      return {
        filePath: require.resolve('@noble/hashes/crypto'),
        type: 'sourceFile',
      };
    } catch (e) {
      // Fallback to original resolution
    }
  }
  
  // Handle uint8arrays modules
  if (moduleName.includes('uint8arrays/cjs/src/')) {
    const subPath = moduleName.replace('uint8arrays/cjs/src/', '');
    try {
      return {
        filePath: require.resolve(`uint8arrays/${subPath}`),
        type: 'sourceFile',
      };
    } catch (e) {
      // Fallback to original resolution
    }
  }
  
  // Handle multiformats modules
  if (moduleName.includes('multiformats/cjs/src/')) {
    const subPath = moduleName.replace('multiformats/cjs/src/', '');
    try {
      return {
        filePath: require.resolve(`multiformats/${subPath}`),
        type: 'sourceFile',
      };
    } catch (e) {
      // Fallback to original resolution
    }
  }
  
  // Use original resolver for other modules
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;