import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AuthCallbackScreen() {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const handleDeepLink = async () => {
      const url = await Linking.getInitialURL();
      
      if (url != null) {
        console.log('[AuthCallback] Deep link received:', url);
        
        const parsed = Linking.parse(url);
        console.log('[AuthCallback] Parsed URL:', parsed);

        setTimeout(() => {
          router.replace('/(app)/(tabs)');
        }, 500);
      }
    };

    handleDeepLink();

    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('[AuthCallback] New deep link:', url);
      setTimeout(() => {
        router.replace('/(app)/(tabs)');
      }, 500);
    });

    return () => subscription.remove();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ActivityIndicator size="large" color="#0066cc" />
      <Text style={styles.text}>Completing sign in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});
