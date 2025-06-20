/**
 * Accessibility Settings Component
 * UI for managing accessibility preferences
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
// Note: Picker would be imported like this when @react-native-picker/picker is installed
// import { Picker } from '@react-native-picker/picker';
import accessibilityService, {
  AccessibilitySettings,
  FontSize,
  AccessibilityLanguage,
} from '../services/accessibility';

interface AccessibilitySettingsProps {
  onSettingsChange?: (settings: AccessibilitySettings) => void;
}

export const AccessibilitySettingsComponent: React.FC<AccessibilitySettingsProps> = ({
  onSettingsChange,
}) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(
    accessibilityService.getSettings()
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      await accessibilityService.initializeSettings();
      const currentSettings = accessibilityService.getSettings();
      setSettings(currentSettings);
      onSettingsChange?.(currentSettings);
    } catch (error) {
      console.error('Failed to load accessibility settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    try {
      await accessibilityService.updateSetting(key, value);
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      onSettingsChange?.(newSettings);

      // Provide feedback
      await accessibilityService.hapticFeedback('light');
      await accessibilityService.announceForAccessibility(
        `${key.replace(/([A-Z])/g, ' $1').toLowerCase()} updated`
      );
    } catch (error) {
      console.error(`Failed to update ${key}:`, error);
      Alert.alert('Error', `Failed to update ${key} setting`);
    }
  };

  const resetAllSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all accessibility settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              // Reset to default settings
              const defaultSettings = accessibilityService.getSettings();
              for (const [key, value] of Object.entries(defaultSettings)) {
                await accessibilityService.updateSetting(
                  key as keyof AccessibilitySettings,
                  value
                );
              }
              await loadSettings();
              await accessibilityService.hapticFeedback('success');
            } catch (error) {
              console.error('Failed to reset settings:', error);
            }
          },
        },
      ]
    );
  };

  const validateSettings = async () => {
    const validation = await accessibilityService.validateAccessibilitySetup();
    
    if (validation.isValid) {
      Alert.alert('Settings Valid', 'All accessibility settings are properly configured!');
      await accessibilityService.hapticFeedback('success');
    } else {
      const issuesText = validation.issues.join('\n• ');
      const recommendationsText = validation.recommendations.join('\n• ');
      
      Alert.alert(
        'Settings Issues',
        `Issues found:\n• ${issuesText}\n\nRecommendations:\n• ${recommendationsText}`
      );
      await accessibilityService.hapticFeedback('warning');
    }
  };

  const fontSizeMultiplier = accessibilityService.getFontSizeMultiplier();
  const availableLanguages = accessibilityService.getAvailableLanguages();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={[styles.loadingText, { fontSize: 16 * fontSizeMultiplier }]}>
          Loading accessibility settings...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={[styles.title, { fontSize: 24 * fontSizeMultiplier }]}>
        Accessibility Settings
      </Text>

      {/* Language Selection */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontSize: 18 * fontSizeMultiplier }]}>
          Language
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.languageContainer}>
            {availableLanguages.slice(0, 8).map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageButton,
                  settings.language === lang.code && { backgroundColor: accessibility.theme.primary + '20' }
                ]}
                onPress={() => updateSetting('language', lang.code)}
                accessibilityLabel={`Select ${lang.name} language`}
              >
                <Text
                  style={[
                    styles.languageCode,
                    {
                      fontSize: 14 * fontSizeMultiplier,
                      color: settings.language === lang.code ? accessibility.theme.primary : accessibility.theme.text
                    }
                  ]}
                >
                  {lang.code.toUpperCase()}
                </Text>
                <Text
                  style={[
                    styles.languageName,
                    {
                      fontSize: 10 * fontSizeMultiplier,
                      color: settings.language === lang.code ? accessibility.theme.primary : accessibility.theme.textSecondary
                    }
                  ]}
                >
                  {lang.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Font Size */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontSize: 18 * fontSizeMultiplier }]}>
          Font Size
        </Text>
        <View style={styles.optionsContainer}>
          {(['small', 'medium', 'large', 'extra-large'] as FontSize[]).map((size) => (
            <TouchableOpacity
              key={size}
              style={[
                styles.optionButton,
                settings.fontSize === size && { backgroundColor: accessibility.theme.primary + '20' }
              ]}
              onPress={() => updateSetting('fontSize', size)}
              accessibilityLabel={`Set font size to ${size}`}
            >
              <Text
                style={[
                  styles.optionText,
                  {
                    fontSize: 16 * fontSizeMultiplier,
                    color: settings.fontSize === size ? accessibility.theme.primary : accessibility.theme.text
                  }
                ]}
              >
                {size === 'extra-large' ? 'XL' : size.charAt(0).toUpperCase() + size.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.previewText, { fontSize: 16 * fontSizeMultiplier }]}>
          Preview text at current size
        </Text>
      </View>

      {/* Language Selection */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontSize: 18 * fontSizeMultiplier }]}>
          Language
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.languageContainer}>
            {availableLanguages.slice(0, 8).map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageButton,
                  settings.language === lang.code && { backgroundColor: accessibility.theme.primary + '20' }
                ]}
                onPress={() => updateSetting('language', lang.code)}
                accessibilityLabel={`Select ${lang.name} language`}
              >
                <Text
                  style={[
                    styles.languageCode,
                    {
                      fontSize: 14 * fontSizeMultiplier,
                      color: settings.language === lang.code ? accessibility.theme.primary : accessibility.theme.text
                    }
                  ]}
                >
                  {lang.code.toUpperCase()}
                </Text>
                <Text
                  style={[
                    styles.languageName,
                    {
                      fontSize: 10 * fontSizeMultiplier,
                      color: settings.language === lang.code ? accessibility.theme.primary : accessibility.theme.textSecondary
                    }
                  ]}
                >
                  {lang.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Visual Accessibility */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontSize: 18 * fontSizeMultiplier }]}>
          Visual Accessibility
        </Text>

        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { fontSize: 16 * fontSizeMultiplier }]}>
            High Contrast Mode
          </Text>
          <Switch
            value={settings.highContrast}
            onValueChange={(value) => updateSetting('highContrast', value)}
            accessibilityLabel="Toggle high contrast mode"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { fontSize: 16 * fontSizeMultiplier }]}>
            Reduce Motion
          </Text>
          <Switch
            value={settings.motionReduced}
            onValueChange={(value) => updateSetting('motionReduced', value)}
            accessibilityLabel="Toggle reduced motion"
          />
        </View>
      </View>

      {/* Audio Accessibility */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontSize: 18 * fontSizeMultiplier }]}>
          Audio Accessibility
        </Text>

        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { fontSize: 16 * fontSizeMultiplier }]}>
            Voice Over
          </Text>
          <Switch
            value={settings.voiceOver}
            onValueChange={(value) => updateSetting('voiceOver', value)}
            accessibilityLabel="Toggle voice over"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { fontSize: 16 * fontSizeMultiplier }]}>
            Screen Reader Support
          </Text>
          <Switch
            value={settings.screenReader}
            onValueChange={(value) => updateSetting('screenReader', value)}
            accessibilityLabel="Toggle screen reader support"
          />
        </View>
      </View>

      {/* Interaction */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontSize: 18 * fontSizeMultiplier }]}>
          Interaction
        </Text>

        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { fontSize: 16 * fontSizeMultiplier }]}>
            Haptic Feedback
          </Text>
          <Switch
            value={settings.hapticFeedback}
            onValueChange={(value) => updateSetting('hapticFeedback', value)}
            accessibilityLabel="Toggle haptic feedback"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { fontSize: 16 * fontSizeMultiplier }]}>
            User Hints
          </Text>
          <Switch
            value={settings.hintsEnabled}
            onValueChange={(value) => updateSetting('hintsEnabled', value)}
            accessibilityLabel="Toggle user hints"
          />
        </View>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={validateSettings}
          accessibilityLabel="Validate accessibility settings"
        >
          <Text style={[styles.actionButtonText, { fontSize: 16 * fontSizeMultiplier }]}>
            Validate Settings
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.resetButton]}
          onPress={resetAllSettings}
          accessibilityLabel="Reset all accessibility settings"
        >
          <Text style={[styles.actionButtonText, { fontSize: 16 * fontSizeMultiplier }]}>
            Reset to Default
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#6B7280',
  },
  title: {
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    color: '#374151',
    flex: 1,
    marginRight: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginBottom: 8,
  },
  picker: {
    height: 50,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    minWidth: 60,
    alignItems: 'center',
  },
  optionText: {
    fontWeight: '500',
  },
  languageContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    minWidth: 60,
  },
  languageCode: {
    fontWeight: '600',
    marginBottom: 2,
  },
  languageName: {
    textAlign: 'center',
  },
  previewText: {
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  actionButton: {
    backgroundColor: '#1E40AF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default AccessibilitySettingsComponent;
