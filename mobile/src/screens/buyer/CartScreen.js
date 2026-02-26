import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, Alert, ActivityIndicator, Linking,
} from 'react-native';
import { useCart } from '../../context/CartContext';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';

const COLORS = {
  primary: '#6C47FF',
  bg: '#0F0F14',
  card: '#1A1A24',
  text: '#FFFFFF',
  muted: '#8B8B9E',
  border: '#2E2E3E',
  danger: '#FF4D6D',
  whatsapp: '#25D366',
};

export default function CartScreen({ navigation }) {
  const { cartItems, removeFromCart, updateQty, clearCart, total } = useCart();
  const { user } = useAuth();
  const api = useApi();
  const [placing, setPlacing] = useState(false);

  // Group items by seller (WhatsApp redirect goes per-seller)
  const sellerGroups = cartItems.reduce((acc, item) => {
    const sid = item.seller?.id;
    if (!acc[sid]) acc[sid] = { seller: item.seller, items: [] };
    acc[sid].items.push(item);
    return acc;
  }, {});

  async function handleWhatsAppOrder(seller, items) {
    setPlacing(true);
    try {
      // Build pre-filled message per PRD Section 9.2
      const lines = items.map(i => `${i.name} x${i.qty} = ₹${(i.price * i.qty).toFixed(2)}`);
      const groupTotal = items.reduce((s, i) => s + i.price * i.qty, 0);
      const message = [
        `Hello! I'd like to order from ${seller.store_name}:`,
        ...lines,
        '',
        `Total: ₹${groupTotal.toFixed(2)}`,
        'Please confirm availability and pickup time.',
      ].join('\n');

      // Record order in DB before opening WhatsApp
      const orderItems = items.map(i => ({
        product_id: i.id,
        name: i.name,
        qty: i.qty,
        price: i.price,
      }));

      await api.post('/orders', {
        seller_id: seller.id,
        items: orderItems,
        total_amount: groupTotal,
        whatsapp_referred: true,
      });

      // Open WhatsApp deep link
      const url = `https://wa.me/91${seller.whatsapp_number}?text=${encodeURIComponent(message)}`;
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert('WhatsApp not found', 'Please install WhatsApp to place this order.');
        return;
      }
      await Linking.openURL(url);

    } catch (err) {
      Alert.alert('Error', err.message || 'Could not place order. Try again.');
    } finally {
      setPlacing(false);
    }
  }

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.browseBtnTxt}>Browse Products →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cart</Text>
        <TouchableOpacity onPress={clearCart}>
          <Text style={styles.clearTxt}>Clear all</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={cartItems}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemStore}>{item.seller?.store_name}</Text>
              <Text style={styles.itemPrice}>₹{item.price} each</Text>
            </View>
            <View style={styles.itemControls}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => updateQty(item.id, item.qty - 1)}
              >
                <Text style={styles.qtyBtnTxt}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{item.qty}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => updateQty(item.id, item.qty + 1)}
              >
                <Text style={styles.qtyBtnTxt}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.lineTotal}>₹{(item.price * item.qty).toFixed(2)}</Text>
          </View>
        )}
        ListFooterComponent={() => (
          <View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
            </View>

            <Text style={styles.sectionTitle}>Order via WhatsApp</Text>
            {Object.values(sellerGroups).map(group => (
              <TouchableOpacity
                key={group.seller.id}
                style={styles.waBtn}
                onPress={() => handleWhatsAppOrder(group.seller, group.items)}
                disabled={placing}
              >
                {placing
                  ? <ActivityIndicator color="#fff" />
                  : (
                    <>
                      <Text style={styles.waBtnIcon}>💬</Text>
                      <Text style={styles.waBtnTxt}>
                        Order from {group.seller.store_name}
                      </Text>
                    </>
                  )
                }
              </TouchableOpacity>
            ))}

            <Text style={styles.waNote}>
              Payment is cash or personal UPI directly with the seller after confirming on WhatsApp.
            </Text>
          </View>
        )}
      />
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  clearTxt: { color: COLORS.danger, fontSize: 14 },
  list: { padding: 16, gap: 12 },
  cartItem: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  itemInfo: { flex: 1 },
  itemName: { color: COLORS.text, fontWeight: '700', fontSize: 14 },
  itemStore: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  itemPrice: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  itemControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: {
    backgroundColor: COLORS.bg,
    borderRadius: 6,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qtyBtnTxt: { color: COLORS.text, fontSize: 18 },
  qtyValue: { color: COLORS.text, fontWeight: '700', fontSize: 16, minWidth: 20, textAlign: 'center' },
  lineTotal: { color: COLORS.primary, fontWeight: '800', fontSize: 15, minWidth: 60, textAlign: 'right' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    marginTop: 4,
  },
  totalLabel: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  totalValue: { color: COLORS.primary, fontSize: 22, fontWeight: '800' },
  sectionTitle: { color: COLORS.muted, fontSize: 12, fontWeight: '600', marginBottom: 10, marginTop: 4 },
  waBtn: {
    backgroundColor: COLORS.whatsapp,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  waBtnIcon: { fontSize: 20 },
  waBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
  waNote: {
    color: COLORS.muted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 4,
    marginBottom: 24,
  },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyEmoji: { fontSize: 64 },
  emptyText: { color: COLORS.muted, fontSize: 18 },
  browseBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginTop: 8,
  },
  browseBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
