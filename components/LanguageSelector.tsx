/**
 * Language Selector Component
 * Dropdown/modal for selecting app language
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import accessibilityService, { AccessibilityLanguage } from '../services/accessibility';

interface LanguageSelectorProps {
  onLanguageChange?: (language: AccessibilityLanguage) => void;
  style?: any;
  compact?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  onLanguageChange,
  style,
  compact = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<AccessibilityLanguage>('en');
  const [availableLanguages] = useState(accessibilityService.getAvailableLanguages());

  useEffect(() => {
    loadCurrentLanguage();
  }, []);

  const loadCurrentLanguage = async () => {
    const settings = accessibilityService.getSettings();
    setSelectedLanguage(settings.language);
  };

  const handleLanguageSelect = async (language: AccessibilityLanguage) => {
    try {
      await accessibilityService.updateSetting('language', language);
      setSelectedLanguage(language);
      setIsVisible(false);
      onLanguageChange?.(language);
      
      // Provide feedback
      await accessibilityService.hapticFeedback('light');
      await accessibilityService.announceForAccessibility(
        `Language changed to ${availableLanguages.find(l => l.code === language)?.name}`
      );
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const getCurrentLanguageName = () => {
    const language = availableLanguages.find(lang => lang.code === selectedLanguage);
    return language ? (compact ? language.code.toUpperCase() : language.name) : 'EN';
  };

  const fontSizeMultiplier = accessibilityService.getFontSizeMultiplier();
  const settings = accessibilityService.getSettings();
  const theme = accessibilityService.getAccessibilityTheme();
  const currentTheme = settings.colorScheme === 'dark' ? theme.dark : theme.light;

  const renderLanguageItem = ({ item }: { item: typeof availableLanguages[0] }) => (
    <TouchableOpacity
      style={[
        styles.languageItem,
        { backgroundColor: currentTheme.surface, borderColor: currentTheme.border },
        selectedLanguage === item.code && {
          backgroundColor: currentTheme.primary + '20',
          borderColor: currentTheme.primary,
        },
      ]}
      onPress={() => handleLanguageSelect(item.code)}
      accessibilityLabel={`Select ${item.name} language`}
      accessibilityState={{ selected: selectedLanguage === item.code }}
    >
      <View style={styles.languageItemContent}>
        <Text
          style={[
            styles.languageName,
            { fontSize: 16 * fontSizeMultiplier, color: currentTheme.text },
          ]}
        >
          {item.name}
        </Text>
        <Text
          style={[
            styles.languageNative,
            { fontSize: 14 * fontSizeMultiplier, color: currentTheme.textSecondary },
          ]}
        >
          {item.nativeName}
        </Text>
      </View>
      {selectedLanguage === item.code && (
        <Ionicons
          name="checkmark-circle"
          size={24}
          color={currentTheme.primary}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity
        style={[
          compact ? styles.compactSelector : styles.selector,
          { backgroundColor: currentTheme.surface, borderColor: currentTheme.border },
          style,
        ]}
        onPress={() => setIsVisible(true)}
        accessibilityLabel={`Current language: ${getCurrentLanguageName()}. Tap to change language.`}
      >
        <Text
          style={[
            compact ? styles.compactSelectorText : styles.selectorText,
            { fontSize: (compact ? 14 : 16) * fontSizeMultiplier, color: currentTheme.text },
          ]}
        >
          {getCurrentLanguageName()}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color={currentTheme.textSecondary}
        />
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: currentTheme.background },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  { fontSize: 20 * fontSizeMultiplier, color: currentTheme.text },
                ]}
              >
                Select Language
              </Text>
              <TouchableOpacity
                onPress={() => setIsVisible(false)}
                style={styles.closeButton}
                accessibilityLabel="Close language selector"
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={currentTheme.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <FlatList
              data={availableLanguages}
              keyExtractor={(item) => item.code}
              renderItem={renderLanguageItem}
              showsVerticalScrollIndicator={false}
              style={styles.languageList}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 120,
  },
  compactSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 60,
  },
  selectorText: {
    fontWeight: '500',
    marginRight: 8,
  },
  compactSelectorText: {
    fontWeight: '600',
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: height * 0.7,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  languageList: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  languageItemContent: {
    flex: 1,
  },
  languageName: {
    fontWeight: '500',
    marginBottom: 2,
  },
  languageNative: {
    opacity: 0.7,
  },
});

export default LanguageSelector;
