/**
 * User Hints Component
 * Shows contextual hints and tips to users
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import accessibilityService, { UserHint } from '../services/accessibility';

interface UserHintsProps {
  onHintAction?: (hintId: string, action?: string) => void;
  autoShow?: boolean;
  category?: 'navigation' | 'feature' | 'security' | 'general';
}

export const UserHints: React.FC<UserHintsProps> = ({
  onHintAction,
  autoShow = true,
  category,
}) => {
  const [currentHint, setCurrentHint] = useState<UserHint | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));

  useEffect(() => {
    if (autoShow) {
      loadNextHint();
    }
  }, [autoShow, category]);

  const loadNextHint = async () => {
    const settings = accessibilityService.getSettings();
    if (!settings.hintsEnabled) return;

    await accessibilityService.loadHintStates();
    const nextHint = accessibilityService.getNextHint();
    
    if (nextHint && (!category || nextHint.category === category)) {
      setCurrentHint(nextHint);
      showHint();
    }
  };

  const showHint = () => {
    setIsVisible(true);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideHint = () => {
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
    });
  };

  const handleHintAction = async (action?: string) => {
    if (!currentHint) return;

    // Mark hint as shown
    await accessibilityService.markHintAsShown(currentHint.id);
    
    // Provide haptic feedback
    await accessibilityService.hapticFeedback('light');
    
    // Call action handler
    onHintAction?.(currentHint.id, action);
    
    // Hide current hint
    hideHint();
    
    // Auto-load next hint after a delay
    if (autoShow) {
      setTimeout(() => {
        loadNextHint();
      }, 2000);
    }
  };

  const dismissHint = () => {
    handleHintAction();
  };

  const executeAction = () => {
    handleHintAction(currentHint?.action);
  };

  if (!isVisible || !currentHint) {
    return null;
  }

  const fontSizeMultiplier = accessibilityService.getFontSizeMultiplier();
  const settings = accessibilityService.getSettings();
  const theme = accessibilityService.getAccessibilityTheme();
  const currentTheme = settings.colorScheme === 'dark' ? theme.dark : theme.light;

  const getPriorityColor = (priority: UserHint['priority']) => {
    switch (priority) {
      case 'high':
        return currentTheme.error;
      case 'medium':
        return currentTheme.warning;
      case 'low':
        return currentTheme.success;
      default:
        return currentTheme.primary;
    }
  };

  const getCategoryIcon = (category: UserHint['category']) => {
    switch (category) {
      case 'navigation':
        return 'navigate-outline';
      case 'feature':
        return 'star-outline';
      case 'security':
        return 'shield-checkmark-outline';
      case 'general':
        return 'information-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="none"
      onRequestClose={dismissHint}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.hintContainer,
            {
              backgroundColor: currentTheme.surface,
              borderColor: getPriorityColor(currentHint.priority),
              opacity: animatedValue,
              transform: [
                {
                  translateY: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons
                name={getCategoryIcon(currentHint.category)}
                size={24}
                color={getPriorityColor(currentHint.priority)}
              />
              <View style={styles.headerText}>
                <Text
                  style={[
                    styles.title,
                    { fontSize: 18 * fontSizeMultiplier, color: currentTheme.text },
                  ]}
                >
                  {currentHint.title}
                </Text>
                <Text
                  style={[
                    styles.category,
                    {
                      fontSize: 12 * fontSizeMultiplier,
                      color: getPriorityColor(currentHint.priority),
                    },
                  ]}
                >
                  {currentHint.category.toUpperCase()}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={dismissHint}
              style={styles.closeButton}
              accessibilityLabel="Dismiss hint"
            >
              <Ionicons
                name="close"
                size={20}
                color={currentTheme.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <Text
            style={[
              styles.message,
              { fontSize: 16 * fontSizeMultiplier, color: currentTheme.textSecondary },
            ]}
          >
            {currentHint.message}
          </Text>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.secondaryButton,
                { borderColor: currentTheme.border },
              ]}
              onPress={dismissHint}
              accessibilityLabel="Got it, dismiss hint"
            >
              <Text
                style={[
                  styles.secondaryButtonText,
                  { fontSize: 14 * fontSizeMultiplier, color: currentTheme.textSecondary },
                ]}
              >
                Got it
              </Text>
            </TouchableOpacity>

            {currentHint.action && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.primaryButton,
                  { backgroundColor: getPriorityColor(currentHint.priority) },
                ]}
                onPress={executeAction}
                accessibilityLabel={`Take action: ${currentHint.action}`}
              >
                <Text
                  style={[
                    styles.primaryButtonText,
                    { fontSize: 14 * fontSizeMultiplier },
                  ]}
                >
                  {currentHint.action}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Floating Hint Button Component
interface FloatingHintButtonProps {
  onPress?: () => void;
  style?: any;
}

export const FloatingHintButton: React.FC<FloatingHintButtonProps> = ({
  onPress,
  style,
}) => {
  const [hasHints, setHasHints] = useState(false);

  useEffect(() => {
    checkForHints();
  }, []);

  const checkForHints = async () => {
    await accessibilityService.loadHintStates();
    const nextHint = accessibilityService.getNextHint();
    setHasHints(!!nextHint);
  };

  if (!hasHints) {
    return null;
  }

  const fontSizeMultiplier = accessibilityService.getFontSizeMultiplier();
  const settings = accessibilityService.getSettings();
  const theme = accessibilityService.getAccessibilityTheme();
  const currentTheme = settings.colorScheme === 'dark' ? theme.dark : theme.light;

  return (
    <TouchableOpacity
      style={[
        styles.floatingButton,
        { backgroundColor: currentTheme.primary },
        style,
      ]}
      onPress={onPress}
      accessibilityLabel="Show available hints"
    >
      <Ionicons name="help-circle" size={24} color="#FFFFFF" />
      <View style={[styles.badge, { backgroundColor: currentTheme.warning }]}>
        <Text style={[styles.badgeText, { fontSize: 10 * fontSizeMultiplier }]}>
          !
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Manual Hints Manager Component
export const HintsManager: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  const showNextHint = async () => {
    await accessibilityService.loadHintStates();
    const nextHint = accessibilityService.getNextHint();
    if (nextHint) {
      setIsVisible(true);
    }
  };

  const resetAllHints = async () => {
    await accessibilityService.resetHints();
    await accessibilityService.hapticFeedback('success');
  };

  return (
    <>
      <FloatingHintButton onPress={showNextHint} />
      {isVisible && (
        <UserHints
          onHintAction={() => setIsVisible(false)}
          autoShow={false}
        />
      )}
    </>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  hintContainer: {
    width: width - 40,
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontWeight: '600',
    marginBottom: 2,
  },
  category: {
    fontWeight: '500',
    opacity: 0.8,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  message: {
    lineHeight: 24,
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  primaryButton: {
    // backgroundColor set dynamically
  },
  secondaryButton: {
    borderWidth: 1,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  secondaryButtonText: {
    fontWeight: '500',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 80,
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
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default UserHints;
