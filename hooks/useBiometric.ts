import { useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export interface BiometricResult {
  isAvailable: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
  authenticate: () => Promise<boolean>;
}

export function useBiometric(): BiometricResult {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [supportedTypes, setSupportedTypes] = useState<LocalAuthentication.AuthenticationType[]>([]);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    if (Platform.OS === 'web') {
      setIsAvailable(false);
      setIsEnrolled(false);
      setSupportedTypes([]);
      return;
    }

    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      setIsAvailable(compatible);
      setIsEnrolled(enrolled);
      setSupportedTypes(types);
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setIsAvailable(false);
      setIsEnrolled(false);
      setSupportedTypes([]);
    }
  };

  const authenticate = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      // Web fallback - could implement WebAuthn here
      return false;
    }

    if (!isAvailable || !isEnrolled) {
      return false;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access your account',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  };

  return {
    isAvailable,
    isEnrolled,
    supportedTypes,
    authenticate,
  };
}