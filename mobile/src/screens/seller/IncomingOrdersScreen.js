import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, SafeAreaView, StatusBar, RefreshControl, Alert,
} from 'react-native';
import { useApi } from '../../hooks/useApi';

const COLORS = {
  primary: '#6C47FF',
  bg: '#0F0F14',
  card: '#1A1A24',
  text: '#FFFFFF',
  muted: '#8B8B9E',
  border: '#2E2E3E',
  pending: '#F5A623',
  confirmed: '#4A90E2',
  completed: '#00C48C',
  cancelled: '#FF4D6D',
};

const STATUS_MAP = {
  pending: { label: 'Pending', color: COLORS.pending, next: 'confirmed', btnText: 'Confirm' },
  confirmed: { label: 'Confirmed', color: COLORS.confirmed, next: 'completed', btnText: 'Mark Completed' },
  completed: { label: 'Completed', color: COLORS.completed, next: null },
  cancelled: { label: 'Cancelled', color: COLORS.cancelled, next: null },
};

export default function IncomingOrdersScreen({ navigation }) {
  const api = useApi();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    try {
      const data = await api.get('/orders/incoming');
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  async function updateStatus(orderId, newStatus) {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }

  function renderOrder({ item }) {
    const status = STATUS_MAP[item.status] || STATUS_MAP.pending;

    return (
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <View>
            <Text style={styles.buyerName}>{item.buyer?.full_name || 'Student'}</Text>
            <Text style={styles.buyerPhone}>{item.buyer?.phone}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: status.color + '20', borderColor: status.color }]}>
            <Text style={[styles.badgeTxt, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.itemsBox}>
          {item.items.map((prod, i) => (
            <Text key={i} style={styles.itemLine}>• {prod.qty}x {prod.name}</Text>
          ))}
        </View>

        <View style={styles.cardFoot}>
          <Text style={styles.total}>₹{item.total_amount}</Text>

          <View style={styles.actions}>
            {item.status === 'pending' && (
              <TouchableOpacity onPress={() => updateStatus(item.id, 'cancelled')}>
                <Text style={styles.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
            )}

            {status.next && (
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: STATUS_MAP[status.next].color }]}
                onPress={() => updateStatus(item.id, status.next)}
              >
                <Text style={styles.btnTxt}>{status.btnText}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Incoming Orders</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item.id}
          renderItem={renderOrder}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 48 }}>📥</Text>
              <Text style={styles.emptyText}>No orders yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: 16, borderBottomWidth: 1, borderColor: COLORS.border },
  title: { fontSize: 22, fontWeight: '800', color: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 16
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  buyerName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  buyerPhone: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  badge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeTxt: { fontSize: 10, fontWeight: '700' },
  itemsBox: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.border, paddingVertical: 12, marginBottom: 12 },
  itemLine: { color: COLORS.muted, fontSize: 14, marginBottom: 4 },
  cardFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  total: { color: '#fff', fontSize: 18, fontWeight: '800' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  cancelTxt: { color: COLORS.cancelled, fontWeight: '600' },
  btn: { borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  btnTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  empty: { flex: 1, alignItems: 'center', paddingTop: 100 },
  emptyText: { color: COLORS.muted, fontSize: 15, marginTop: 12 },
});
