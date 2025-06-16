import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { TestTube, X } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { router } from 'expo-router';

export function DemoModeBanner() {
  const { isDemoMode, demoAccount, signOut } = useAuth();

  if (!isDemoMode) return null;

  const handleExitDemo = () => {
    Alert.alert(
      'Exit Demo Mode',
      'Are you sure you want to exit demo mode? You will be signed out.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Exit Demo',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.banner}>
      <View style={styles.content}>
        <TestTube color="#FFFFFF" size={16} />
        <Text style={styles.text}>
          Demo Mode - {demoAccount?.role?.charAt(0).toUpperCase()}{demoAccount?.role?.slice(1)} Account
        </Text>
      </View>
      <TouchableOpacity onPress={handleExitDemo} style={styles.closeButton}>
        <X color="#FFFFFF" size={16} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
});