import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, Image, ActivityIndicator,
} from 'react-native';
import { useApi } from '../../hooks/useApi';

const COLORS = {
  primary: '#6C47FF',
  bg: '#0F0F14',
  card: '#1A1A24',
  text: '#FFFFFF',
  muted: '#8B8B9E',
  border: '#2E2E3E',
};

export default function SearchScreen({ navigation }) {
  const api = useApi();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch(q) {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const data = await api.get(`/products?search=${encodeURIComponent(q)}`);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function renderResult({ item }) {
    return (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => navigation.navigate('ProductDetail', { product: item })}
      >
        <Image
          source={{ uri: item.images?.[0] || 'https://via.placeholder.com/150' }}
          style={styles.img}
        />
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.store}>{item.seller?.store_name}</Text>
          <Text style={styles.price}>₹{item.price}</Text>
        </View>
        <Text style={styles.arrow}>→</Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="Search products or stores..."
          placeholderTextColor={COLORS.muted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => handleSearch(query)}
          autoFocus
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
            <Text style={styles.clear}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          renderItem={renderResult}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            query && !loading ? (
              <View style={styles.center}>
                <Text style={styles.emptyText}>No results for "{query}"</Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clear: { color: COLORS.primary, fontWeight: '600' },
  list: { padding: 16 },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  img: { width: 60, height: 60, borderRadius: 8, backgroundColor: COLORS.border },
  info: { flex: 1, marginLeft: 12 },
  name: { color: '#fff', fontWeight: '700', fontSize: 15 },
  store: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  price: { color: COLORS.primary, fontWeight: '800', fontSize: 16, marginTop: 4 },
  arrow: { color: COLORS.border, fontSize: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { color: COLORS.muted, fontSize: 16 },
});
