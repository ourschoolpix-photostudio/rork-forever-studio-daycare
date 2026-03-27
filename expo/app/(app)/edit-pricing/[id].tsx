import { router, useLocalSearchParams } from 'expo-router';
import { useData } from '@/context/DataContext';
import PricingForm from '@/components/PricingForm';

export default function EditPricingScreen() {
  const { id } = useLocalSearchParams();
  const { pricingLists } = useData();

  const pricingList = pricingLists.find((p) => p.id === id);

  if (!pricingList) {
    return null;
  }

  return (
    <PricingForm
      pricingList={pricingList}
      onSuccess={() => {
        router.back();
      }}
    />
  );
}
