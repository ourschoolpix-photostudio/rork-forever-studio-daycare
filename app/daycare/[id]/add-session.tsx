import { useLocalSearchParams, router } from 'expo-router';
import SessionFormModal from '@/components/SessionFormModal';

export default function AddSessionScreen() {
  const { id } = useLocalSearchParams();

  return (
    <SessionFormModal
      visible={true}
      daycareId={id as string}
      onClose={() => router.back()}
      onSuccess={() => router.back()}
    />
  );
}
