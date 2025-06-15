const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for TypeScript files in node_modules
config.resolver.sourceExts.push('ts', 'tsx');

// Configure module paths
config.resolver.alias = {
  '@': __dirname,
};

module.exports = config;
