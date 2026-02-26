import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Image, ActivityIndicator, SafeAreaView,
  StatusBar, Alert,
} from 'react-native';
import { useApi } from '../../hooks/useApi';
import { supabase } from '../../lib/supabase';
import { pickAndCompressImage, uploadImage } from '../../utils/imageUtils';

const COLORS = {
  primary: '#6C47FF',
  bg: '#0F0F14',
  card: '#1A1A24',
  text: '#FFFFFF',
  muted: '#8B8B9E',
  border: '#2E2E3E',
};

export default function AddProductScreen({ route, navigation }) {
  const api = useApi();
  const editingProduct = route.params?.product;

  const [name, setName] = useState(editingProduct?.name || '');
  const [description, setDescription] = useState(editingProduct?.description || '');
  const [price, setPrice] = useState(editingProduct?.price?.toString() || '');
  const [prepTime, setPrepTime] = useState(editingProduct?.preparation_time_minutes?.toString() || '');
  const [category, setCategory] = useState(editingProduct?.category_id || '');
  const [imageUri, setImageUri] = useState(editingProduct?.images?.[0] || null);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    try {
      const { data } = await supabase.from('categories').select('*');
      setCategories(data || []);
      if (!category && data?.length) setCategory(data[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePickImage() {
    try {
      const result = await pickAndCompressImage();
      if (result) setImageUri(result.uri);
    } catch (err) {
      Alert.alert('Permission Denied', err.message);
    }
  }

  async function handleSave() {
    if (!name || !price || !category) {
      Alert.alert('Required', 'Please fill name, price and category.');
      return;
    }

    setSaving(true);
    try {
      let finalImageUrl = imageUri;

      // If new image picked (local uri), upload it
      if (imageUri && !imageUri.startsWith('http')) {
        const { data: { user } } = await supabase.auth.getUser();
        const fileName = `${Date.now()}.jpg`;
        const path = `${user.id}/${fileName}`;
        finalImageUrl = await uploadImage(supabase, imageUri, 'product-images', path);
      }

      const payload = {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category_id: category,
        images: finalImageUrl ? [finalImageUrl] : [],
        preparation_time_minutes: prepTime ? parseInt(prepTime) : null,
      };

      if (editingProduct) {
        await api.patch(`/products/${editingProduct.id}`, payload);
      } else {
        await api.post('/products', payload);
      }

      Alert.alert('Success', `Product ${editingProduct ? 'updated' : 'listed'}!`);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{editingProduct ? 'Edit Product' : 'Add Product'}</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color={COLORS.primary} /> : <Text style={styles.save}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <TouchableOpacity style={styles.imageBox} onPress={handlePickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={{ fontSize: 40 }}>📸</Text>
              <Text style={styles.imageHint}>Add Product Photo</Text>
              <Text style={styles.imageSub}>Compressed to 800px (MOD 4)</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.form}>
          <Text style={styles.label}>Product Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Chicken Biryani, Blue Tote Bag"
            placeholderTextColor={COLORS.muted}
            value={name}
            onChangeText={setName}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Price (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={COLORS.muted}
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Prep Time (min)</Text>
              <TextInput
                style={styles.input}
                placeholder="10"
                placeholderTextColor={COLORS.muted}
                keyboardType="numeric"
                value={prepTime}
                onChangeText={setPrepTime}
              />
            </View>
          </View>

          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cats}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catBtn, category === cat.id && styles.catBtnActive]}
                onPress={() => setCategory(cat.id)}
              >
                <Text style={[styles.catTxt, category === cat.id && styles.catTxtActive]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell buyers more about it..."
            placeholderTextColor={COLORS.muted}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderColor: COLORS.border
  },
  cancel: { color: COLORS.muted, fontSize: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  save: { color: COLORS.primary, fontSize: 16, fontWeight: '700' },
  body: { padding: 20 },
  imageBox: {
    width: '100%', height: 200, backgroundColor: COLORS.card,
    borderRadius: 16, borderStyle: 'dashed', borderWidth: 2,
    borderColor: COLORS.border, overflow: 'hidden', marginBottom: 24
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imageHint: { color: '#fff', fontWeight: '700', marginTop: 10 },
  imageSub: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
  form: { gap: 4 },
  label: { color: COLORS.text, fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: COLORS.card, borderRadius: 10, padding: 14,
    color: '#fff', fontSize: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20,
  },
  row: { flexDirection: 'row', gap: 16 },
  cats: { flexDirection: 'row', marginBottom: 20 },
  catBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, marginRight: 8 },
  catBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catTxt: { color: COLORS.muted, fontSize: 13 },
  catTxtActive: { color: '#fff', fontWeight: '700' },
  textArea: { minHeight: 100 },
});
