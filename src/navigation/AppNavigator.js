import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

import DashboardScreen from '../screens/DashboardScreen';
import CoachScreen from '../screens/CoachScreen';
import ProgressScreen from '../screens/ProgressScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator({ user, onLogout, onUpgrade, onUserUpdate }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 16,
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Dashboard: 'home-outline',
            Analisi: 'play-circle-outline',
            Progressi: 'trending-up-outline',
            Impostazioni: 'settings-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard">
        {() => <DashboardScreen user={user} onUpgrade={onUpgrade} />}
      </Tab.Screen>
      <Tab.Screen name="Analisi">
        {() => <CoachScreen user={user} onUpgrade={onUpgrade} />}
      </Tab.Screen>
      <Tab.Screen name="Progressi">
        {() => <ProgressScreen user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Impostazioni">
        {() => (
          <SettingsScreen
            user={user}
            onLogout={onLogout}
            onUpgrade={onUpgrade}
            onUserUpdate={onUserUpdate}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
