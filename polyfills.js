// Polyfills for Node.js modules in React Native
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

// Apply module fixes first
try {
  require('./utils/moduleFixes');
} catch (e) {
  console.warn('Module fixes not available:', e.message);
}

// Buffer polyfill
if (typeof global.Buffer === 'undefined') {
  try {
    global.Buffer = require('@craftzdog/react-native-buffer').Buffer;
  } catch (e) {
    console.warn('Buffer polyfill not available:', e.message);
  }
}

// Crypto polyfill
if (typeof global.crypto === 'undefined') {
  try {
    const { getRandomValues } = require('expo-crypto');
    global.crypto = {
      getRandomValues,
      subtle: {}, // Add subtle crypto for compatibility
    };
  } catch (e) {
    console.warn('Crypto polyfill not available:', e.message);
  }
}

// Stream polyfill
if (typeof global.stream === 'undefined') {
  try {
    global.stream = require('readable-stream');
  } catch (e) {
    console.warn('Stream polyfill not available:', e.message);
  }
}

// Process polyfill
if (typeof global.process === 'undefined') {
  global.process = {
    env: {},
    nextTick: (fn, ...args) => setTimeout(() => fn(...args), 0),
    version: '16.0.0',
    platform: 'react-native',
    browser: true,
  };
}

// TextEncoder/TextDecoder polyfills
if (typeof global.TextEncoder === 'undefined') {
  try {
    const { TextEncoder, TextDecoder } = require('util');
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
  } catch (e) {
    // Fallback implementation
    global.TextEncoder = class TextEncoder {
      encode(str) {
        const buf = new ArrayBuffer(str.length);
        const bufView = new Uint8Array(buf);
        for (let i = 0, strLen = str.length; i < strLen; i++) {
          bufView[i] = str.charCodeAt(i);
        }
        return bufView;
      }
    };
    global.TextDecoder = class TextDecoder {
      decode(arr) {
        return String.fromCharCode.apply(null, arr);
      }
    };
  }
}

// Performance polyfill
if (typeof global.performance === 'undefined') {
  global.performance = {
    now: () => Date.now(),
    timeOrigin: Date.now(),
  };
}

// Console polyfill for better debugging
if (typeof global.console === 'undefined') {
  global.console = {
    log: (...args) => console.log(...args),
    warn: (...args) => console.warn(...args),
    error: (...args) => console.error(...args),
    info: (...args) => console.info(...args),
    debug: (...args) => console.debug(...args),
  };
}

console.log('✅ Polyfills loaded successfully');

export {};
