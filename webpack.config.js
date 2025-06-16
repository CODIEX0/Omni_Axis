const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Add polyfills for Node.js modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    buffer: require.resolve('@craftzdog/react-native-buffer'),
    process: require.resolve('process/browser'),
    util: require.resolve('util'),
    assert: require.resolve('assert'),
    url: require.resolve('url'),
    os: require.resolve('os-browserify/browser'),
    https: require.resolve('https-browserify'),
    http: require.resolve('stream-http'),
    vm: require.resolve('vm-browserify'),
    zlib: require.resolve('browserify-zlib'),
    path: require.resolve('path-browserify'),
    fs: false,
    net: false,
    tls: false,
  };

  // Add aliases for problematic modules
  config.resolve.alias = {
    ...config.resolve.alias,
    '@noble/hashes/crypto': require.resolve('@noble/hashes/crypto'),
    'uint8arrays/concat': require.resolve('uint8arrays/concat'),
    'uint8arrays/to-string': require.resolve('uint8arrays/to-string'),
    'uint8arrays/from-string': require.resolve('uint8arrays/from-string'),
    'uint8arrays/equals': require.resolve('uint8arrays/equals'),
    'multiformats/basics': require.resolve('multiformats/basics'),
  };

  // Handle module resolution for CommonJS modules
  config.resolve.extensionAlias = {
    '.js': ['.js', '.ts', '.tsx'],
    '.mjs': ['.mjs', '.ts', '.tsx'],
    '.cjs': ['.cjs', '.ts', '.tsx'],
  };

  return config;
};
