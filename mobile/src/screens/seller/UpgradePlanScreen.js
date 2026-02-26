import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, SafeAreaView, StatusBar, Alert,
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
  premium: '#F5A623',
  pro: '#4A90E2',
};

const PLAN_DATA = [
  {
    tier: 'pro',
    name: 'Pro Student',
    price: '99',
    limit: 50,
    features: ['Up to 50 products', 'Blue badge', 'Priority search ranking'],
    color: COLORS.pro,
  },
  {
    tier: 'premium',
    name: 'Premium Student',
    price: '199',
    limit: 'Unlimited',
    features: ['Unlimited products', 'Gold badge', 'Top search ranking', 'Verified Storefront'],
    color: COLORS.premium,
  },
];

export default function UpgradePlanScreen({ navigation }) {
  const api = useApi();
  const [selectedTier, setSelectedTier] = useState(null);
  const [screenshotUri, setScreenshotUri] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function handlePickScreenshot() {
    try {
      const result = await pickAndCompressImage();
      if (result) setScreenshotUri(result.uri);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }

  async function handleSubmitRequest() {
    if (!selectedTier || !screenshotUri) {
      Alert.alert('Required', 'Please select a plan and upload your payment screenshot.');
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const fileName = `screenshot-${Date.now()}.jpg`;
      const path = `${user.id}/${fileName}`;

      const screenshotUrl = await uploadImage(supabase, screenshotUri, 'payment-screenshots', path);

      await api.post('/subscriptions/request', {
        new_tier: selectedTier,
        upi_screenshot: screenshotUrl,
      });

      Alert.alert(
        'Request Sent',
        'Admin will verify your payment within 12-24 hours. Your tier will update automatically.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Upgrade Plan</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.sectionTitle}>Select a Plan</Text>
        <View style={styles.plans}>
          {PLAN_DATA.map(plan => (
            <TouchableOpacity
              key={plan.tier}
              style={[
                styles.planCard,
                { borderLeftColor: plan.color },
                selectedTier === plan.tier && { borderColor: plan.color, backgroundColor: plan.color + '10' }
              ]}
              onPress={() => setSelectedTier(plan.tier)}
            >
              <View style={styles.planInfo}>
                <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
                <Text style={styles.planPrice}>₹{plan.price}<Text style={styles.perMonth}>/month</Text></Text>
                {plan.features.map((f, i) => (
                  <Text key={i} style={styles.feat}>• {f}</Text>
                ))}
              </View>
              <View style={styles.radio}>
                <View style={[styles.radioDot, selectedTier === plan.tier && { backgroundColor: plan.color }]} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Payment</Text>
        <View style={styles.paymentBox}>
          <Text style={styles.payText}>1. Send ₹{selectedTier ? PLAN_DATA.find(p => p.tier === selectedTier).price : '0'} to UPI ID:</Text>
          <Text style={styles.upiId}>unimarket@upi</Text>
          <Text style={styles.payText}>2. Take a screenshot of the successful transaction.</Text>
          <Text style={styles.payText}>3. Upload it below.</Text>
        </View>

        <TouchableOpacity style={styles.uploadBox} onPress={handlePickScreenshot}>
          {screenshotUri ? (
            <Image source={{ uri: screenshotUri }} style={styles.screenshot} />
          ) : (
            <View style={styles.uploadInner}>
              <Text style={{ fontSize: 32 }}>📸</Text>
              <Text style={styles.uploadTxt}>Upload Payment Screenshot</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitBtn, (!selectedTier || !screenshotUri || uploading) && { opacity: 0.6 }]}
          disabled={!selectedTier || !screenshotUri || uploading}
          onPress={handleSubmitRequest}
        >
          {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitTxt}>Submit Request</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: COLORS.border },
  back: { color: COLORS.primary, fontSize: 16, width: 60 },
  title: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 18, fontWeight: '700', paddingRight: 60 },
  body: { padding: 20 },
  sectionTitle: { color: COLORS.muted, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  plans: { gap: 12 },
  planCard: {
    flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: COLORS.border, borderLeftWidth: 5
  },
  planInfo: { flex: 1 },
  planName: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  planPrice: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 12 },
  perMonth: { fontSize: 14, color: COLORS.muted, fontWeight: '400' },
  feat: { color: COLORS.muted, fontSize: 13, marginBottom: 4 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', marginLeft: 12, marginTop: 4 },
  radioDot: { width: 12, height: 12, borderRadius: 6 },
  paymentBox: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  payText: { color: COLORS.muted, fontSize: 14, marginBottom: 8 },
  upiId: { color: COLORS.primary, fontSize: 18, fontWeight: '800', textAlign: 'center', marginVertical: 8, letterSpacing: 1 },
  uploadBox: { borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: COLORS.border, height: 150, overflow: 'hidden', marginBottom: 24 },
  uploadInner: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  uploadTxt: { color: COLORS.muted, fontWeight: '600', marginTop: 8 },
  screenshot: { width: '100%', height: '100%', resizeMode: 'contain' },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginBottom: 40 },
  submitTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
