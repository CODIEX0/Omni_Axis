#!/bin/bash

# Module Resolution Fix Script
# Fixes common React Native Web3/Crypto module resolution issues

echo "🔧 Fixing module resolution issues..."

# Create node_modules patches directory if it doesn't exist
mkdir -p node_modules/.patches

# Fix @noble/hashes crypto.js export
echo "📦 Patching @noble/hashes..."
if [ -d "node_modules/@noble/hashes" ]; then
  # Create crypto.js file that properly exports crypto
  cat > node_modules/@noble/hashes/crypto.js << 'EOF'
const crypto = require('./crypto');
module.exports = crypto;
EOF
fi

# Fix uint8arrays CJS exports
echo "📦 Patching uint8arrays..."
if [ -d "node_modules/uint8arrays" ]; then
  mkdir -p node_modules/uint8arrays/cjs/src
  
  # Create symlinks for problematic imports
  if [ -f "node_modules/uint8arrays/src/concat.js" ]; then
    ln -sf ../../src/concat.js node_modules/uint8arrays/cjs/src/concat.js 2>/dev/null || cp node_modules/uint8arrays/src/concat.js node_modules/uint8arrays/cjs/src/concat.js
  fi
  
  if [ -f "node_modules/uint8arrays/src/to-string.js" ]; then
    ln -sf ../../src/to-string.js node_modules/uint8arrays/cjs/src/to-string.js 2>/dev/null || cp node_modules/uint8arrays/src/to-string.js node_modules/uint8arrays/cjs/src/to-string.js
  fi
  
  if [ -f "node_modules/uint8arrays/src/from-string.js" ]; then
    ln -sf ../../src/from-string.js node_modules/uint8arrays/cjs/src/from-string.js 2>/dev/null || cp node_modules/uint8arrays/src/from-string.js node_modules/uint8arrays/cjs/src/from-string.js
  fi
  
  if [ -f "node_modules/uint8arrays/src/equals.js" ]; then
    ln -sf ../../src/equals.js node_modules/uint8arrays/cjs/src/equals.js 2>/dev/null || cp node_modules/uint8arrays/src/equals.js node_modules/uint8arrays/cjs/src/equals.js
  fi
fi

# Fix multiformats CJS exports
echo "📦 Patching multiformats..."
if [ -d "node_modules/multiformats" ]; then
  mkdir -p node_modules/multiformats/cjs/src
  
  if [ -f "node_modules/multiformats/src/basics.js" ]; then
    ln -sf ../../src/basics.js node_modules/multiformats/cjs/src/basics.js 2>/dev/null || cp node_modules/multiformats/src/basics.js node_modules/multiformats/cjs/src/basics.js
  fi
fi

# Fix nested node_modules issues
echo "📦 Fixing nested dependencies..."

# Fix @thirdweb-dev/wallets nested dependencies
if [ -d "node_modules/@thirdweb-dev/wallets/node_modules/@noble/hashes" ]; then
  if [ ! -f "node_modules/@thirdweb-dev/wallets/node_modules/@noble/hashes/crypto.js" ]; then
    cat > node_modules/@thirdweb-dev/wallets/node_modules/@noble/hashes/crypto.js << 'EOF'
const crypto = require('./crypto');
module.exports = crypto;
EOF
  fi
fi

# Fix @thirdweb-dev/react-core nested dependencies
if [ -d "node_modules/@thirdweb-dev/react-core/node_modules/@noble/hashes" ]; then
  if [ ! -f "node_modules/@thirdweb-dev/react-core/node_modules/@noble/hashes/crypto.js" ]; then
    cat > node_modules/@thirdweb-dev/react-core/node_modules/@noble/hashes/crypto.js << 'EOF'
const crypto = require('./crypto');
module.exports = crypto;
EOF
  fi
fi

# Fix @walletconnect nested dependencies
if [ -d "node_modules/@walletconnect/web3wallet/node_modules/uint8arrays" ]; then
  mkdir -p node_modules/@walletconnect/web3wallet/node_modules/uint8arrays/cjs/src
  
  # Copy files if they exist
  for file in concat.js to-string.js from-string.js equals.js; do
    if [ -f "node_modules/@walletconnect/web3wallet/node_modules/uint8arrays/src/$file" ]; then
      cp "node_modules/@walletconnect/web3wallet/node_modules/uint8arrays/src/$file" "node_modules/@walletconnect/web3wallet/node_modules/uint8arrays/cjs/src/$file"
    fi
  done
fi

# Clear Metro cache
echo "🧹 Clearing Metro cache..."
npx expo start --clear 2>/dev/null || true
rm -rf .expo 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true

echo "✅ Module resolution fixes applied!"
echo ""
echo "Next steps:"
echo "1. Restart your development server"
echo "2. If issues persist, try: npm install --force"
echo "3. For web builds, ensure webpack config is properly configured"
