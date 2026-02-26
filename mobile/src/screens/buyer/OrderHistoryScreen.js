import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, SafeAreaView,
  StatusBar, RefreshControl,
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
  pending: { label: 'Pending', color: COLORS.pending },
  confirmed: { label: 'Confirmed', color: COLORS.confirmed },
  completed: { label: 'Completed', color: COLORS.completed },
  cancelled: { label: 'Cancelled', color: COLORS.cancelled },
};

export default function OrderHistoryScreen({ navigation }) {
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
      const data = await api.get('/orders/me');
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

  function renderOrder({ item }) {
    const status = STATUS_MAP[item.status] || STATUS_MAP.pending;
    const date = new Date(item.created_at).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.storeName}>{item.seller?.store_name}</Text>
            <Text style={styles.orderDate}>{date}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.color + '20', borderColor: status.color }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.itemsList}>
          {item.items.map((prod, i) => (
            <Text key={i} style={styles.itemLine} numberOfLines={1}>
              {prod.qty}x {prod.name}
            </Text>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.totalLabel}>Total: <Text style={styles.totalVal}>₹{item.total_amount}</Text></Text>

          {item.status === 'completed' && (
            <TouchableOpacity
              style={styles.reviewBtn}
              onPress={() => navigation.navigate('WriteReview', { order: item })}
            >
              <Text style={styles.reviewBtnTxt}>Write Review</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Order History</Text>
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 48 }}>📦</Text>
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
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  orderCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  storeName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  orderDate: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  statusBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 10, fontWeight: '700' },
  itemsList: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.border, paddingVertical: 10, marginBottom: 10 },
  itemLine: { color: COLORS.muted, fontSize: 13, marginBottom: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: COLORS.muted, fontSize: 14 },
  totalVal: { color: COLORS.text, fontWeight: '800', fontSize: 16 },
  reviewBtn: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  reviewBtnTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', paddingTop: 100 },
  emptyText: { color: COLORS.muted, fontSize: 16, marginTop: 12 },
});
