import { Stack } from 'expo-router';

export default function SessionIdLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="sales" 
        options={{
          headerShown: true,
          title: 'Session Sales',
          headerBackVisible: false,
          headerStyle: {
            backgroundColor: '#065f46',
          },
          headerTintColor: 'white',
          headerTitleStyle: {
            color: 'white',
            fontWeight: '600',
          },
          headerLeft: () => null,
        }}
      />
      <Stack.Screen 
        name="expense"
        options={{
          headerShown: true,
          title: 'Expenses',
          headerStyle: {
            backgroundColor: '#065f46',
          },
          headerTintColor: 'white',
          headerTitleStyle: {
            color: 'white',
            fontWeight: '600',
          },
          headerLeft: () => null,
        }}
      />
      <Stack.Screen 
        name="summary"
        options={{
          headerShown: true,
          title: 'Summary',
          headerStyle: {
            backgroundColor: '#065f46',
          },
          headerTintColor: 'white',
          headerTitleStyle: {
            color: 'white',
            fontWeight: '600',
          },
          headerLeft: () => null,
        }}
      />
    </Stack>
  );
}
