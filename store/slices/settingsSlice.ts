import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AppSettings {
  language: string;
  currency: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
    trading: boolean;
    security: boolean;
    marketing: boolean;
  };
  security: {
    biometric: boolean;
    twoFactor: boolean;
    autoLock: boolean;
    autoLockTimeout: number; // minutes
  };
  privacy: {
    analytics: boolean;
    crashReporting: boolean;
    dataSharing: boolean;
  };
  trading: {
    confirmations: boolean;
    slippageTolerance: number; // percentage
    gasPrice: 'slow' | 'standard' | 'fast';
  };
}

interface SettingsState {
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  settings: {
    language: 'en',
    currency: 'USD',
    theme: 'system',
    notifications: {
      push: true,
      email: true,
      sms: false,
      trading: true,
      security: true,
      marketing: false,
    },
    security: {
      biometric: true,
      twoFactor: false,
      autoLock: true,
      autoLockTimeout: 5,
    },
    privacy: {
      analytics: true,
      crashReporting: true,
      dataSharing: false,
    },
    trading: {
      confirmations: true,
      slippageTolerance: 0.5,
      gasPrice: 'standard',
    },
  },
  isLoading: false,
  error: null,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateSettings: (state, action: PayloadAction<Partial<AppSettings>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    updateNotificationSettings: (state, action: PayloadAction<Partial<AppSettings['notifications']>>) => {
      state.settings.notifications = { ...state.settings.notifications, ...action.payload };
    },
    updateSecuritySettings: (state, action: PayloadAction<Partial<AppSettings['security']>>) => {
      state.settings.security = { ...state.settings.security, ...action.payload };
    },
    updatePrivacySettings: (state, action: PayloadAction<Partial<AppSettings['privacy']>>) => {
      state.settings.privacy = { ...state.settings.privacy, ...action.payload };
    },
    updateTradingSettings: (state, action: PayloadAction<Partial<AppSettings['trading']>>) => {
      state.settings.trading = { ...state.settings.trading, ...action.payload };
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.settings.language = action.payload;
    },
    setCurrency: (state, action: PayloadAction<string>) => {
      state.settings.currency = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.settings.theme = action.payload;
    },
    resetSettings: (state) => {
      state.settings = initialState.settings;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  updateSettings,
  updateNotificationSettings,
  updateSecuritySettings,
  updatePrivacySettings,
  updateTradingSettings,
  setLanguage,
  setCurrency,
  setTheme,
  resetSettings,
  clearError,
} = settingsSlice.actions;

export default settingsSlice.reducer;