import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, SafeAreaView, StatusBar, Alert, ActivityIndicator,
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

export default function SellerRegisterScreen({ navigation }) {
  const api = useApi();
  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!storeName || !whatsapp) {
      Alert.alert('Required', 'Store Name and WhatsApp number are required.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/sellers/register', {
        store_name: storeName.trim(),
        description: description.trim(),
        whatsapp_number: whatsapp.replace(/\D/g, ''),
      });
      // Navigation to Pending Screen
      navigation.replace('PendingApproval');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Become a Seller</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.intro}>
          <Text style={styles.emoji}>🏪</Text>
          <Text style={styles.introTitle}>Launch your student business</Text>
          <Text style={styles.introSub}>
            Reach 10,000+ students on campus. Get paid directly via cash or UPI.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Store Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Rahul's Tiffin, Handmade Charms"
            placeholderTextColor={COLORS.muted}
            value={storeName}
            onChangeText={setStoreName}
          />

          <Text style={styles.label}>What do you sell?</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell us about your products..."
            placeholderTextColor={COLORS.muted}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
          />

          <Text style={styles.label}>WhatsApp Number (10 digits)</Text>
          <View style={styles.phoneRow}>
            <View style={styles.country}>
              <Text style={{ color: '#fff' }}>+91</Text>
            </View>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Number for orders"
              placeholderTextColor={COLORS.muted}
              keyboardType="phone-pad"
              maxLength={10}
              value={whatsapp}
              onChangeText={setWhatsapp}
            />
          </View>

          <Text style={styles.note}>
            * Administrators will verify your student ID before approval.
          </Text>

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.6 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Apply Now →</Text>}
          </TouchableOpacity>
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
  back: { color: COLORS.primary, fontSize: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  body: { padding: 24 },
  intro: { alignItems: 'center', marginBottom: 32 },
  emoji: { fontSize: 64, marginBottom: 16 },
  introTitle: { fontSize: 24, fontWeight: '800', color: '#fff', textAlign: 'center' },
  introSub: { fontSize: 14, color: COLORS.muted, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  form: { marginTop: 8 },
  label: { color: COLORS.text, fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 14,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  textArea: { minHeight: 100 },
  phoneRow: { flexDirection: 'row', gap: 10 },
  country: {
    backgroundColor: COLORS.border, borderRadius: 10,
    justifyContent: 'center', paddingHorizontal: 12, height: 50
  },
  note: { color: COLORS.muted, fontSize: 12, marginBottom: 24, fontStyle: 'italic' },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
