// Initialize polyfills first
import '../utils/polyfills';

import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { View, Text, StyleSheet } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts } from 'expo-font';
import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { store, persistor } from '../store';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ThirdwebProviderWrapper } from '../services/thirdweb';
import Toast from 'react-native-toast-message';
import '../i18n';

// Import accessibility and security components
import useAccessibility from '../hooks/useAccessibility';
import AccessibilitySecurityButton from '../components/AccessibilitySecurityButton';
import UserHints from '../components/UserHints';
import accessibilityService from '../services/accessibility';
import { securityService } from '../services/security';

// Import polyfills for React Native
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

SplashScreen.preventAutoHideAsync();

// Accessibility Provider Component
function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const accessibility = useAccessibility();
  const [securityInitialized, setSecurityInitialized] = useState(false);

  useEffect(() => {
    initializeSecurity();
  }, []);

  const initializeSecurity = async () => {
    try {
      // Initialize security service
      await securityService.initializeSecurity();
      setSecurityInitialized(true);
    } catch (error) {
      console.error('Failed to initialize security:', error);
      setSecurityInitialized(true); // Continue even if security fails
    }
  };

  if (accessibility.isLoading || !securityInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner message="Initializing accessibility and security..." />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: accessibility.theme.background }]}>
      {children}
      <UserHints />
      <AccessibilitySecurityButton />
    </View>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Light': Inter_300Light,
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingSpinner message="Loading..." />} persistor={persistor}>
        <ThirdwebProviderWrapper>
          <AccessibilityProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
            <Toast />
          </AccessibilityProvider>
        </ThirdwebProviderWrapper>
      </PersistGate>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});