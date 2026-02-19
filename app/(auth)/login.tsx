import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, TextInput, ActivityIndicator, Image } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Camera } from 'lucide-react-native';

export default function LoginScreen() {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithPin } = useAuth();

  const handlePinLogin = async () => {
    if (!pin) {
      Alert.alert('Error', 'Please enter your PIN');
      return;
    }

    if (pin.length < 4) {
      Alert.alert('Error', 'PIN must be at least 4 digits');
      return;
    }

    setLoading(true);
    try {
      console.log('[Login] Signing in with PIN...');
      await signInWithPin(pin);
      console.log('[Login] Sign in successful, navigating to app...');
      router.replace('/(app)/(tabs)');
    } catch (err: any) {
      console.error('[Login] PIN login error:', err);
      Alert.alert('Sign In Failed', err?.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <Image
          source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/60eafemly2ffii9cjjth7' }}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>School Picture Day</Text>
        <Text style={styles.subtitle}>A Database Management Solution</Text>
      </View>

      <View style={styles.pinInputContainer}>
        <Text style={styles.label}>Your PIN (4+ digits)</Text>
        <TextInput
          style={styles.pinInput}
          placeholder="••••"
          value={pin}
          onChangeText={setPin}
          keyboardType="number-pad"
          secureTextEntry
          editable={!loading}
          maxLength={8}
        />
      </View>

      <Pressable
        style={[styles.loginButton, loading && styles.buttonDisabled]}
        onPress={handlePinLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.loginButtonText}>Sign In</Text>
        )}
      </Pressable>

      <View style={styles.infoBox}>
        <Camera size={20} color="#0066cc" />
        <Text style={styles.infoText}>Use any PIN you create. Same PIN always logs you back in.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: -60,
  },
  logo: {
    width: 264,
    height: 88,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  pinInputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  pinInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    textAlign: 'center',
    letterSpacing: 8,
  },
  loginButton: {
    backgroundColor: '#0066cc',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#0066cc',
    flex: 1,
    fontWeight: '500',
  },
});
