import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  pin: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithPin: (pin: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'daycare_app_auth_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[AuthProvider] Initializing...');
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      console.log('[Auth] Loading stored user...');
      const storedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        console.log('[Auth] User loaded from storage');
      } else {
        console.log('[Auth] No stored user found');
      }
    } catch (err) {
      console.error('[Auth] Error loading user:', err);
    } finally {
      console.log('[Auth] Loading complete, setting loading to false');
      setLoading(false);
    }
  };

  const signInWithPin = async (pin: string) => {
    try {
      if (pin.length < 4) {
        throw new Error('PIN must be at least 4 digits');
      }

      const storedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      
      if (storedUser) {
        const existingUser = JSON.parse(storedUser);
        if (existingUser.pin !== pin) {
          throw new Error('Incorrect PIN');
        }
        setUser(existingUser);
        console.log('[Auth] User signed in with existing PIN');
      } else {
        const newUser: User = {
          id: `user_${Date.now()}`,
          pin,
          createdAt: new Date().toISOString(),
        };
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
        setUser(newUser);
        console.log('[Auth] New user created with PIN');
      }
    } catch (err) {
      console.error('[Auth] Sign in error:', err);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
      console.log('[Auth] User signed out');
    } catch (err) {
      console.error('[Auth] Sign out error:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithPin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
