/**
 * React Native Crypto Polyfills
 * Provides polyfills for Node.js crypto functionality in React Native
 */

import 'react-native-get-random-values';
import { Buffer } from 'buffer';

// Make Buffer available globally
if (typeof global !== 'undefined') {
  global.Buffer = Buffer;
}

// Polyfill for crypto.getRandomValues if not available
if (typeof global !== 'undefined' && !global.crypto) {
  global.crypto = {
    getRandomValues: (arr: any) => {
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        return crypto.getRandomValues(arr);
      }
      // Fallback for environments without crypto.getRandomValues
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  } as any;
}

// Polyfill for TextEncoder/TextDecoder
if (typeof global !== 'undefined') {
  if (!global.TextEncoder) {
    global.TextEncoder = class TextEncoder {
      encode(input: string = ''): Uint8Array {
        const encoder = new Array(input.length);
        for (let i = 0; i < input.length; i++) {
          encoder[i] = input.charCodeAt(i);
        }
        return new Uint8Array(encoder);
      }
    } as any;
  }

  if (!global.TextDecoder) {
    global.TextDecoder = class TextDecoder {
      decode(input: Uint8Array): string {
        return String.fromCharCode.apply(null, Array.from(input));
      }
    } as any;
  }
}

// Polyfill for process.env if not available
if (typeof global !== 'undefined' && !global.process) {
  global.process = {
    env: {},
    nextTick: (cb: Function) => setTimeout(cb, 0),
    version: '16.0.0',
    platform: 'react-native',
  } as any;
}

// Export for use in other files
export const initializePolyfills = () => {
  console.log('✅ Crypto polyfills initialized');
};
