import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, SafeAreaView, StatusBar, RefreshControl,
} from 'react-native';
import { useApi } from '../../hooks/useApi';

const COLORS = {
  primary: '#6C47FF',
  bg: '#0F0F14',
  card: '#1A1A24',
  text: '#FFFFFF',
  muted: '#8B8B9E',
  border: '#2E2E3E',
  premium: '#F5A623',
};

export default function SellerDashboardScreen({ navigation }) {
  const api = useApi();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);
    try {
      const data = await api.get('/sellers/me');
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Seller Dashboard</Text>
          <View style={styles.tierBadge}>
            <Text style={styles.tierText}>{stats?.tier?.toUpperCase()} PLAN</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Products</Text>
            <Text style={styles.statValue}>{stats?.product_count}</Text>
            <Text style={styles.statLimit}>Limit: {stats?.tier_limit === 999 ? '∞' : stats?.tier_limit}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Active Orders</Text>
            <Text style={[styles.statValue, { color: COLORS.primary }]}>0</Text>
            <Text style={styles.statLimit}>Check incoming</Text>
          </View>
        </View>

        <View style={styles.menu}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Products')}
          >
            <Text style={styles.menuIcon}>📦</Text>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Manage Products</Text>
              <Text style={styles.menuSub}>Add, Edit, or Remove items</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Orders')}
          >
            <Text style={styles.menuIcon}>🛒</Text>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Incoming Orders</Text>
              <Text style={styles.menuSub}>Update statuses for customers</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>

          {stats?.tier === 'free' && (
            <TouchableOpacity
              style={[styles.menuItem, styles.premiumItem]}
              onPress={() => navigation.navigate('UpgradePlan')}
            >
              <Text style={styles.menuIcon}>🚀</Text>
              <View style={styles.menuInfo}>
                <Text style={[styles.menuTitle, { color: COLORS.premium }]}>Upgrade to Premium</Text>
                <Text style={styles.menuSub}>Get 50+ products & boost visibility</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Ghost store suppression active.</Text>
          <Text style={styles.footerSub}>Login daily to keep products visible.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  body: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },
  tierBadge: { backgroundColor: COLORS.border, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  tierText: { color: COLORS.premium, fontSize: 10, fontWeight: '900' },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  statLabel: { color: COLORS.muted, fontSize: 12, fontWeight: '600' },
  statValue: { color: '#fff', fontSize: 24, fontWeight: '800', marginVertical: 4 },
  statLimit: { color: COLORS.muted, fontSize: 10 },
  menu: { gap: 12 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card,
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border
  },
  premiumItem: { borderColor: COLORS.premium + '40' },
  menuIcon: { fontSize: 24, marginRight: 16 },
  menuInfo: { flex: 1 },
  menuTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  menuSub: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  arrow: { color: COLORS.border, fontSize: 20 },
  footer: { marginTop: 40, alignItems: 'center' },
  footerText: { color: COLORS.muted, fontSize: 12, fontWeight: '700' },
  footerSub: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
});
