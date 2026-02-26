import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator, SafeAreaView, StatusBar, Alert,
} from 'react-native';
import { useApi } from '../../hooks/useApi';

const COLORS = {
  primary: '#6C47FF',
  bg: '#0F0F14',
  card: '#1A1A24',
  text: '#FFFFFF',
  muted: '#8B8B9E',
  border: '#2E2E3E',
  danger: '#FF4D6D',
};

export default function MyProductsScreen({ navigation }) {
  const api = useApi();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = navigation.addListener('focus', fetchMyProducts);
    return unsub;
  }, [navigation]);

  async function fetchMyProducts() {
    setLoading(true);
    try {
      // Endpoint handled in products.js if seller_id filtered or using specialized profile route
      // For now we get seller/me which includes products
      const data = await api.get('/sellers/me');
      setProducts(data.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    Alert.alert('Delete Product', 'Remove this item permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.del(`/products/${id}`);
            setProducts(prev => prev.filter(p => p.id !== id));
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        }
      }
    ]);
  }

  function renderProduct({ item }) {
    return (
      <View style={styles.card}>
        <Image
          source={{ uri: item.images?.[0] || 'https://via.placeholder.com/150' }}
          style={styles.img}
        />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.price}>₹{item.price}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('AddProduct', { product: item })}
          >
            <Text style={styles.editTxt}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.delBtn}
            onPress={() => handleDelete(item.id)}
          >
            <Text style={styles.delTxt}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>My Products</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddProduct')}
        >
          <Text style={styles.addBtnTxt}>+ Add New</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.id}
          renderItem={renderProduct}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 48 }}>📦</Text>
              <Text style={styles.emptyText}>You haven't listed anything yet.</Text>
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderColor: COLORS.border
  },
  title: { fontSize: 22, fontWeight: '800', color: '#fff' },
  addBtn: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  addBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card,
    borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border,
  },
  img: { width: 50, height: 50, borderRadius: 6, backgroundColor: COLORS.border },
  info: { flex: 1, marginLeft: 12 },
  name: { color: '#fff', fontWeight: '700', fontSize: 15 },
  price: { color: COLORS.primary, fontWeight: '800', fontSize: 14, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  editBtn: { backgroundColor: COLORS.border, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  editTxt: { color: '#fff', fontSize: 12, fontWeight: '600' },
  delBtn: { backgroundColor: COLORS.danger + '20', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.danger },
  delTxt: { fontSize: 14 },
  empty: { flex: 1, alignItems: 'center', paddingTop: 100 },
  emptyText: { color: COLORS.muted, fontSize: 15, marginTop: 12 },
});
