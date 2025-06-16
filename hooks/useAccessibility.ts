/**
 * Accessibility Hook
 * Custom hook for using accessibility features throughout the app
 */

import { useState, useEffect, useCallback } from 'react';
import accessibilityService, {
  AccessibilitySettings,
  FontSize,
  AccessibilityLanguage,
  UserHint,
} from '../services/accessibility';

export interface UseAccessibilityReturn {
  // Settings
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => Promise<void>;
  
  // Theming
  theme: any;
  fontSizeMultiplier: number;
  
  // Feedback
  speak: (text: string) => Promise<void>;
  hapticFeedback: (type?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => Promise<void>;
  announceForAccessibility: (message: string) => Promise<void>;
  
  // Hints
  currentHint: UserHint | null;
  showNextHint: () => Promise<void>;
  dismissHint: (hintId: string) => Promise<void>;
  resetHints: () => Promise<void>;
  
  // Utilities
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
  validateSetup: () => Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  }>;
}

export const useAccessibility = (): UseAccessibilityReturn => {
  const [settings, setSettings] = useState<AccessibilitySettings>(
    accessibilityService.getSettings()
  );
  const [currentHint, setCurrentHint] = useState<UserHint | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize accessibility settings
  useEffect(() => {
    initializeAccessibility();
  }, []);

  const initializeAccessibility = async () => {
    try {
      setIsLoading(true);
      await accessibilityService.initializeSettings();
      await accessibilityService.loadHintStates();
      
      const currentSettings = accessibilityService.getSettings();
      setSettings(currentSettings);
      
      // Load next hint if hints are enabled
      if (currentSettings.hintsEnabled) {
        const nextHint = accessibilityService.getNextHint();
        setCurrentHint(nextHint);
      }
    } catch (error) {
      console.error('Failed to initialize accessibility:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update a specific setting
  const updateSetting = useCallback(
    async <K extends keyof AccessibilitySettings>(
      key: K,
      value: AccessibilitySettings[K]
    ) => {
      try {
        await accessibilityService.updateSetting(key, value);
        const newSettings = accessibilityService.getSettings();
        setSettings(newSettings);
      } catch (error) {
        console.error(`Failed to update setting ${key}:`, error);
        throw error;
      }
    },
    []
  );

  // Get theme based on current settings
  const theme = accessibilityService.getAccessibilityTheme();
  const currentTheme = settings.colorScheme === 'dark' ? theme.dark : theme.light;

  // Get font size multiplier
  const fontSizeMultiplier = accessibilityService.getFontSizeMultiplier();

  // Speech and feedback functions
  const speak = useCallback(async (text: string) => {
    await accessibilityService.speak(text);
  }, []);

  const hapticFeedback = useCallback(
    async (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') => {
      await accessibilityService.hapticFeedback(type);
    },
    []
  );

  const announceForAccessibility = useCallback(async (message: string) => {
    await accessibilityService.announceForAccessibility(message);
  }, []);

  // Hint management
  const showNextHint = useCallback(async () => {
    if (!settings.hintsEnabled) return;
    
    await accessibilityService.loadHintStates();
    const nextHint = accessibilityService.getNextHint();
    setCurrentHint(nextHint);
  }, [settings.hintsEnabled]);

  const dismissHint = useCallback(async (hintId: string) => {
    await accessibilityService.markHintAsShown(hintId);
    setCurrentHint(null);
    
    // Auto-load next hint
    if (settings.hintsEnabled) {
      setTimeout(async () => {
        const nextHint = accessibilityService.getNextHint();
        setCurrentHint(nextHint);
      }, 1000);
    }
  }, [settings.hintsEnabled]);

  const resetHints = useCallback(async () => {
    await accessibilityService.resetHints();
    if (settings.hintsEnabled) {
      const firstHint = accessibilityService.getNextHint();
      setCurrentHint(firstHint);
    }
  }, [settings.hintsEnabled]);

  // Refresh settings from storage
  const refreshSettings = useCallback(async () => {
    await initializeAccessibility();
  }, []);

  // Validate accessibility setup
  const validateSetup = useCallback(async () => {
    return await accessibilityService.validateAccessibilitySetup();
  }, []);

  return {
    // Settings
    settings,
    updateSetting,
    
    // Theming
    theme: currentTheme,
    fontSizeMultiplier,
    
    // Feedback
    speak,
    hapticFeedback,
    announceForAccessibility,
    
    // Hints
    currentHint,
    showNextHint,
    dismissHint,
    resetHints,
    
    // Utilities
    isLoading,
    refreshSettings,
    validateSetup,
  };
};

// Helper hook for screen-specific accessibility
export const useScreenAccessibility = (screenName: string) => {
  const accessibility = useAccessibility();

  // Announce screen change
  useEffect(() => {
    if (!accessibility.isLoading) {
      accessibility.announceForAccessibility(`Navigated to ${screenName} screen`);
    }
  }, [screenName, accessibility.isLoading]);

  // Screen-specific haptic feedback
  const screenHapticFeedback = useCallback(
    (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') => {
      accessibility.hapticFeedback(type);
    },
    [accessibility]
  );

  return {
    ...accessibility,
    screenHapticFeedback,
  };
};

// Helper hook for form accessibility
export const useFormAccessibility = () => {
  const accessibility = useAccessibility();

  const announceFieldError = useCallback(
    (fieldName: string, error: string) => {
      accessibility.announceForAccessibility(`${fieldName} error: ${error}`);
      accessibility.hapticFeedback('error');
    },
    [accessibility]
  );

  const announceFieldSuccess = useCallback(
    (fieldName: string) => {
      accessibility.announceForAccessibility(`${fieldName} validated successfully`);
      accessibility.hapticFeedback('success');
    },
    [accessibility]
  );

  const announceFormSubmission = useCallback(
    (isSuccess: boolean, message?: string) => {
      const announcement = isSuccess
        ? `Form submitted successfully${message ? `: ${message}` : ''}`
        : `Form submission failed${message ? `: ${message}` : ''}`;
      
      accessibility.announceForAccessibility(announcement);
      accessibility.hapticFeedback(isSuccess ? 'success' : 'error');
    },
    [accessibility]
  );

  return {
    ...accessibility,
    announceFieldError,
    announceFieldSuccess,
    announceFormSubmission,
  };
};

export default useAccessibility;
