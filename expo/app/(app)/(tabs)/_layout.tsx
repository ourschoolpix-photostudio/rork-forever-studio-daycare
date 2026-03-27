import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Alert } from 'react-native';
import { useAuth } from '@/context/AuthContext';

export default function TabsLayout() {
  const { signOut } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0066cc',
        tabBarInactiveTintColor: '#fff',
        tabBarStyle: {
          backgroundColor: '#0a2540',
        },
        headerStyle: {
          backgroundColor: '#0a2540',
          borderBottomWidth: 1,
          borderBottomColor: '#e0e0e0',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
          color: '#fff',
        },
        headerRight: () => (
          <Pressable 
            onPress={() => {
              Alert.alert('Log Out', 'Are you sure you want to log out?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Log Out',
                  style: 'destructive',
                  onPress: async () => {
                    await signOut();
                  },
                },
              ]);
            }}
            style={{ paddingRight: 16 }}
          >
            <Ionicons name="log-out" size={24} color="#ff3b30" />
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          headerTitle: 'Daycare Accounts',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="pricing"
        options={{
          title: 'Pricing',
          headerTitle: 'Pricing Lists',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pricetag" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          headerTitle: 'Sessions Schedule',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerTitle: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="web"
        options={{
          title: 'Web',
          headerTitle: 'Forever Studio Admin',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="globe" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          headerTitle: 'ADMIN',
          headerTitleAlign: 'center',
          tabBarIcon: ({ size }) => (
            <Ionicons name="shield" color="#FFD700" size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
