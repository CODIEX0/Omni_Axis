import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Settings, Shield, Bell, CircleHelp as HelpCircle, FileText, LogOut, ChevronRight, Star, Wallet, Globe, Moon, Smartphone, CreditCard, Lock, Eye, Download, TestTube, Database, Accessibility, Languages } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { KYCStatus } from '../../components/KYCStatus';
import { portfolioService } from '../../services/portfolioService';
import { DemoModeToggle } from '../../components/DemoModeToggle';
import useAccessibility from '../../hooks/useAccessibility';
import AccessibilitySettingsComponent from '../../components/AccessibilitySettings';
import LanguageSelector from '../../components/LanguageSelector';
import { securityService } from '../../services/security';

export default function ProfileScreen() {
  const { user, profile, isDemoMode, demoAccount, signOut } = useAuth();
  const accessibility = useAccessibility();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [realUserPortfolio, setRealUserPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showDemoToggle, setShowDemoToggle] = useState(false);
  const [showAccessibilitySettings, setShowAccessibilitySettings] = useState(false);
  const [securityStatus, setSecurityStatus] = useState<any>(null);

  // Load real user portfolio data
  useEffect(() => {
    const loadRealUserData = async () => {
      if (!isDemoMode && user?.id) {
        setLoading(true);
        try {
          const portfolioData = await portfolioService.getUserPortfolio(user.id);
          setRealUserPortfolio(portfolioData);
        } catch (error) {
          console.error('Error loading user portfolio:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    const loadSecurityStatus = async () => {
      try {
        const status = await securityService.getSecurityStatus();
        setSecurityStatus(status);
      } catch (error) {
        console.error('Failed to load security status:', error);
      }
    };

    loadRealUserData();
    loadSecurityStatus();
  }, [user, isDemoMode]);

  const getUserProfile = () => {
    if (isDemoMode && demoAccount) {
      return {
        name: `${demoAccount.profile.firstName} ${demoAccount.profile.lastName}`,
        email: demoAccount.email,
        memberSince: new Date(demoAccount.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        kycStatus: demoAccount.profile.kycStatus === 'verified' ? 'Verified' : 'Pending',
        totalInvestments: demoAccount.portfolio?.totalValue || 0,
        portfolioAssets: demoAccount.portfolio?.assets?.length || 0,
        avatar: demoAccount.profile.profileImage,
        role: demoAccount.role,
      };
    }
    
    // Real user data
    const userName = profile?.full_name || user?.email?.split('@')[0] || 'User';
    const memberSince = user?.created_at ? 
      new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 
      'Recently';
    
    return {
      name: userName,
      email: user?.email || '',
      memberSince,
      kycStatus: profile?.kyc_status === 'approved' ? 'Verified' : 
                 profile?.kyc_status === 'pending' ? 'Pending' : 'Not Started',
      totalInvestments: realUserPortfolio?.totalInvestments || 0,
      portfolioAssets: realUserPortfolio?.portfolioAssets || 0,
      avatar: profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=2196F3&color=fff`,
      role: profile?.role || 'investor',
    };
  };

  const userProfile = getUserProfile();

  const menuSections = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Personal Information', action: () => {} },
        { 
          icon: Shield, 
          label: 'KYC Verification', 
          action: () => router.push('/(auth)/kyc'), 
          badge: userProfile.kycStatus 
        },
        { icon: Wallet, label: 'Connected Wallets', action: () => {} },
        { icon: CreditCard, label: 'Payment Methods', action: () => {} },
      ]
    },
    {
      title: 'Accessibility & Language',
      items: [
        { 
          icon: Accessibility, 
          label: 'Accessibility Settings', 
          action: () => {
            setShowAccessibilitySettings(true);
            accessibility.hapticFeedback('light');
          },
          value: `Font: ${accessibility.settings.fontSize}`
        },
        { 
          icon: Languages, 
          label: 'Language', 
          action: () => {},
          customComponent: true
        },
        { 
          icon: Moon, 
          label: 'High Contrast', 
          action: () => {},
          toggle: true,
          value: accessibility.settings.highContrast,
          onToggle: (value: boolean) => accessibility.updateSetting('highContrast', value)
        },
        { 
          icon: Bell, 
          label: 'Voice Over', 
          action: () => {},
          toggle: true,
          value: accessibility.settings.voiceOver,
          onToggle: (value: boolean) => accessibility.updateSetting('voiceOver', value)
        },
        { 
          icon: Smartphone, 
          label: 'Haptic Feedback', 
          action: () => {},
          toggle: true,
          value: accessibility.settings.hapticFeedback,
          onToggle: (value: boolean) => accessibility.updateSetting('hapticFeedback', value)
        },
        { 
          icon: HelpCircle, 
          label: 'User Hints', 
          action: () => {},
          toggle: true,
          value: accessibility.settings.hintsEnabled,
          onToggle: (value: boolean) => accessibility.updateSetting('hintsEnabled', value)
        },
      ]
    },
    {
      title: 'Security',
      items: [
        { 
          icon: Shield, 
          label: 'Security Status', 
          action: async () => {
            try {
              const status = await securityService.getSecurityStatus();
              Alert.alert(
                'Security Status',
                `Security Level: ${status.overallSecurityLevel}\nDevice Trust: ${status.deviceTrust.isValid ? 'Trusted' : 'Not Trusted'}\nLast Check: ${new Date(status.lastSecurityCheck).toLocaleString()}`
              );
              accessibility.hapticFeedback('light');
            } catch (error) {
              Alert.alert('Error', 'Failed to check security status');
              accessibility.hapticFeedback('error');
            }
          },
          value: securityStatus ? securityStatus.overallSecurityLevel : 'Unknown'
        },
        { icon: Lock, label: 'Change Password', action: () => {} },
        { icon: Smartphone, label: 'Two-Factor Authentication', action: () => {} },
        { icon: Eye, label: 'Privacy Settings', action: () => {} },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { 
          icon: Bell, 
          label: 'Notifications', 
          action: () => {},
          toggle: true,
          value: notificationsEnabled,
          onToggle: setNotificationsEnabled
        },
        { 
          icon: Smartphone, 
          label: 'Biometric Authentication', 
          action: () => {},
          toggle: true,
          value: biometricEnabled,
          onToggle: setBiometricEnabled
        },
        { 
          icon: Moon, 
          label: 'Dark Mode', 
          action: () => {},
          toggle: true,
          value: darkModeEnabled,
          onToggle: setDarkModeEnabled
        },
        { icon: Globe, label: 'Language', action: () => {}, value: 'English' },
      ]
    },
    {
      title: 'App Mode',
      items: [
        { 
          icon: isDemoMode ? TestTube : Database, 
          label: isDemoMode ? 'Demo Mode Active' : 'Real Data Mode', 
          action: () => setShowDemoToggle(true),
          badge: isDemoMode ? 'DEMO' : 'LIVE'
        },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help Center', action: () => {} },
        { icon: FileText, label: 'Terms of Service', action: () => {} },
        { icon: FileText, label: 'Privacy Policy', action: () => {} },
        { icon: Download, label: 'Export Data', action: () => {} },
      ]
    }
  ];

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive', 
          onPress: async () => {
            await signOut();
            router.replace('/(auth)');
          }
        }
      ]
    );
  };

  const renderMenuItem = (item: any, index: number) => {
    // Special handling for language selector
    if (item.customComponent && item.label === 'Language') {
      return (
        <View key={index} style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={styles.menuItemIcon}>
              <item.icon color="#6B7280" size={20} />
            </View>
            <Text style={[styles.menuItemLabel, { fontSize: 16 * accessibility.fontSizeMultiplier }]}>
              {item.label}
            </Text>
          </View>
          <View style={styles.menuItemRight}>
            <LanguageSelector 
              compact={true} 
              onLanguageChange={(language) => {
                accessibility.hapticFeedback('light');
                accessibility.announceForAccessibility(`Language changed to ${language}`);
              }}
            />
          </View>
        </View>
      );
    }

    return (
      <TouchableOpacity key={index} style={styles.menuItem} onPress={item.action}>
        <View style={styles.menuItemLeft}>
          <View style={styles.menuItemIcon}>
            <item.icon color="#6B7280" size={20} />
          </View>
          <Text style={[styles.menuItemLabel, { fontSize: 16 * accessibility.fontSizeMultiplier }]}>
            {item.label}
          </Text>
          {item.badge && (
            <View style={styles.badge}>
              <Text style={[styles.badgeText, { fontSize: 12 * accessibility.fontSizeMultiplier }]}>
                {item.badge}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.menuItemRight}>
          {item.toggle ? (
            <Switch
              value={item.value}
              onValueChange={async (newValue) => {
                await item.onToggle(newValue);
                await accessibility.hapticFeedback('light');
              }}
              trackColor={{ false: '#E5E7EB', true: '#1E40AF' }}
              thumbColor={item.value ? '#FFFFFF' : '#FFFFFF'}
            />
          ) : item.value ? (
            <Text style={[styles.menuItemValue, { fontSize: 14 * accessibility.fontSizeMultiplier }]}>
              {item.value}
            </Text>
          ) : (
            <ChevronRight color="#9CA3AF" size={16} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#1E40AF', '#3B82F6']}
          style={styles.header}
        >
          <View style={styles.profileSection}>
            <Image source={{ uri: userProfile.avatar }} style={styles.avatar} />
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{userProfile.name}</Text>
              <Text style={styles.userEmail}>{userProfile.email}</Text>
              <Text style={styles.memberSince}>
                Member since {userProfile.memberSince}
              </Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Settings color="#FFFFFF" size={20} />
            </TouchableOpacity>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {loading && !isDemoMode ? '...' : `${userProfile.totalInvestments.toLocaleString()}`}
              </Text>
              <Text style={styles.statLabel}>Total Invested</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {loading && !isDemoMode ? '...' : userProfile.portfolioAssets}
              </Text>
              <Text style={styles.statLabel}>Assets</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <View style={[
                styles.verificationBadge,
                { backgroundColor: userProfile.kycStatus === 'Verified' ? '#10B981' : 
                                  userProfile.kycStatus === 'Pending' ? '#F59E0B' : '#EF4444' }
              ]}>
                <Star color="#FFFFFF" size={12} fill="#FFFFFF" />
                <Text style={styles.verificationText}>{userProfile.kycStatus}</Text>
              </View>
              <Text style={styles.statLabel}>KYC Status</Text>
            </View>
          </View>
        </LinearGradient>

        {/* KYC Status */}
        <KYCStatus />

        {/* Menu Sections */}
        <View style={styles.content}>
          {menuSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.menuSection}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.menuCard}>
                {section.items.map((item, itemIndex) => (
                  <View key={itemIndex}>
                    {renderMenuItem(item, itemIndex)}
                    {itemIndex < section.items.length - 1 && (
                      <View style={styles.menuItemDivider} />
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))}

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut color="#EF4444" size={20} />
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>

          {/* App Version */}
          <Text style={styles.appVersion}>Omni Axis v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Demo Mode Toggle */}
      <DemoModeToggle 
        visible={showDemoToggle}
        onClose={() => setShowDemoToggle(false)}
      />

      {/* Accessibility Settings Modal */}
      <Modal
        visible={showAccessibilitySettings}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAccessibilitySettings(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: accessibility.theme.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { 
              fontSize: 20 * accessibility.fontSizeMultiplier,
              color: accessibility.theme.text 
            }]}>
              Accessibility Settings
            </Text>
            <TouchableOpacity 
              onPress={() => {
                setShowAccessibilitySettings(false);
                accessibility.hapticFeedback('light');
              }}
              style={styles.modalCloseButton}
            >
              <Text style={[styles.modalCloseText, { 
                fontSize: 16 * accessibility.fontSizeMultiplier,
                color: accessibility.theme.primary 
              }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
          <AccessibilitySettingsComponent 
            onSettingsChange={(settings) => {
              console.log('Accessibility settings changed:', settings);
            }}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 16,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 4,
  },
  verificationText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  menuSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 12,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
    flex: 1,
  },
  badge: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  menuItemRight: {
    alignItems: 'center',
  },
  menuItemValue: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontFamily: 'Inter-SemiBold',
  },
  modalCloseButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalCloseText: {
    fontFamily: 'Inter-SemiBold',
  },
  menuItemDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 76,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#EF4444',
    marginLeft: 12,
  },
  appVersion: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
  },
});