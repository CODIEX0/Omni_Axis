module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      //'expo-router/babel',
      // Transform imports for crypto modules
      ['module-resolver', {
        alias: {
          'crypto': 'expo-crypto',
          'stream': 'readable-stream',
          'buffer': '@craftzdog/react-native-buffer',
        }
      }]
    ],
    overrides: [
      {
        // Transform crypto and buffer modules
        test: /node_modules\/@noble\/hashes/,
        plugins: [
          ['@babel/plugin-transform-modules-commonjs', { strict: false }]
        ]
      },
      {
        // Transform uint8arrays modules
        test: /node_modules\/uint8arrays/,
        plugins: [
          ['@babel/plugin-transform-modules-commonjs', { strict: false }]
        ]
      },
      {
        // Transform multiformats modules
        test: /node_modules\/multiformats/,
        plugins: [
          ['@babel/plugin-transform-modules-commonjs', { strict: false }]
        ]
      }
    ]
  };
};