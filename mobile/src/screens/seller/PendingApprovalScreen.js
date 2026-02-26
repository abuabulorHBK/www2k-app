import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const COLORS = {
  primary: '#6C47FF',
  bg: '#0F0F14',
  card: '#1A1A24',
  text: '#FFFFFF',
  muted: '#8B8B9E',
  border: '#2E2E3E',
};

export default function PendingApprovalScreen({ navigation }) {
  const { signOut } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.body}>
        <Text style={styles.emoji}>⏳</Text>
        <Text style={styles.title}>Application Pending</Text>
        <Text style={styles.sub}>
          Our team is verifying your student credentials. You'll get more powers once approved!
        </Text>

        <View style={styles.box}>
          <Text style={styles.boxHeader}>Next Steps:</Text>
          <Text style={styles.step}>• IDs are checked every 24-48 hours.</Text>
          <Text style={styles.step}>• You can still use UniMarket as a buyer.</Text>
          <Text style={styles.step}>• We'll notify you via WhatsApp once approved.</Text>
        </View>

        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.navigate('BuyerTabs')}
        >
          <Text style={styles.btnTxt}>Back to Shopping</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={signOut}>
          <Text style={styles.logout}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  body: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emoji: { fontSize: 80, marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', textAlign: 'center' },
  sub: { fontSize: 16, color: COLORS.muted, textAlign: 'center', marginTop: 12, lineHeight: 24 },
  box: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 20,
    width: '100%', marginVertical: 32, borderWidth: 1, borderColor: COLORS.border
  },
  boxHeader: { color: '#fff', fontWeight: '700', marginBottom: 12 },
  step: { color: COLORS.muted, fontSize: 14, marginBottom: 8 },
  btn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 16, width: '100%', alignItems: 'center', marginBottom: 20
  },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  logout: { color: COLORS.muted, fontSize: 14 },
});
