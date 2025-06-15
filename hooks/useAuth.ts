import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, UserProfile } from '../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { demoAccountService, DemoAccount } from '../services/demoAccounts';
import { freeKYCService } from '../services/freeKYC';

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  isDemoMode: boolean;
  demoAccount: DemoAccount | null;
}

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  country?: string;
  role?: 'admin' | 'issuer' | 'investor' | 'compliance' | 'support';
  company?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    initialized: false,
    isDemoMode: false,
    demoAccount: null,
  });

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for demo mode first
        const demoMode = await AsyncStorage.getItem('demoMode');
        const demoAccountId = await AsyncStorage.getItem('demoAccountId');
        
        if (demoMode === 'true' && demoAccountId) {
          const demoAccount = demoAccountService.getAccountById(demoAccountId);
          if (demoAccount) {
            setAuthState({
              user: null,
              profile: null,
              session: null,
              loading: false,
              initialized: true,
              isDemoMode: true,
              demoAccount,
            });
            return;
          }
        }

        // Get initial session for regular auth
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        } else if (session) {
          await loadUserProfile(session.user);
          setAuthState({
            user: session.user,
            profile: null, // Will be loaded by loadUserProfile
            session,
            loading: false,
            initialized: true,
            isDemoMode: false,
            demoAccount: null,
          });
        } else {
          setAuthState(prev => ({
            ...prev,
            loading: false,
            initialized: true,
          }));
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setAuthState(prev => ({
          ...prev,
          loading: false,
          initialized: true,
        }));
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (session?.user) {
          await loadUserProfile(session.user);
          setAuthState(prev => ({
            ...prev,
            user: session.user,
            session,
            loading: false,
          }));
        } else {
          setAuthState({
            user: null,
            profile: null,
            session: null,
            loading: false,
            initialized: true,
            isDemoMode: false,
            demoAccount: null,
          });
          // Clear stored data
          await AsyncStorage.removeItem('userProfile');
          await AsyncStorage.removeItem('demoMode');
          await AsyncStorage.removeItem('demoAccountId');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load user profile from database
  const loadUserProfile = async (user: User) => {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading user profile:', error);
        return;
      }

      if (profile) {
        setAuthState(prev => ({ ...prev, profile }));
        await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Sign up new user
  const signUp = async (data: SignUpData) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        throw authError;
      }

      if (authData.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: authData.user.id,
            full_name: `${data.firstName} ${data.lastName}`,
            phone_number: data.phoneNumber,
            country: data.country,
            role: data.role || 'investor',
            company: data.company,
            kyc_status: 'not_started',
          });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
        }

        return { user: authData.user, error: null };
      }

      return { user: null, error: new Error('User creation failed') };
    } catch (error) {
      console.error('Sign up error:', error);
      return { user: null, error };
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  // Sign in user
  const signIn = async (data: SignInData) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));

      // Check if this is a demo account first
      if (demoAccountService.isDemoAccount(data.email)) {
        const demoAccount = demoAccountService.validateCredentials(data.email, data.password);
        
        if (demoAccount) {
          // Store demo mode in AsyncStorage
          await AsyncStorage.setItem('demoMode', 'true');
          await AsyncStorage.setItem('demoAccountId', demoAccount.id);
          
          // Update last login
          demoAccountService.updateLastLogin(data.email);
          
          setAuthState({
            user: null,
            profile: null,
            session: null,
            loading: false,
            initialized: true,
            isDemoMode: true,
            demoAccount,
          });

          return { user: demoAccount as any, error: null };
        } else {
          return { user: null, error: new Error('Invalid demo account credentials') };
        }
      }

      // Regular Supabase authentication
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        throw error;
      }

      return { user: authData.user, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { user: null, error };
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  // Sign out user
  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      // Check if we're in demo mode
      if (authState.isDemoMode) {
        // Clear demo mode storage
        await AsyncStorage.removeItem('demoMode');
        await AsyncStorage.removeItem('demoAccountId');
        
        setAuthState({
          user: null,
          profile: null,
          session: null,
          loading: false,
          initialized: true,
          isDemoMode: false,
          demoAccount: null,
        });

        return { error: null };
      }

      // Regular Supabase sign out
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      // Clear local storage
      await AsyncStorage.removeItem('userProfile');
      
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  // Update user profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!authState.user) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', authState.user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setAuthState(prev => ({ ...prev, profile: data }));
      await AsyncStorage.setItem('userProfile', JSON.stringify(data));

      return { profile: data, error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { profile: null, error };
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        throw error;
      }

      return { error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error };
    }
  };

  // Check if user is admin
  const isAdmin = () => {
    if (authState.isDemoMode && authState.demoAccount) {
      return authState.demoAccount.role === 'admin';
    }
    return authState.profile?.role === 'admin';
  };

  // Check if user can tokenize assets
  const canTokenizeAssets = () => {
    if (authState.isDemoMode && authState.demoAccount) {
      return authState.demoAccount.role === 'issuer' && authState.demoAccount.profile.kycStatus === 'verified';
    }
    return authState.profile?.role === 'seller' && authState.profile?.kyc_status === 'approved';
  };

  // Check if KYC is completed
  const isKYCCompleted = async () => {
    if (authState.isDemoMode && authState.demoAccount) {
      return authState.demoAccount.profile.kycStatus === 'verified';
    }
    
    if (authState.user) {
      const userId = authState.user.id || authState.user.email || 'user';
      return await freeKYCService.isKYCApproved(userId);
    }
    
    return authState.profile?.kyc_status === 'approved';
  };

  // Switch demo account
  const switchDemoAccount = async (role: string) => {
    if (!authState.isDemoMode) return { error: new Error('Not in demo mode') };
    
    const newAccount = demoAccountService.getAccountByRole(role);
    if (!newAccount) return { error: new Error('Demo account not found') };

    try {
      await AsyncStorage.setItem('demoAccountId', newAccount.id);
      demoAccountService.updateLastLogin(newAccount.email);
      
      setAuthState(prev => ({
        ...prev,
        demoAccount: newAccount,
      }));

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  // Sign in with demo account directly
  const signInWithDemoAccount = async (role: string) => {
    const demoAccount = demoAccountService.getAccountByRole(role);
    if (!demoAccount) return { user: null, error: new Error('Demo account not found') };

    try {
      setAuthState(prev => ({ ...prev, loading: true }));

      await AsyncStorage.setItem('demoMode', 'true');
      await AsyncStorage.setItem('demoAccountId', demoAccount.id);
      demoAccountService.updateLastLogin(demoAccount.email);
      
      // Auto-approve KYC for demo accounts
      await freeKYCService.autoApproveDemoAccount(demoAccount.id, demoAccount.role);
      
      setAuthState({
        user: null,
        profile: null,
        session: null,
        loading: false,
        initialized: true,
        isDemoMode: true,
        demoAccount,
      });

      return { user: demoAccount as any, error: null };
    } catch (error) {
      console.error('Demo sign in error:', error);
      return { user: null, error };
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    isAdmin,
    canTokenizeAssets,
    isKYCCompleted,
    loadUserProfile,
    switchDemoAccount,
    signInWithDemoAccount,
    demoAccountService,
  };
};
