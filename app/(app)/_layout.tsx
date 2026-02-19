import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="add-daycare"
        options={{
          presentation: 'modal',
          headerShown: true,
          headerTitle: 'Add Daycare',
        }}
      />

      <Stack.Screen
        name="add-pricing"
        options={{
          presentation: 'modal',
          headerShown: true,
          headerTitle: 'Create Pricing List',
        }}
      />
      <Stack.Screen
        name="pricing/[id]"
        options={{
          headerShown: true,
          headerTitle: 'Pricing Details',
        }}
      />
      <Stack.Screen
        name="edit-pricing/[id]"
        options={{
          presentation: 'modal',
          headerShown: true,
          headerTitle: 'Edit Pricing List',
        }}
      />
      <Stack.Screen
        name="edit-daycare/[id]"
        options={{
          presentation: 'modal',
          headerShown: true,
          headerTitle: 'Edit Daycare',
        }}
      />
      <Stack.Screen
        name="email-templates"
        options={{
          headerShown: true,
          headerTitle: 'Email Templates',
        }}
      />
    </Stack>
  );
}
