/**
 * Webpack Configuration for Web3 and Crypto Libraries
 * Fixes module resolution issues for blockchain-related packages
 */

const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Add fallbacks for Node.js modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: require.resolve('expo-crypto'),
    stream: require.resolve('stream-browserify'),
    buffer: require.resolve('buffer'),
    util: require.resolve('util'),
    url: require.resolve('url'),
    assert: require.resolve('assert'),
  };

  // Add aliases for problematic modules
  config.resolve.alias = {
    ...config.resolve.alias,
    'react-native$': 'react-native-web',
    '@noble/hashes/crypto': '@noble/hashes/crypto',
    'uint8arrays/concat': 'uint8arrays/src/concat',
    'uint8arrays/to-string': 'uint8arrays/src/to-string',
    'uint8arrays/from-string': 'uint8arrays/src/from-string',
    'uint8arrays/equals': 'uint8arrays/src/equals',
    'multiformats/basics': 'multiformats/src/basics',
  };

  // Add plugins for better compatibility
  if (!config.plugins) {
    config.plugins = [];
  }

  config.plugins.push(
    new (require('webpack')).ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    })
  );

  // Configure module rules for better ES6+ support
  config.module.rules.push({
    test: /\.m?js$/,
    resolve: {
      fullySpecified: false,
    },
  });

  // Fix for @noble/hashes and other crypto libraries
  config.module.rules.push({
    test: /node_modules\/@noble\/hashes/,
    type: 'javascript/auto',
  });

  config.module.rules.push({
    test: /node_modules\/uint8arrays/,
    type: 'javascript/auto',
  });

  config.module.rules.push({
    test: /node_modules\/multiformats/,
    type: 'javascript/auto',
  });

  return config;
};
