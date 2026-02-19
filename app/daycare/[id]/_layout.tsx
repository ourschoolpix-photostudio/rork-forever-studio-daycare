import { Stack } from 'expo-router';

export default function DaycareIdLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="index" 
        options={{
          headerShown: true,
          headerTitle: 'Daycare Details',
          headerBackVisible: false,
          headerStyle: {
            backgroundColor: '#065f46',
          },
          headerTintColor: 'white',
          headerTitleStyle: {
            color: 'white',
            fontWeight: '600',
          },
        }} 
      />
      <Stack.Screen name="add-session" options={{ presentation: 'modal' }} />
      <Stack.Screen name="session" />
    </Stack>
  );
}
