import demoAccountsData from '../data/demo-accounts.json';

export interface DemoAccount {
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'issuer' | 'investor' | 'compliance' | 'support';
  profile: {
    firstName: string;
    lastName: string;
    phone: string;
    country: string;
    kycStatus: 'pending' | 'in_progress' | 'verified' | 'rejected';
    kycLevel: 'basic' | 'enhanced' | 'institutional';
    profileImage: string;
    company?: string;
    license?: string;
    investorType?: string;
    riskTolerance?: string;
  };
  walletAddress: string;
  permissions: string[];
  assets?: any[];
  portfolio?: any;
  createdAt: string;
  lastLogin: string;
}

export interface DemoAccountsData {
  demoAccounts: {
    [key: string]: DemoAccount;
  };
}

class DemoAccountService {
  private accounts: DemoAccountsData;

  constructor() {
    this.accounts = demoAccountsData as DemoAccountsData;
  }

  /**
   * Get all demo accounts
   */
  getAllAccounts(): DemoAccount[] {
    return Object.values(this.accounts.demoAccounts);
  }

  /**
   * Get demo account by email
   */
  getAccountByEmail(email: string): DemoAccount | null {
    const accounts = this.getAllAccounts();
    return accounts.find(account => account.email === email) || null;
  }

  /**
   * Get demo account by role
   */
  getAccountByRole(role: string): DemoAccount | null {
    const accounts = this.getAllAccounts();
    return accounts.find(account => account.role === role) || null;
  }

  /**
   * Get demo account by ID
   */
  getAccountById(id: string): DemoAccount | null {
    const accounts = this.getAllAccounts();
    return accounts.find(account => account.id === id) || null;
  }

  /**
   * Validate demo account credentials
   */
  validateCredentials(email: string, password: string): DemoAccount | null {
    const account = this.getAccountByEmail(email);
    if (account && account.password === password) {
      return account;
    }
    return null;
  }

  /**
   * Check if email is a demo account
   */
  isDemoAccount(email: string): boolean {
    return this.getAccountByEmail(email) !== null;
  }

  /**
   * Get accounts by role type
   */
  getAccountsByRole(role: string): DemoAccount[] {
    const accounts = this.getAllAccounts();
    return accounts.filter(account => account.role === role);
  }

  /**
   * Update last login for demo account
   */
  updateLastLogin(email: string): void {
    const account = this.getAccountByEmail(email);
    if (account) {
      account.lastLogin = new Date().toISOString();
    }
  }

  /**
   * Get demo account summary for UI
   */
  getAccountSummary(): { [role: string]: { count: number; description: string } } {
    return {
      admin: {
        count: 1,
        description: 'Full system access with user and contract management'
      },
      issuer: {
        count: 1,
        description: 'Asset tokenization and marketplace listing capabilities'
      },
      investor: {
        count: 1,
        description: 'Asset purchase and portfolio management access'
      },
      compliance: {
        count: 1,
        description: 'KYC/AML verification and regulatory oversight'
      },
      support: {
        count: 1,
        description: 'Customer support and user assistance tools'
      }
    };
  }
}

export const demoAccountService = new DemoAccountService();
export default demoAccountService;
