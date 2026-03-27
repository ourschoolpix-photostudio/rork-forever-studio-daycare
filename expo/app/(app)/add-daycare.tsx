import { router, useNavigation } from 'expo-router';
import { useLayoutEffect, useRef } from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DaycareForm from '@/components/DaycareForm';

export default function AddDaycareScreen() {
  const navigation = useNavigation();
  const formRef = useRef<any>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Add Daycare',
      headerTitleAlign: 'center',
      headerLeft: () => (
        <Pressable
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: '#34c759',
            justifyContent: 'center',
            alignItems: 'center',
            marginLeft: 16,
          }}
          onPress={() => {
            formRef.current?.handleSubmit?.();
          }}
        >
          <Ionicons name="checkmark" size={18} color="white" />
        </Pressable>
      ),
      headerRight: () => (
        <Pressable
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: '#ff3b30',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 16,
          }}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={18} color="white" />
        </Pressable>
      ),
    });
  }, [navigation]);

  return (
    <DaycareForm
      ref={formRef}
      showHeader={false}
      onSuccess={() => {
        router.back();
      }}
    />
  );
}
