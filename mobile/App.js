import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import AppNavigator from './src/navigation/AppNavigator';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import { supabase } from './src/lib/supabase';

function RootContent() {
  const { isAuthenticated, userRole, loading, user } = useAuth();
  const [hasProfile, setHasProfile] = useState(null); // true/false/null(checking)

  useEffect(() => {
    if (isAuthenticated && user) {
      checkUserProfile();
    } else {
      setHasProfile(null);
    }
  }, [isAuthenticated, user]);

  async function checkUserProfile() {
    const { data } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single();
    setHasProfile(!!(data?.full_name));
  }

  // App is loading Supabase session
  if (loading || (isAuthenticated && hasProfile === null)) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6C47FF" />
      </View>
    );
  }

  // Not logged in → Login screen
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Logged in but no profile yet → Register screen
  if (!hasProfile) {
    return <RegisterScreen />;
  }

  // Fully authenticated → Main app
  return (
    <AppNavigator
      isAuthenticated={isAuthenticated}
      userRole={userRole}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <RootContent />
      </CartProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: '#0F0F14',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
