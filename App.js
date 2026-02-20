import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import AuthScreen from './src/screens/AuthScreen';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/theme/colors';
import { loadUser, saveUser, clearSession } from './src/services/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Ripristina sessione al lancio
  useEffect(() => {
    loadUser()
      .then(u => setUser(u))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAuthSuccess = async (userData, token) => {
    await saveUser(userData, token);
    setUser(userData);
  };

  const handleLogout = async () => {
    await clearSession();
    setUser(null);
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={colors.bg} />
        <NavigationContainer
          theme={{
            dark: true,
            colors: {
              primary: colors.primary,
              background: colors.bg,
              card: colors.tabBar,
              text: colors.text,
              border: colors.border,
              notification: colors.primary,
            },
          }}
        >
          {!user ? (
            <AuthScreen onAuthSuccess={handleAuthSuccess} />
          ) : (
            <AppNavigator
              user={user}
              onLogout={handleLogout}
              onUpgrade={() => setShowUpgrade(true)}
              onUserUpdate={handleUserUpdate}
            />
          )}
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
