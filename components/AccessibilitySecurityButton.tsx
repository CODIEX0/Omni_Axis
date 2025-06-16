/**
 * Enhanced Accessibility & Security Button
 * Floating action button for quick access to accessibility and security features
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import useAccessibility from '../hooks/useAccessibility';
import { securityService } from '../services/security';

interface AccessibilitySecurityButtonProps {
  style?: any;
  showSecurityOptions?: boolean;
  showAccessibilityOptions?: boolean;
}

export const AccessibilitySecurityButton: React.FC<AccessibilitySecurityButtonProps> = ({
  style,
  showSecurityOptions = true,
  showAccessibilityOptions = true,
}) => {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [securityStatus, setSecurityStatus] = useState<any>(null);
  const accessibility = useAccessibility();

  useEffect(() => {
    loadSecurityStatus();
  }, []);

  const loadSecurityStatus = async () => {
    try {
      const status = await securityService.getSecurityStatus();
      setSecurityStatus(status);
    } catch (error) {
      console.error('Failed to load security status:', error);
    }
  };

  const toggleMenu = async () => {
    setIsMenuVisible(!isMenuVisible);
    await accessibility.hapticFeedback('light');
  };

  const closeMenu = () => {
    setIsMenuVisible(false);
  };

  const handleLanguageToggle = async () => {
    const languages = accessibility.getAvailableLanguages?.() || [];
    const currentLangIndex = languages.findIndex(lang => lang.code === accessibility.settings.language);
    const nextLangIndex = (currentLangIndex + 1) % languages.length;
    const nextLanguage = languages[nextLangIndex];
    
    if (nextLanguage) {
      await accessibility.updateSetting('language', nextLanguage.code);
      await accessibility.announceForAccessibility(`Language changed to ${nextLanguage.name}`);
    }
    closeMenu();
  };

  const handleFontSizeToggle = async () => {
    const fontSizes: Array<'small' | 'medium' | 'large' | 'extra-large'> = ['small', 'medium', 'large', 'extra-large'];
    const currentIndex = fontSizes.indexOf(accessibility.settings.fontSize);
    const nextIndex = (currentIndex + 1) % fontSizes.length;
    
    await accessibility.updateSetting('fontSize', fontSizes[nextIndex]);
    await accessibility.announceForAccessibility(`Font size changed to ${fontSizes[nextIndex]}`);
    closeMenu();
  };

  const handleHighContrastToggle = async () => {
    const newValue = !accessibility.settings.highContrast;
    await accessibility.updateSetting('highContrast', newValue);
    await accessibility.announceForAccessibility(
      `High contrast ${newValue ? 'enabled' : 'disabled'}`
    );
    closeMenu();
  };

  const handleVoiceOverToggle = async () => {
    const newValue = !accessibility.settings.voiceOver;
    await accessibility.updateSetting('voiceOver', newValue);
    await accessibility.announceForAccessibility(
      `Voice over ${newValue ? 'enabled' : 'disabled'}`
    );
    closeMenu();
  };

  const handleHapticToggle = async () => {
    const newValue = !accessibility.settings.hapticFeedback;
    await accessibility.updateSetting('hapticFeedback', newValue);
    
    if (newValue) {
      await accessibility.hapticFeedback('success');
    }
    
    await accessibility.announceForAccessibility(
      `Haptic feedback ${newValue ? 'enabled' : 'disabled'}`
    );
    closeMenu();
  };

  const handleHintsToggle = async () => {
    const newValue = !accessibility.settings.hintsEnabled;
    await accessibility.updateSetting('hintsEnabled', newValue);
    await accessibility.announceForAccessibility(
      `User hints ${newValue ? 'enabled' : 'disabled'}`
    );
    closeMenu();
  };

  const handleSecurityCheck = async () => {
    try {
      const assessment = await securityService.assessDeviceSecurity();
      const statusMessage = `Security Level: ${assessment.securityLevel}\n` +
        `Device Trusted: ${assessment.isTrustedDevice ? 'Yes' : 'No'}\n` +
        `Jailbroken/Rooted: ${assessment.isJailbroken ? 'Yes' : 'No'}`;
      
      Alert.alert('Security Status', statusMessage);
      await accessibility.hapticFeedback(assessment.securityLevel === 'HIGH' ? 'success' : 'warning');
    } catch (error) {
      Alert.alert('Error', 'Failed to check security status');
      await accessibility.hapticFeedback('error');
    }
    closeMenu();
  };

  const handleBiometricAuth = async () => {
    try {
      const result = await securityService.authenticateWithBiometrics();
      if (result.success) {
        Alert.alert('Success', 'Biometric authentication successful');
        await accessibility.hapticFeedback('success');
      } else {
        Alert.alert('Failed', result.error || 'Biometric authentication failed');
        await accessibility.hapticFeedback('error');
      }
    } catch (error) {
      Alert.alert('Error', 'Biometric authentication error');
      await accessibility.hapticFeedback('error');
    }
    closeMenu();
  };

  const handleSecureWipe = () => {
    Alert.alert(
      'Secure Data Wipe',
      'This will permanently delete all sensitive data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Wipe Data',
          style: 'destructive',
          onPress: async () => {
            try {
              await securityService.secureDataWipe();
              Alert.alert('Success', 'Sensitive data has been securely wiped');
              await accessibility.hapticFeedback('success');
            } catch (error) {
              Alert.alert('Error', 'Failed to wipe data');
              await accessibility.hapticFeedback('error');
            }
          },
        },
      ]
    );
    closeMenu();
  };

  const getSecurityStatusColor = () => {
    if (!securityStatus) return accessibility.theme.textSecondary;
    
    switch (securityStatus.overallSecurityLevel) {
      case 'MAXIMUM':
      case 'HIGH':
        return accessibility.theme.success;
      case 'MEDIUM':
        return accessibility.theme.warning;
      case 'LOW':
        return accessibility.theme.error;
      default:
        return accessibility.theme.textSecondary;
    }
  };

  const MenuOption = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    color,
    accessibilityLabel 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    color?: string;
    accessibilityLabel?: string;
  }) => (
    <TouchableOpacity
      style={[styles.menuOption, { borderColor: accessibility.theme.border }]}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel || title}
    >
      <Ionicons
        name={icon as any}
        size={24}
        color={color || accessibility.theme.primary}
      />
      <View style={styles.menuOptionText}>
        <Text
          style={[
            styles.menuOptionTitle,
            {
              fontSize: 16 * accessibility.fontSizeMultiplier,
              color: accessibility.theme.text,
            },
          ]}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[
              styles.menuOptionSubtitle,
              {
                fontSize: 12 * accessibility.fontSizeMultiplier,
                color: accessibility.theme.textSecondary,
              },
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity
        style={[
          styles.fab,
          { backgroundColor: accessibility.theme.primary },
          style,
        ]}
        onPress={toggleMenu}
        accessibilityLabel="Open accessibility and security menu"
      >
        <Ionicons name="accessibility" size={28} color="#FFFFFF" />
        {securityStatus && (
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: getSecurityStatusColor() },
            ]}
          />
        )}
      </TouchableOpacity>

      <Modal
        visible={isMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeMenu}
        >
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
          <View style={[styles.menuContainer, { backgroundColor: accessibility.theme.surface }]}>
            <View style={styles.menuHeader}>
              <Text
                style={[
                  styles.menuTitle,
                  {
                    fontSize: 20 * accessibility.fontSizeMultiplier,
                    color: accessibility.theme.text,
                  },
                ]}
              >
                Quick Access
              </Text>
              <TouchableOpacity onPress={closeMenu} style={styles.closeButton}>
                <Ionicons
                  name="close"
                  size={24}
                  color={accessibility.theme.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.menuContent} showsVerticalScrollIndicator={false}>
              {showAccessibilityOptions && (
                <View style={styles.section}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      {
                        fontSize: 16 * accessibility.fontSizeMultiplier,
                        color: accessibility.theme.text,
                      },
                    ]}
                  >
                    Accessibility
                  </Text>

                  <MenuOption
                    icon="language"
                    title="Language"
                    subtitle={`Current: ${accessibility.settings.language.toUpperCase()}`}
                    onPress={handleLanguageToggle}
                    accessibilityLabel="Change language"
                  />

                  <MenuOption
                    icon="text"
                    title="Font Size"
                    subtitle={`Current: ${accessibility.settings.fontSize}`}
                    onPress={handleFontSizeToggle}
                    accessibilityLabel="Change font size"
                  />

                  <MenuOption
                    icon={accessibility.settings.highContrast ? "contrast" : "contrast-outline"}
                    title="High Contrast"
                    subtitle={accessibility.settings.highContrast ? "Enabled" : "Disabled"}
                    onPress={handleHighContrastToggle}
                    color={accessibility.settings.highContrast ? accessibility.theme.success : undefined}
                    accessibilityLabel="Toggle high contrast mode"
                  />

                  <MenuOption
                    icon={accessibility.settings.voiceOver ? "volume-high" : "volume-high-outline"}
                    title="Voice Over"
                    subtitle={accessibility.settings.voiceOver ? "Enabled" : "Disabled"}
                    onPress={handleVoiceOverToggle}
                    color={accessibility.settings.voiceOver ? accessibility.theme.success : undefined}
                    accessibilityLabel="Toggle voice over"
                  />

                  <MenuOption
                    icon={accessibility.settings.hapticFeedback ? "phone-portrait" : "phone-portrait-outline"}
                    title="Haptic Feedback"
                    subtitle={accessibility.settings.hapticFeedback ? "Enabled" : "Disabled"}
                    onPress={handleHapticToggle}
                    color={accessibility.settings.hapticFeedback ? accessibility.theme.success : undefined}
                    accessibilityLabel="Toggle haptic feedback"
                  />

                  <MenuOption
                    icon={accessibility.settings.hintsEnabled ? "help-circle" : "help-circle-outline"}
                    title="User Hints"
                    subtitle={accessibility.settings.hintsEnabled ? "Enabled" : "Disabled"}
                    onPress={handleHintsToggle}
                    color={accessibility.settings.hintsEnabled ? accessibility.theme.success : undefined}
                    accessibilityLabel="Toggle user hints"
                  />
                </View>
              )}

              {showSecurityOptions && (
                <View style={styles.section}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      {
                        fontSize: 16 * accessibility.fontSizeMultiplier,
                        color: accessibility.theme.text,
                      },
                    ]}
                  >
                    Security
                  </Text>

                  <MenuOption
                    icon="shield-checkmark"
                    title="Security Check"
                    subtitle={securityStatus ? `Level: ${securityStatus.overallSecurityLevel}` : "Check status"}
                    onPress={handleSecurityCheck}
                    color={getSecurityStatusColor()}
                    accessibilityLabel="Run security assessment"
                  />

                  <MenuOption
                    icon="finger-print"
                    title="Biometric Auth"
                    subtitle="Authenticate with biometrics"
                    onPress={handleBiometricAuth}
                    accessibilityLabel="Authenticate with biometrics"
                  />

                  <MenuOption
                    icon="trash"
                    title="Secure Wipe"
                    subtitle="Erase sensitive data"
                    onPress={handleSecureWipe}
                    color={accessibility.theme.error}
                    accessibilityLabel="Securely wipe sensitive data"
                  />
                </View>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1000,
  },
  statusIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    width: width - 40,
    maxWidth: 400,
    maxHeight: height * 0.8,
    borderRadius: 16,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  menuTitle: {
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  menuContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
    opacity: 0.8,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  menuOptionText: {
    marginLeft: 16,
    flex: 1,
  },
  menuOptionTitle: {
    fontWeight: '500',
    marginBottom: 2,
  },
  menuOptionSubtitle: {
    opacity: 0.7,
  },
});

export default AccessibilitySecurityButton;
