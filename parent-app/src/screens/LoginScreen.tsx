import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { AcademicIcon } from '../components/Icons';

export const LoginScreen = () => {
  const [username, setUsername] = useState('parent_murugan');
  const [password, setPassword] = useState('parent123');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Required Fields', 'Please enter your username and password.');
      return;
    }
    setSubmitting(true);
    const result = await login(username, password);
    setSubmitting(false);

    if (!result.success) {
      Alert.alert('Login Failed', result.error || 'Invalid credentials');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerBox}>
            <View style={styles.logoBadge}>
              <AcademicIcon size={32} color="#FFFFFF" strokeWidth={2} />
            </View>
            <Text style={styles.appName}>AADHITHYA</Text>
            <Text style={styles.appSub}>INTERNATIONAL PUBLIC SCHOOL</Text>
            <View style={styles.roleTag}>
              <Text style={styles.roleTagText}>PARENT MOBILE PORTAL</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Parent Portal Sign In</Text>
            <Text style={styles.cardSub}>Sign in to view student attendance, fees & academic reports</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Parent Username</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="e.g. parent_murugan"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#94a3b8"
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.button, submitting && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Sign In to Parent Portal</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoBox}
              onPress={() => {
                setUsername('parent_murugan');
                setPassword('parent123');
              }}
            >
              <Text style={styles.demoTitle}>Quick Fill Parent Demo Account</Text>
              <Text style={styles.demoText}>Username: parent_murugan | Password: parent123</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerText}>Aadhithya ERP Parent Mobile App v1.0</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoBadgeText: {
    fontSize: 32,
  },
  appName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 1,
  },
  appSub: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6366f1',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  roleTag: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#e0e7ff',
    borderRadius: 8,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4338ca',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  cardSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  button: {
    backgroundColor: '#4f46e5',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  demoBox: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4f46e5',
  },
  demoText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 32,
  },
});
