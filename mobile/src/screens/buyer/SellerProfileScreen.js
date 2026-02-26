import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, ActivityIndicator, SafeAreaView,
  StatusBar,
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
  pro: '#4A90E2',
};

const TIER_BADGE = {
  premium: { label: '⭐ Premium', color: COLORS.premium },
  pro: { label: '🔵 Pro', color: COLORS.pro },
  free: { label: null, color: null },
};

export default function SellerProfileScreen({ route, navigation }) {
  const { sellerId } = route.params;
  const api = useApi();
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSellerProfile();
  }, [sellerId]);

  async function fetchSellerProfile() {
    setLoading(true);
    try {
      const data = await api.get(`/sellers/${sellerId}`);
      setSeller(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (!seller) {
    return (
      <View style={styles.center}>
        <Text style={{ color: COLORS.muted }}>Seller not found</Text>
      </View>
    );
  }

  const badge = TIER_BADGE[seller.tier || 'free'];

  const renderProduct = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetail', { product: { ...item, seller } })}
    >
      <Image
        source={{ uri: item.images?.[0] || 'https://via.placeholder.com/150' }}
        style={styles.productImage}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.productPrice}>₹{item.price}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backTxt}>← Back</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={seller.products}
        keyExtractor={item => item.id}
        renderItem={renderProduct}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.profileHeader}>
            <View style={styles.storeRow}>
              <Text style={styles.storeName}>{seller.store_name}</Text>
              {badge.label && (
                <View style={[styles.badge, { borderColor: badge.color }]}>
                  <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                </View>
              )}
            </View>
            <Text style={styles.bio}>{seller.description || 'No description provided.'}</Text>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statVal}>{seller.avg_rating?.toFixed(1) || '—'}</Text>
                <Text style={styles.statLab}>Rating</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.stat}>
                <Text style={styles.statVal}>{seller.review_count}</Text>
                <Text style={styles.statLab}>Reviews</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.stat}>
                <Text style={styles.statVal}>{seller.products?.length}</Text>
                <Text style={styles.statLab}>Products</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Products</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 16, paddingVertical: 10 },
  backBtn: { padding: 4 },
  backTxt: { color: COLORS.primary, fontSize: 16, fontWeight: '600' },
  profileHeader: { padding: 20 },
  storeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  storeName: { fontSize: 26, fontWeight: '800', color: COLORS.text },
  badge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  bio: { fontSize: 14, color: COLORS.muted, lineHeight: 22, marginBottom: 20 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 24,
  },
  stat: { alignItems: 'center' },
  statVal: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  statLab: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  divider: { width: 1, height: 24, backgroundColor: COLORS.border },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  row: { gap: 12, marginBottom: 12 },
  productCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  productImage: { width: '100%', height: 120, backgroundColor: COLORS.border },
  productInfo: { padding: 8 },
  productName: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  productPrice: { color: COLORS.primary, fontSize: 14, fontWeight: '700', marginTop: 2 },
});
