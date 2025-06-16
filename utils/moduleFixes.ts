// Module resolution fixes for crypto and utility libraries
// This file helps resolve import issues with @noble/hashes, uint8arrays, and multiformats

// Create proper module exports for problematic modules
const ModuleFixes = {
  // Fix @noble/hashes crypto module
  fixNobleHashes() {
    try {
      // Ensure crypto module is properly accessible
      if (typeof require !== 'undefined') {
        const crypto = require('@noble/hashes/crypto');
        if (crypto && typeof crypto.web !== 'undefined') {
          global.crypto = global.crypto || crypto.web;
        }
      }
    } catch (error) {
      console.warn('Unable to fix @noble/hashes:', error.message);
    }
  },

  // Fix uint8arrays modules
  fixUint8Arrays() {
    try {
      // Provide fallback exports for uint8arrays
      const uint8arrays = {
        concat: require('uint8arrays/concat'),
        toString: require('uint8arrays/to-string'),
        fromString: require('uint8arrays/from-string'),
        equals: require('uint8arrays/equals'),
      };

      // Make available globally if needed
      if (typeof global !== 'undefined') {
        global.uint8arrays = uint8arrays;
      }
    } catch (error) {
      console.warn('Unable to fix uint8arrays:', error.message);
    }
  },

  // Fix multiformats modules
  fixMultiformats() {
    try {
      // Provide fallback for multiformats basics
      const multiformats = {
        basics: require('multiformats/basics'),
      };

      // Make available globally if needed
      if (typeof global !== 'undefined') {
        global.multiformats = multiformats;
      }
    } catch (error) {
      console.warn('Unable to fix multiformats:', error.message);
    }
  },

  // Apply all fixes
  applyAllFixes() {
    console.log('🔧 Applying module resolution fixes...');
    this.fixNobleHashes();
    this.fixUint8Arrays();
    this.fixMultiformats();
    console.log('✅ Module fixes applied');
  }
};

// Auto-apply fixes when this module is imported
ModuleFixes.applyAllFixes();

export default ModuleFixes;
