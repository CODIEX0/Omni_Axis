const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add support for additional file extensions
config.resolver.assetExts.push('sql');

// Fix module resolution for crypto and blockchain packages
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add node modules polyfills for crypto libraries
config.resolver.alias = {
  ...config.resolver.alias,
  'crypto': require.resolve('expo-crypto'),
  'stream': require.resolve('stream-browserify'),
  'buffer': require.resolve('buffer/')
};

// Configure transformer for better ES6+ support
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    mangle: {
      keep_fnames: true,
    },
    output: {
      ascii_only: true,
      quote_style: 3,
      wrap_iife: true,
    },
    sourceMap: {
      includeSources: false,
    },
    toplevel: false,
    compress: {
      reduce_funcs: false,
    },
  },
};

// Fix for noble/hashes and uint8arrays issues
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle @noble/hashes crypto.js resolution
  if (moduleName.includes('@noble/hashes/crypto.js')) {
    return {
      filePath: require.resolve('@noble/hashes/crypto'),
      type: 'sourceFile',
    };
  }
  
  // Handle uint8arrays resolution
  if (moduleName.includes('uint8arrays/cjs/src/')) {
    const subPath = moduleName.split('uint8arrays/cjs/src/')[1];
    try {
      return {
        filePath: require.resolve(`uint8arrays/src/${subPath}`),
        type: 'sourceFile',
      };
    } catch (e) {
      // Fallback to default resolver
    }
  }
  
  // Handle multiformats resolution
  if (moduleName.includes('multiformats/cjs/src/')) {
    const subPath = moduleName.split('multiformats/cjs/src/')[1];
    try {
      return {
        filePath: require.resolve(`multiformats/src/${subPath}`),
        type: 'sourceFile',
      };
    } catch (e) {
      // Fallback to default resolver
    }
  }
  
  // Default resolver
  return context.resolveRequest(context, moduleName, platform);
};

  // Consolidate extraNodeModules
    config.resolver.extraNodeModules = {
      ...config.resolver.extraNodeModules,
      // Polyfills from earlier in your config
      stream: require.resolve('stream-browserify'), // Already aliased
      crypto: require.resolve('crypto-browserify'), // Already aliased
      http: require.resolve('http-browserify'), // Consider if this or the mock is preferred
      // Mock out Node.js core modules that are not available in React Native
      // This is a workaround for libraries that incorrectly bundle server-side code
      // or rely on Node.js APIs in a client environment.
      https: path.resolve(__dirname, 'mocks/https.js'),
      http: path.resolve(__dirname, 'mocks/http.js'),
      net: path.resolve(__dirname, 'mocks/net.js'),
      tls: path.resolve(__dirname, 'mocks/tls.js'),
      zlib: path.resolve(__dirname, 'mocks/zlib.js'),      
      fs: path.resolve(__dirname, 'mocks/fs.js'),
      path: require.resolve('path-browserify'), // Use browser polyfill for path
    };
  module.exports = config;