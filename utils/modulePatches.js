/**
 * Module Resolution Patches
 * Fixes specific module resolution issues for crypto libraries
 */

// Patch for @noble/hashes crypto module
const originalRequire = require;
require = function patchedRequire(id) {
  // Fix @noble/hashes crypto.js imports
  if (id.includes('@noble/hashes/crypto.js')) {
    try {
      return originalRequire('@noble/hashes/crypto');
    } catch (e) {
      console.warn('Fallback loading for @noble/hashes/crypto');
      return {};
    }
  }
  
  // Fix uint8arrays CJS imports
  if (id.includes('uint8arrays/cjs/src/')) {
    const subPath = id.split('uint8arrays/cjs/src/')[1];
    try {
      return originalRequire(`uint8arrays/src/${subPath}`);
    } catch (e) {
      console.warn(`Fallback loading for uint8arrays/${subPath}`);
      return {};
    }
  }
  
  // Fix multiformats CJS imports
  if (id.includes('multiformats/cjs/src/')) {
    const subPath = id.split('multiformats/cjs/src/')[1];
    try {
      return originalRequire(`multiformats/src/${subPath}`);
    } catch (e) {
      console.warn(`Fallback loading for multiformats/${subPath}`);
      return {};
    }
  }
  
  return originalRequire.apply(this, arguments);
};

// Preserve original require properties
Object.setPrototypeOf(require, originalRequire);
Object.defineProperty(require, 'cache', {
  get: () => originalRequire.cache,
  set: (value) => { originalRequire.cache = value; }
});

console.log('✅ Module resolution patches applied');
