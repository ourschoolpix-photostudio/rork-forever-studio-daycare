import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { Stack } from 'expo-router';

let WebView: any = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    WebView = require('react-native-webview').WebView;
  } catch (e: any) {
    console.error('[WebView] Failed to load WebView:', e);
  }
}

export default function WebScreen() {
  const webViewRef = useRef<any>(null);

  const handleBack = () => {
    if (Platform.OS === 'web') {
      window.history.back();
    } else {
      webViewRef.current?.goBack();
    }
  };

  const handleNavigation = (url: string) => {
    if (Platform.OS === 'web') {
      window.location.href = url;
    } else {
      webViewRef.current?.injectJavaScript(`window.location.href = '${url}';`);
    }
  };

  if (Platform.OS === 'web') {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.container}>
          <iframe
            src="https://www.foreverstudio.com/sy-admin/index.php?do=login"
            style={{ flex: 1, border: 'none', width: '100%', height: '100%' }}
          />
          <View style={styles.footer}>
            <Pressable style={styles.footerButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="#0066cc" />
            </Pressable>
            <Pressable 
              style={styles.footerButton}
              onPress={() => handleNavigation('https://www.foreverstudio.com/sy-admin/index.php?do=orders#page=thumbs')}
            >
              <Ionicons name="cube" size={24} color="#0066cc" />
            </Pressable>
            <Pressable 
              style={styles.footerButton}
              onPress={() => handleNavigation('https://www.foreverstudio.com/sy-admin/index.php?do=booking#page=thumbs')}
            >
              <Ionicons name="calendar" size={24} color="#0066cc" />
            </Pressable>
            <Pressable 
              style={styles.footerButton}
              onPress={() => handleNavigation('https://www.foreverstudio.com')}
            >
              <Ionicons name="globe" size={24} color="#0066cc" />
            </Pressable>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <WebView
          ref={webViewRef}
          source={{ uri: 'https://www.foreverstudio.com/sy-admin/index.php?do=login' }}
          style={styles.webview}
          onError={(e: any) => console.error('[WebView] Error:', e.nativeEvent)}
        />
        <View style={styles.footer}>
          <Pressable style={styles.footerButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#0066cc" />
          </Pressable>
          <Pressable 
            style={styles.footerButton}
            onPress={() => handleNavigation('https://www.foreverstudio.com/sy-admin/index.php?do=orders#page=thumbs')}
          >
            <Ionicons name="cube" size={24} color="#0066cc" />
          </Pressable>
          <Pressable 
            style={styles.footerButton}
            onPress={() => handleNavigation('https://www.foreverstudio.com/sy-admin/index.php?do=booking#page=thumbs')}
          >
            <Ionicons name="calendar" size={24} color="#0066cc" />
          </Pressable>
          <Pressable 
            style={styles.footerButton}
            onPress={() => handleNavigation('https://www.foreverstudio.com')}
          >
            <Ionicons name="globe" size={24} color="#0066cc" />
          </Pressable>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  footer: {
    height: 60,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 8,
  },
  footerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
