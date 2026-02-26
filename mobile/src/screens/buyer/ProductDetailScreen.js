import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  StyleSheet, Dimensions, SafeAreaView, Alert, StatusBar,
} from 'react-native';
import { useCart } from '../../context/CartContext';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#6C47FF',
  bg: '#0F0F14',
  card: '#1A1A24',
  text: '#FFFFFF',
  muted: '#8B8B9E',
  border: '#2E2E3E',
  premium: '#F5A623',
  pro: '#4A90E2',
  success: '#00C48C',
};

const TIER_BADGE = {
  premium: { label: '⭐ Premium', color: COLORS.premium },
  pro: { label: '🔵 Pro', color: COLORS.pro },
  free: { label: null, color: null },
};

export default function ProductDetailScreen({ route, navigation }) {
  const { product } = route.params;
  const { addToCart, cartItems } = useCart();
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  const tier = product.seller?.tier || 'free';
  const badge = TIER_BADGE[tier];

  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

  function handleAddToCart() {
    addToCart({ ...product, qty });
    Alert.alert('Added to cart ✅', `${qty}x ${product.name} added.`);
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Back + Cart header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backTxt}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('Cart')}
          style={styles.cartBtn}
        >
          <Text style={styles.cartTxt}>🛒 {cartCount}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image carousel */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={e => {
            setActiveImg(Math.round(e.nativeEvent.contentOffset.x / width));
          }}
        >
          {product.images?.length ? product.images.map((img, i) => (
            <Image key={i} source={{ uri: img }} style={styles.image} />
          )) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Text style={{ fontSize: 64 }}>🛍️</Text>
            </View>
          )}
        </ScrollView>

        {/* Dot indicators */}
        {product.images?.length > 1 && (
          <View style={styles.dots}>
            {product.images.map((_, i) => (
              <View key={i} style={[styles.dot, i === activeImg && styles.dotActive]} />
            ))}
          </View>
        )}

        <View style={styles.body}>
          {/* Tier badge + name */}
          {badge.label && (
            <View style={[styles.badge, { borderColor: badge.color }]}>
              <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
            </View>
          )}

          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>₹{product.price}</Text>

          {product.preparation_time_minutes && (
            <Text style={styles.prepTime}>
              ⏱ Ready in {product.preparation_time_minutes} minutes
            </Text>
          )}

          {product.description && (
            <Text style={styles.description}>{product.description}</Text>
          )}

          {/* Seller info */}
          <TouchableOpacity
            style={styles.sellerCard}
            onPress={() => navigation.navigate('SellerProfile', { sellerId: product.seller?.id })}
          >
            <View>
              <Text style={styles.sellerName}>{product.seller?.store_name}</Text>
              <Text style={styles.sellerSub}>Tap to view full store →</Text>
            </View>
            <View style={styles.sellerTier}>
              <Text style={{ color: badge.color || COLORS.muted, fontSize: 12, fontWeight: '700' }}>
                {badge.label || 'Free'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Quantity selector */}
          <View style={styles.qtyRow}>
            <Text style={styles.qtyLabel}>Quantity</Text>
            <View style={styles.qtyControls}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQty(q => Math.max(1, q - 1))}
              >
                <Text style={styles.qtyBtnTxt}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{qty}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQty(q => q + 1)}
              >
                <Text style={styles.qtyBtnTxt}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.subtotal}>
            Subtotal: ₹{(product.price * qty).toFixed(2)}
          </Text>
        </View>
      </ScrollView>

      {/* Add to cart CTA */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.addBtn} onPress={handleAddToCart} activeOpacity={0.85}>
          <Text style={styles.addBtnTxt}>Add to Cart — ₹{(product.price * qty).toFixed(2)}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: { padding: 8 },
  backTxt: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
  cartBtn: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cartTxt: { color: COLORS.text, fontWeight: '700' },
  image: { width, height: 280, resizeMode: 'cover' },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.card },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.border },
  dotActive: { backgroundColor: COLORS.primary },
  body: { padding: 20 },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  name: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  price: { fontSize: 28, fontWeight: '800', color: COLORS.primary, marginBottom: 6 },
  prepTime: { fontSize: 13, color: COLORS.muted, marginBottom: 12 },
  description: {
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 22,
    marginBottom: 20,
  },
  sellerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  sellerName: { color: COLORS.text, fontWeight: '700', fontSize: 15 },
  sellerSub: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  sellerTier: {},
  qtyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  qtyLabel: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  qtyBtn: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qtyBtnTxt: { color: COLORS.text, fontSize: 20, fontWeight: '600' },
  qtyValue: { color: COLORS.text, fontSize: 20, fontWeight: '800', minWidth: 24, textAlign: 'center' },
  subtotal: { color: COLORS.muted, fontSize: 14, marginTop: 4 },
  footer: { padding: 16, borderTopWidth: 1, borderColor: COLORS.border },
  addBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  addBtnTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
