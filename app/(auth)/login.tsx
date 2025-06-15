import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAuth, SignInData } from '../../hooks/useAuth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useBiometric } from '../../hooks/useBiometric';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { signIn, loading } = useAuth();
  const { isAvailable: biometricAvailable, authenticate } = useBiometric();

  const [formData, setFormData] = useState<SignInData>({
    email: '',
    password: '',
  });

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert(t('common.error'), 'Please fill in all fields');
      return;
    }

    try {
      const { user, error } = await signIn(formData);
      
      if (error) {
        Alert.alert(t('common.error'), error.message || 'Login failed');
        return;
      }

      if (user) {
        router.replace('/(tabs)');
      }
    } catch (err) {
      Alert.alert(t('common.error'), 'Login failed');
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const success = await authenticate();
      if (success) {
        // In a real app, you would use stored credentials or token
        const { user, error } = await signIn({ 
          email: 'biometric@user.com', 
          password: 'biometric' 
        });
        
        if (user) {
          router.replace('/(tabs)');
        }
      }
    } catch (err) {
      Alert.alert(t('common.error'), 'Biometric authentication failed');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1E40AF', '#3B82F6']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft color="#FFFFFF" size={24} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
            <Text style={styles.subtitle}>
              {t('auth.signInSubtitle')}
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label={t('auth.email')}
              value={formData.email}
              onChangeText={(email) => setFormData({ ...formData, email })}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label={t('auth.password')}
              value={formData.password}
              onChangeText={(password) => setFormData({ ...formData, password })}
              placeholder="Enter your password"
              secureTextEntry
            />

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword')}</Text>
            </TouchableOpacity>

            <Button
              title={isLoading ? 'Signing In...' : t('auth.signIn')}
              onPress={handleLogin}
              loading={isLoading}
              fullWidth
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {biometricAvailable && (
              <Button
                title={t('auth.biometricAuth')}
                onPress={handleBiometricLogin}
                variant="outline"
                fullWidth
              />
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {t('auth.dontHaveAccount')}{' '}
              <Text
                style={styles.footerLink}
                onPress={() => router.push('/(auth)/register')}
              >
                {t('auth.signUp')}
              </Text>
            </Text>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 24,
  },
  form: {
    flex: 1,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 32,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#F59E0B',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    marginHorizontal: 16,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  footerLink: {
    fontFamily: 'Inter-SemiBold',
    color: '#F59E0B',
  },
});