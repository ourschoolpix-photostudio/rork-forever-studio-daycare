import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";
import { ActivityIndicator, View, Text, StyleSheet } from "react-native";
import { ErrorBoundary } from "@/components/ErrorBoundary";

SplashScreen.preventAutoHideAsync();

console.log('[App] App starting...');

if (typeof ErrorUtils !== 'undefined') {
  const originalHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    const errorMessage = error?.message || String(error);
    const errorStack = error?.stack || '';
    
    if (
      errorMessage.includes('Exception in HostFunction') ||
      errorMessage.includes('reanimated') ||
      errorMessage.includes('NativeReanimated') ||
      errorMessage.includes('Worklets') ||
      errorMessage.includes('Mismatch between JavaScript part and native part') ||
      errorStack.includes('NativeReanimated') ||
      errorStack.includes('installTurboModule')
    ) {
      console.warn('[GlobalErrorHandler] Ignoring reanimated/worklets error:', errorMessage);
      return;
    }
    
    console.error('[GlobalErrorHandler] Error:', error);
    console.error('[GlobalErrorHandler] Stack:', error.stack);
    console.error('[GlobalErrorHandler] isFatal:', isFatal);
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
}

const queryClient = new QueryClient();

function RootLayoutNav() {
  const [initError, setInitError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const segments = useSegments() as string[];
  const router = useRouter();
  
  let user, loading;
  try {
    const auth = useAuth();
    user = auth.user;
    loading = auth.loading;
    console.log('[RootLayout] Auth state:', { hasUser: !!user, loading });
  } catch (err) {
    console.error('[RootLayout] Auth error:', err);
    setInitError('Failed to load auth: ' + (err as Error).message);
    loading = false;
    user = null;
  }
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isMounted || loading) return;
    console.log('[RootLayout] Effect running - loading:', loading);

    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';
    const inDaycareGroup = segments[0] === 'daycare';

    console.log('[RootLayout] Segments:', segments);
    console.log('[RootLayout] inAuthGroup:', inAuthGroup, 'inAppGroup:', inAppGroup, 'inDaycareGroup:', inDaycareGroup);
    console.log('[RootLayout] User exists:', !!user);

    if (!user && !inAuthGroup) {
      console.log('[RootLayout] Redirecting to login - no user');
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup && segments.length > 1 && segments[1] !== 'auth-callback') {
      console.log('[RootLayout] Redirecting to app - user logged in but in auth screens');
      router.replace('/(app)/(tabs)');
    } else {
      console.log('[RootLayout] Navigation allowed');
    }
  }, [isMounted, user, loading, segments, router]);

  useEffect(() => {
    console.log('[RootLayout] Splash screen effect - loading:', loading, 'isMounted:', isMounted);
    if (!loading && isMounted) {
      console.log('[RootLayout] Hiding splash screen');
      const timer = setTimeout(() => {
        SplashScreen.hideAsync().catch(err => {
          console.error('[RootLayout] Failed to hide splash:', err);
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, isMounted]);
  
  if (!isMounted) {
    console.log('[RootLayout] Not mounted yet, showing initial loading state');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  if (initError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Initialization Error</Text>
        <Text style={styles.errorText}>{initError}</Text>
      </View>
    );
  }

  if (loading) {
    console.log('[RootLayout] Rendering loading state');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  console.log('[RootLayout] Rendering navigation stack');
  return (
    <Stack screenOptions={{ headerBackTitle: "Back", headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
      <Stack.Screen name="daycare" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ff3b30',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default function RootLayout() {
  console.log('[App] RootLayout rendering');
  try {
    return (
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <DataProvider>
              <RootLayoutNav />
            </DataProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    );
  } catch (err) {
    console.error('[App] Fatal error in RootLayout:', err);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Fatal Error</Text>
        <Text style={styles.errorText}>{(err as Error).message}</Text>
      </View>
    );
  }
}
