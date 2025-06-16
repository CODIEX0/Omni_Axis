/**
 * Accessibility Service
 * Comprehensive accessibility features for the Omni Axis platform
 */

import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import * as ScreenOrientation from 'expo-screen-orientation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, ColorSchemeName } from 'react-native';
import i18next from 'i18next';

// Accessibility Configuration
const ACCESSIBILITY_CONFIG = {
  STORAGE_KEYS: {
    LANGUAGE: 'accessibility_language',
    FONT_SIZE: 'accessibility_font_size',
    HIGH_CONTRAST: 'accessibility_high_contrast',
    VOICE_OVER: 'accessibility_voice_over',
    HAPTIC_FEEDBACK: 'accessibility_haptic_feedback',
    SCREEN_READER: 'accessibility_screen_reader',
    HINTS_ENABLED: 'accessibility_hints_enabled',
    COLOR_SCHEME: 'accessibility_color_scheme',
    MOTION_REDUCED: 'accessibility_motion_reduced',
  },
  DEFAULT_SETTINGS: {
    language: 'en',
    fontSize: 'medium',
    highContrast: false,
    voiceOver: false,
    hapticFeedback: true,
    screenReader: false,
    hintsEnabled: true,
    colorScheme: 'auto' as ColorSchemeName,
    motionReduced: false,
  },
};

export type FontSize = 'small' | 'medium' | 'large' | 'extra-large';
export type AccessibilityLanguage = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ar' | 'zh' | 'ja' | 'ko' | 'hi' | 'sw' | 'yo' | 'ig' | 'ha';

export interface AccessibilitySettings {
  language: AccessibilityLanguage;
  fontSize: FontSize;
  highContrast: boolean;
  voiceOver: boolean;
  hapticFeedback: boolean;
  screenReader: boolean;
  hintsEnabled: boolean;
  colorScheme: ColorSchemeName;
  motionReduced: boolean;
}

export interface UserHint {
  id: string;
  title: string;
  message: string;
  action?: string;
  priority: 'low' | 'medium' | 'high';
  category: 'navigation' | 'feature' | 'security' | 'general';
  shown: boolean;
}

class AccessibilityService {
  private settings: AccessibilitySettings;
  private hints: UserHint[] = [];
  private speechEnabled: boolean = false;

  constructor() {
    this.settings = ACCESSIBILITY_CONFIG.DEFAULT_SETTINGS;
    this.initializeSettings();
    this.initializeHints();
  }

  // Initialize accessibility settings from storage
  async initializeSettings(): Promise<void> {
    try {
      const storedSettings = await this.loadSettings();
      this.settings = { ...this.settings, ...storedSettings };
      
      // Apply initial settings
      await this.applyLanguageSettings();
      await this.applyScreenOrientation();
      
      console.log('Accessibility settings initialized:', this.settings);
    } catch (error) {
      console.error('Failed to initialize accessibility settings:', error);
    }
  }

  // Load settings from AsyncStorage
  async loadSettings(): Promise<Partial<AccessibilitySettings>> {
    const settings: Partial<AccessibilitySettings> = {};
    
    try {
      for (const [key, storageKey] of Object.entries(ACCESSIBILITY_CONFIG.STORAGE_KEYS)) {
        const value = await AsyncStorage.getItem(storageKey);
        if (value !== null) {
          const settingKey = key.toLowerCase().replace('_', '') as keyof AccessibilitySettings;
          settings[settingKey] = JSON.parse(value);
        }
      }
    } catch (error) {
      console.error('Failed to load accessibility settings:', error);
    }
    
    return settings;
  }

  // Save settings to AsyncStorage
  async saveSettings(): Promise<void> {
    try {
      const savePromises = Object.entries(this.settings).map(([key, value]) => {
        const storageKey = ACCESSIBILITY_CONFIG.STORAGE_KEYS[key.toUpperCase() as keyof typeof ACCESSIBILITY_CONFIG.STORAGE_KEYS];
        if (storageKey) {
          return AsyncStorage.setItem(storageKey, JSON.stringify(value));
        }
        return Promise.resolve();
      });

      await Promise.all(savePromises);
      console.log('Accessibility settings saved');
    } catch (error) {
      console.error('Failed to save accessibility settings:', error);
    }
  }

  // Get current settings
  getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }

  // Update specific setting
  async updateSetting<K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ): Promise<void> {
    this.settings[key] = value;
    await this.saveSettings();
    
    // Apply the setting immediately
    switch (key) {
      case 'language':
        await this.applyLanguageSettings();
        break;
      case 'hapticFeedback':
        if (value && this.settings.hapticFeedback) {
          await this.hapticFeedback('light');
        }
        break;
      case 'voiceOver':
        this.speechEnabled = value as boolean;
        break;
    }
  }

  // Language Management
  async applyLanguageSettings(): Promise<void> {
    try {
      await i18next.changeLanguage(this.settings.language);
      console.log(`Language changed to: ${this.settings.language}`);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  }

  // Get available languages
  getAvailableLanguages(): Array<{ code: AccessibilityLanguage; name: string; nativeName: string }> {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'fr', name: 'French', nativeName: 'Français' },
      { code: 'de', name: 'German', nativeName: 'Deutsch' },
      { code: 'it', name: 'Italian', nativeName: 'Italiano' },
      { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
      { code: 'zh', name: 'Chinese', nativeName: '中文' },
      { code: 'ja', name: 'Japanese', nativeName: '日本語' },
      { code: 'ko', name: 'Korean', nativeName: '한국어' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
      { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
      { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá' },
      { code: 'ig', name: 'Igbo', nativeName: 'Igbo' },
      { code: 'ha', name: 'Hausa', nativeName: 'Hausa' },
    ];
  }

  // Voice/Speech Features
  async speak(text: string, options?: Speech.SpeechOptions): Promise<void> {
    if (!this.settings.voiceOver && !this.speechEnabled) return;

    try {
      const speechOptions: Speech.SpeechOptions = {
        language: this.settings.language,
        pitch: 1.0,
        rate: 0.8,
        ...options,
      };

      await Speech.speak(text, speechOptions);
    } catch (error) {
      console.error('Speech failed:', error);
    }
  }

  async stopSpeaking(): Promise<void> {
    try {
      await Speech.stop();
    } catch (error) {
      console.error('Failed to stop speech:', error);
    }
  }

  // Haptic Feedback
  async hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light'): Promise<void> {
    if (!this.settings.hapticFeedback) return;

    try {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
      }
    } catch (error) {
      console.error('Haptic feedback failed:', error);
    }
  }

  // Screen Orientation
  async applyScreenOrientation(): Promise<void> {
    try {
      if (this.settings.motionReduced) {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      } else {
        await ScreenOrientation.unlockAsync();
      }
    } catch (error) {
      console.error('Failed to set screen orientation:', error);
    }
  }

  // Font Size Management
  getFontSizeMultiplier(): number {
    switch (this.settings.fontSize) {
      case 'small':
        return 0.8;
      case 'medium':
        return 1.0;
      case 'large':
        return 1.2;
      case 'extra-large':
        return 1.4;
      default:
        return 1.0;
    }
  }

  // Hint System
  initializeHints(): void {
    this.hints = [
      {
        id: 'welcome',
        title: 'Welcome to Omni Axis',
        message: 'Tap anywhere to start exploring the platform. Use the navigation tabs at the bottom to switch between sections.',
        priority: 'high',
        category: 'navigation',
        shown: false,
      },
      {
        id: 'tokenize_asset',
        title: 'Tokenize Your First Asset',
        message: 'Ready to tokenize an asset? Go to the Tokenize tab and follow the step-by-step process.',
        priority: 'medium',
        category: 'feature',
        shown: false,
      },
      {
        id: 'portfolio_tracking',
        title: 'Track Your Portfolio',
        message: 'View your tokenized assets and their performance in the Portfolio tab.',
        priority: 'medium',
        category: 'feature',
        shown: false,
      },
      {
        id: 'security_setup',
        title: 'Secure Your Account',
        message: 'Enable biometric authentication in Profile settings for enhanced security.',
        priority: 'high',
        category: 'security',
        shown: false,
      },
      {
        id: 'marketplace_explore',
        title: 'Explore the Marketplace',
        message: 'Discover and invest in tokenized assets from other users in the Marketplace.',
        priority: 'low',
        category: 'feature',
        shown: false,
      },
      {
        id: 'community_engage',
        title: 'Join the Community',
        message: 'Connect with other users and participate in governance through the Community tab.',
        priority: 'low',
        category: 'feature',
        shown: false,
      },
    ];
  }

  // Get next hint to show
  getNextHint(): UserHint | null {
    const unshownHints = this.hints.filter(hint => !hint.shown);
    if (unshownHints.length === 0) return null;

    // Sort by priority
    unshownHints.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    return unshownHints[0];
  }

  // Mark hint as shown
  async markHintAsShown(hintId: string): Promise<void> {
    const hint = this.hints.find(h => h.id === hintId);
    if (hint) {
      hint.shown = true;
      await AsyncStorage.setItem(`hint_${hintId}_shown`, 'true');
    }
  }

  // Reset all hints
  async resetHints(): Promise<void> {
    this.hints.forEach(hint => {
      hint.shown = false;
    });
    
    // Clear from storage
    const hintKeys = this.hints.map(hint => `hint_${hint.id}_shown`);
    await AsyncStorage.multiRemove(hintKeys);
  }

  // Load hint states from storage
  async loadHintStates(): Promise<void> {
    try {
      const hintKeys = this.hints.map(hint => `hint_${hint.id}_shown`);
      const values = await AsyncStorage.multiGet(hintKeys);
      
      values.forEach(([key, value]) => {
        if (value === 'true') {
          const hintId = key.replace('hint_', '').replace('_shown', '');
          const hint = this.hints.find(h => h.id === hintId);
          if (hint) {
            hint.shown = true;
          }
        }
      });
    } catch (error) {
      console.error('Failed to load hint states:', error);
    }
  }

  // Accessibility announcement
  async announceForAccessibility(message: string): Promise<void> {
    if (this.settings.screenReader || this.settings.voiceOver) {
      await this.speak(message);
    }
  }

  // Get theme colors based on accessibility settings
  getAccessibilityTheme() {
    const baseTheme = {
      light: {
        background: '#FFFFFF',
        surface: '#F8F9FA',
        primary: '#1E40AF',
        secondary: '#6B7280',
        text: '#111827',
        textSecondary: '#6B7280',
        border: '#E5E7EB',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
      },
      dark: {
        background: '#111827',
        surface: '#1F2937',
        primary: '#3B82F6',
        secondary: '#9CA3AF',
        text: '#F9FAFB',
        textSecondary: '#D1D5DB',
        border: '#374151',
        success: '#34D399',
        warning: '#FBBF24',
        error: '#F87171',
      },
    };

    if (this.settings.highContrast) {
      return {
        light: {
          ...baseTheme.light,
          background: '#FFFFFF',
          text: '#000000',
          primary: '#0000FF',
          border: '#000000',
        },
        dark: {
          ...baseTheme.dark,
          background: '#000000',
          text: '#FFFFFF',
          primary: '#00FFFF',
          border: '#FFFFFF',
        },
      };
    }

    return baseTheme;
  }

  // Check if accessibility features are properly set up
  async validateAccessibilitySetup(): Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check if speech is available
    const isSpeechAvailable = await Speech.isSpeakingAsync();
    if (!isSpeechAvailable && this.settings.voiceOver) {
      issues.push('Voice over is enabled but speech is not available');
    }

    // Check language support
    const availableLanguages = this.getAvailableLanguages();
    const isLanguageSupported = availableLanguages.some(lang => lang.code === this.settings.language);
    if (!isLanguageSupported) {
      issues.push(`Language '${this.settings.language}' is not supported`);
      recommendations.push('Please select a supported language from the settings');
    }

    // Recommendations based on settings
    if (!this.settings.hintsEnabled) {
      recommendations.push('Consider enabling user hints for better navigation experience');
    }

    if (!this.settings.hapticFeedback) {
      recommendations.push('Enable haptic feedback for better interaction feedback');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations,
    };
  }
}

// Export singleton instance
export const accessibilityService = new AccessibilityService();
export default accessibilityService;
