import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, SafeAreaView, StatusBar, ScrollView, Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const COLORS = {
  primary: '#6C47FF',
  bg: '#0F0F14',
  card: '#1A1A24',
  text: '#FFFFFF',
  muted: '#8B8B9E',
  border: '#2E2E3E',
  danger: '#FF4D6D',
  premium: '#F5A623',
};

export default function ProfileScreen({ navigation }) {
  const { user, userRole, signOut } = useAuth();

  function handleLogout() {
    Alert.alert(
      'Logout',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: signOut }
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.email?.[0]?.toUpperCase() || 'U'}</Text>
          </View>
          <Text style={styles.userName}>{user?.user_metadata?.full_name || 'UniMarket User'}</Text>
          <Text style={styles.userPhone}>{user?.phone}</Text>

          <View style={[styles.roleBadge, userRole === 'seller' && { borderColor: COLORS.premium }]}>
            <Text style={[styles.roleText, userRole === 'seller' && { color: COLORS.premium }]}>
              {userRole === 'seller' ? '👑 Seller Account' : '👤 Student Buyer'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('OrderHistory')}>
            <Text style={styles.menuIcon}>📦</Text>
            <Text style={styles.menuLabel}>My Orders</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          {userRole === 'buyer' && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('SellerRegister')}
            >
              <Text style={styles.menuIcon}>🏪</Text>
              <Text style={styles.menuLabel}>Become a Seller</Text>
              <Text style={styles.activeLabel}>Start Earning</Text>
            </TouchableOpacity>
          )}

          {userRole === 'seller' && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('SellerDashboard')}
            >
              <Text style={styles.menuIcon}>📊</Text>
              <Text style={styles.menuLabel}>Seller Dashboard</Text>
              <Text style={styles.menuArrow}>→</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>🔔</Text>
            <Text style={styles.menuLabel}>Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>🛡️</Text>
            <Text style={styles.menuLabel}>Privacy & Safety</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutTxt}>Logout</Text>
          </TouchableOpacity>
          <Text style={styles.version}>UniMarket v2.2.0 (Build 2026.02)</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { alignItems: 'center', padding: 32, borderBottomWidth: 1, borderColor: COLORS.border },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: { fontSize: 32, color: '#fff', fontWeight: '800' },
  userName: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  userPhone: { fontSize: 14, color: COLORS.muted, marginTop: 4 },
  roleBadge: {
    marginTop: 12, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4
  },
  roleText: { fontSize: 12, fontWeight: '700', color: COLORS.muted },
  section: { padding: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    borderBottomWidth: 1, borderColor: COLORS.border + '40'
  },
  menuIcon: { fontSize: 18, marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 15, color: COLORS.text, fontWeight: '500' },
  menuArrow: { color: COLORS.muted, fontSize: 16 },
  activeLabel: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
  footer: { padding: 32, alignItems: 'center' },
  logoutBtn: {
    width: '100%', backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.danger,
    borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 16,
  },
  logoutTxt: { color: COLORS.danger, fontWeight: '700', fontSize: 15 },
  version: { color: COLORS.muted, fontSize: 11 },
});
