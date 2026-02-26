import React, { useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert, StatusBar
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const COLORS = {
  primary: '#6C47FF',
  bg: '#0F0F14',
  card: '#1A1A24',
  text: '#FFFFFF',
  muted: '#8B8B9E',
  border: '#2E2E3E',
  error: '#FF4D6D',
};

export default function LoginScreen({ navigation }) {
  const { sendOTP, verifyOTP } = useAuth();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [loading, setLoading] = useState(false);

  async function handleSendOTP() {
    if (phone.length !== 10) {
      Alert.alert('Invalid number', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    try {
      const fp = await sendOTP(phone);
      setFormattedPhone(fp);
      setStep('otp');
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP() {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      await verifyOTP(formattedPhone, otp);
      // Auth state listener in AuthContext will handle navigation
    } catch (err) {
      Alert.alert('Wrong OTP', err.message || 'Code incorrect or expired. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.logo}>UniMarket</Text>
        <Text style={styles.tagline}>Student Marketplace · Chandigarh</Text>
      </View>

      <View style={styles.card}>
        {step === 'phone' ? (
          <>
            <Text style={styles.title}>Enter your mobile number</Text>
            <Text style={styles.subtitle}>We'll send you a one-time verification code.</Text>

            <View style={styles.phoneRow}>
              <View style={styles.flagBox}>
                <Text style={styles.flagText}>🇮🇳 +91</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="10-digit number"
                placeholderTextColor={COLORS.muted}
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
                returnKeyType="done"
                onSubmitEditing={handleSendOTP}
              />
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleSendOTP}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Send OTP →</Text>
              }
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.title}>Enter the code</Text>
            <Text style={styles.subtitle}>
              Sent to +91 {phone.slice(0, 5)}·····
            </Text>

            <TextInput
              style={[styles.input, styles.otpInput]}
              placeholder="6-digit code"
              placeholderTextColor={COLORS.muted}
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleVerifyOTP}
            />

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleVerifyOTP}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Verify & Continue →</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setStep('phone'); setOtp(''); }}
              style={styles.backBtn}
            >
              <Text style={styles.backText}>← Change number</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.divider} />
        <Text style={styles.terms}>
          By continuing, you agree to our Terms of Service. Your number is used only for login.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
    marginBottom: 20,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  flagBox: {
    backgroundColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  flagText: {
    color: COLORS.text,
    fontSize: 15,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 22,
    letterSpacing: 8,
    marginBottom: 16,
  },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  backBtn: {
    alignItems: 'center',
    marginTop: 16,
  },
  backText: {
    color: COLORS.muted,
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 20,
  },
  terms: {
    fontSize: 11,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 16,
  },
});
