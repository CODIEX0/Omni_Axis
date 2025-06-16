import React from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { Chrome as Home, Search, Plus, Briefcase, User, Users, Shield } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { DemoModeBanner } from '../../components/DemoModeBanner';

export default function TabLayout() {
  const { isDemoMode } = useAuth();

  return (
    <View style={{ flex: 1 }}>
      <DemoModeBanner />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopColor: isDemoMode ? '#F59E0B' : 'rgba(0, 0, 0, 0.1)',
            borderTopWidth: isDemoMode ? 2 : 1,
            height: 88,
            paddingBottom: 20,
            paddingTop: 12,
          },
          tabBarActiveTintColor: isDemoMode ? '#F59E0B' : '#1E40AF',
          tabBarInactiveTintColor: '#6B7280',
          tabBarLabelStyle: {
            fontSize: 12,
            fontFamily: 'Inter-Medium',
            marginTop: 4,
          },
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} strokeWidth={2.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: 'Marketplace',
          tabBarIcon: ({ size, color }) => (
            <Search size={size} color={color} strokeWidth={2.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ size, color }) => (
            <Users size={size} color={color} strokeWidth={2.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="tokenize"
        options={{
          title: 'Tokenize',
          tabBarIcon: ({ size, color }) => (
            <Plus size={size} color={color} strokeWidth={2.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: 'Portfolio',
          tabBarIcon: ({ size, color }) => (
            <Briefcase size={size} color={color} strokeWidth={2.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="compliance"
        options={{
          title: 'Compliance',
          tabBarIcon: ({ size, color }) => (
            <Shield size={size} color={color} strokeWidth={2.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => (
            <User size={size} color={color} strokeWidth={2.5} />
          ),
        }}
      />
      </Tabs>
    </View>
  );
}