#!/bin/bash

# Production Cleanup Script
# Removes test components and prepares for production deployment

echo "🧹 Cleaning up test components for production..."

# Remove test component files
echo "Removing test component files..."
rm -f components/DiditConfigTest.tsx
rm -f components/KYCIntegrationTest.tsx
rm -f components/DemoAccountTest.tsx
rm -f components/AppFunctionalityTest.tsx
rm -f components/IntegrationTest.tsx

# Remove test route
echo "Removing test route..."
rm -f app/\(tabs\)/test.tsx

# Clean up any remaining test imports in files
echo "Cleaning up test imports..."

# Check for any remaining test component references
echo "Checking for remaining test component references..."
grep -r "Test\.tsx" --include="*.tsx" --include="*.ts" app/ components/ || echo "✅ No test component references found"

echo "🔍 Running TypeScript check..."
npm run build:check

if [ $? -eq 0 ]; then
    echo "✅ TypeScript compilation successful - Production ready!"
else
    echo "❌ TypeScript errors found - Please fix before deployment"
    exit 1
fi

echo "🚀 Production cleanup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Update environment variables for production"
echo "2. Deploy smart contracts to mainnet"
echo "3. Run final user acceptance testing"
echo "4. Build and deploy to app stores"
echo ""
echo "Use 'npm run build:android' or 'npm run build:ios' to create production builds"
