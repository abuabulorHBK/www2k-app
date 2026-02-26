import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, RefreshControl,
  SafeAreaView, StatusBar, ScrollView, Image,
} from 'react-native';
import { useApi } from '../../hooks/useApi';
import { supabase } from '../../lib/supabase';

const COLORS = {
  primary: '#6C47FF',
  bg: '#0F0F14',
  card: '#1A1A24',
  text: '#FFFFFF',
  muted: '#8B8B9E',
  border: '#2E2E3E',
  premium: '#F5A623',
  pro: '#4A90E2',
  free: '#8B8B9E',
};

const TIER_BADGE = {
  premium: { label: '⭐ Premium', color: COLORS.premium },
  pro: { label: '🔵 Pro', color: COLORS.pro },
  free: { label: '', color: 'transparent' },
};

const CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'food', name: '🍱 Food & Meals' },
  { id: 'handmade', name: '🎨 Handmade' },
];

export default function HomeScreen({ navigation }) {
  const api = useApi();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [selectedCategory]);

  async function loadCategories() {
    const { data } = await supabase.from('categories').select('*');
    setCategories(data || []);
  }

  async function loadProducts(searchQuery = '') {
    setLoading(true);
    try {
      let url = '/products';
      const params = [];
      if (selectedCategory !== 'all') params.push(`category=${selectedCategory}`);
      if (searchQuery) params.push(`search=${encodeURIComponent(searchQuery)}`);
      if (params.length) url += '?' + params.join('&');
      const data = await api.get(url);
      setProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProducts(search);
    setRefreshing(false);
  }, [search, selectedCategory]);

  function handleSearch() {
    loadProducts(search);
  }

  function renderProduct({ item }) {
    const tier = item.seller?.tier || 'free';
    const badge = TIER_BADGE[tier];

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetail', { product: item })}
        activeOpacity={0.85}
      >
        {item.images?.[0] ? (
          <Image source={{ uri: item.images[0] }} style={styles.productImage} />
        ) : (
          <View style={[styles.productImage, styles.imagePlaceholder]}>
            <Text style={{ fontSize: 32 }}>🛍️</Text>
          </View>
        )}

        <View style={styles.productInfo}>
          <View style={styles.productHeader}>
            <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
            {badge.label ? (
              <View style={[styles.badge, { borderColor: badge.color }]}>
                <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.storeName} numberOfLines={1}>
            {item.seller?.store_name}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{item.price}</Text>
            {item.preparation_time_minutes && (
              <Text style={styles.prepTime}>⏱ {item.preparation_time_minutes} min</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>UniMarket</Text>
          <Text style={styles.headerSub}>Chandigarh University</Text>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search food, handmade goods..."
          placeholderTextColor={COLORS.muted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Go</Text>
        </TouchableOpacity>
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categories}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {[{ id: 'all', name: 'All' }, ...categories].map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.catChip, selectedCategory === cat.id && styles.catChipActive]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text style={[styles.catText, selectedCategory === cat.id && styles.catTextActive]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Products grid */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.id}
          renderItem={renderProduct}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🛍️</Text>
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  headerSub: { fontSize: 12, color: COLORS.muted },
  searchRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  categories: { marginBottom: 12 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  catText: { color: COLORS.muted, fontSize: 13 },
  catTextActive: { color: '#fff', fontWeight: '600' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 12, paddingBottom: 24 },
  row: { gap: 10, marginBottom: 10 },
  productCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  productImage: {
    width: '100%',
    height: 130,
    backgroundColor: COLORS.border,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: { padding: 10 },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  badgeText: { fontSize: 9, fontWeight: '700' },
  storeName: { fontSize: 11, color: COLORS.muted, marginBottom: 6 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  prepTime: { fontSize: 10, color: COLORS.muted },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: COLORS.muted, fontSize: 16 },
});
