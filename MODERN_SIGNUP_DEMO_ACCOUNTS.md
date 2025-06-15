# Modern Signup Process & Demo Accounts

## Overview
The Omni Axis platform now features a modern, multi-step signup process with integrated demo account functionality for testing and demonstration purposes.

## Features Implemented

### 1. Modern Signup Component (`components/ModernSignup.tsx`)
- **Multi-step registration flow**:
  - Step 1: Personal Information (First Name, Last Name, Email)
  - Step 2: Security (Password, Confirm Password)
  - Step 3: Role Selection & Terms Agreement

- **Role-based registration**: Users can select from:
  - **Investor**: Asset purchase and portfolio management
  - **Issuer**: Asset tokenization and marketplace listing
  - **Compliance**: KYC/AML verification and regulatory oversight
  - **Support**: Customer service and user assistance

- **Modern UI/UX**:
  - Progress indicator showing current step
  - Gradient backgrounds and modern styling
  - Form validation with clear error messages
  - Smooth transitions between steps

### 2. Demo Account System (`services/demoAccounts.ts`)
- **Pre-configured accounts** for each role type
- **Complete user profiles** with realistic data
- **Role-based permissions** and capabilities
- **Mock portfolios and transaction history**

### 3. Enhanced Authentication (`hooks/useAuth.ts`)
- **Dual authentication modes**:
  - Regular Supabase authentication for production users
  - Demo mode for testing and demonstrations
  
- **Demo account features**:
  - Instant login without backend verification
  - Pre-populated user data and portfolios
  - Full feature access for testing
  - Easy switching between demo accounts

### 4. Updated Login Screen (`app/(auth)/login.tsx`)
- **Demo account quick access**
- **Modal interface** for selecting demo accounts
- **Biometric authentication** support
- **Modern styling** consistent with signup

## Demo Accounts Available

### Admin Account
- **Email**: admin@omniaxis.com
- **Password**: Admin123!
- **Role**: System Administrator
- **Capabilities**: Full system access, user management, contract management

### Asset Issuer Account
- **Email**: issuer@realestate.com
- **Password**: Issuer123!
- **Role**: Asset Issuer
- **Capabilities**: Asset tokenization, marketplace listing, yield distribution

### Investor Account
- **Email**: investor@wealth.com
- **Password**: Investor123!
- **Role**: Investor
- **Capabilities**: Asset purchase, portfolio management, yield claiming

### Compliance Account
- **Email**: compliance@omniaxis.com
- **Password**: Compliance123!
- **Role**: Compliance Officer
- **Capabilities**: KYC/AML verification, regulatory reporting

### Support Account
- **Email**: support@omniaxis.com
- **Password**: Support123!
- **Role**: Support Agent
- **Capabilities**: Customer service, ticket management

## Usage Instructions

### For New User Registration
1. Navigate to the registration screen
2. Follow the 3-step process:
   - Enter personal information
   - Set secure password
   - Select user role and agree to terms
3. Submit to create account

### For Demo Account Access
1. On login or signup screen, tap "Use Demo Account"
2. Select desired role from the modal
3. Automatically logged in with pre-populated data
4. Explore full platform functionality

### For Developers
```typescript
// Access demo account service
import { demoAccountService } from '../services/demoAccounts';

// Get all demo accounts
const accounts = demoAccountService.getAllAccounts();

// Get account by role
const adminAccount = demoAccountService.getAccountByRole('admin');

// Validate demo credentials
const account = demoAccountService.validateCredentials(email, password);
```

## File Structure

```
components/
├── ModernSignup.tsx          # Multi-step signup component
├── ui/                       # Reusable UI components
│   ├── Input.tsx
│   ├── Button.tsx
│   └── ...

app/(auth)/
├── index.tsx                 # Welcome screen
├── login.tsx                 # Enhanced login with demo accounts
├── register.tsx              # Uses ModernSignup component
└── _layout.tsx               # Auth layout

services/
├── demoAccounts.ts           # Demo account management
├── supabase.ts               # Regular authentication
└── ...

hooks/
├── useAuth.ts                # Enhanced authentication hook
└── ...

data/
└── demo-accounts.json        # Demo account definitions
```

## Security Notes

- Demo accounts are for **testing and demonstration only**
- Demo mode is clearly identified in the UI
- Demo data is isolated from production data
- Real authentication still works for production users
- All demo credentials are publicly visible for testing

## Environment Configuration

Add to `.env`:
```properties
# Demo Mode Configuration
EXPO_PUBLIC_DEMO_MODE_ENABLED=true
EXPO_PUBLIC_DEMO_ACCOUNTS_FILE=./data/demo-accounts.json
```

## Next Steps

1. **Frontend Integration**: Connect remaining UI components to demo account data
2. **User Management**: Implement account switching and profile management
3. **Data Population**: Add more realistic demo data for portfolios and transactions
4. **Testing**: Comprehensive testing of all user flows
5. **Documentation**: User guides and video demonstrations

## Benefits

- **Quick Testing**: Instant access to different user roles
- **Demonstrations**: Easy showcasing of platform capabilities
- **Development**: Faster iteration without authentication overhead
- **User Onboarding**: Users can explore before committing to registration

The modern signup process and demo account system provide a professional, user-friendly experience while enabling comprehensive testing and demonstration of the Omni Axis platform's capabilities.
