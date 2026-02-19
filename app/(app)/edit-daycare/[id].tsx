import { router, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { useData } from '@/context/DataContext';
import DaycareForm from '@/components/DaycareForm';

export default function EditDaycareScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { daycares } = useData();
  const formRef = useRef<any>(null);

  const daycare = Array.isArray(id) ? daycares.find((d) => d.id === id[0]) : daycares.find((d) => d.id === id);

  if (!daycare) {
    return null;
  }

  return (
    <DaycareForm
      ref={formRef}
      daycare={daycare}
      showHeader={true}
      onSuccess={() => {
        router.back();
      }}
    />
  );
}
