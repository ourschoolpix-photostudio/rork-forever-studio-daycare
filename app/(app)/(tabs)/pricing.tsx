import { View, Text, FlatList, Pressable, StyleSheet, Alert } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { useData } from '@/context/DataContext';
import { Ionicons } from '@expo/vector-icons';

export default function PricingScreen() {
  const { pricingLists, deletePricingList } = useData();

  useFocusEffect(() => {
    // Data is already loaded
  });

  const handleAddPricing = () => {
    router.push('/(app)/add-pricing');
  };

  const handleSelectPricing = (id: string) => {
    router.push(`/(app)/pricing/${id}` as any);
  };

  const handleDeletePricing = async (id: string) => {
    Alert.alert('Delete Pricing List', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePricingList(id);
          } catch (err: any) {
            Alert.alert('Cannot Delete', err.message);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {pricingLists.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="pricetag" size={48} color="#ccc" />
          <Text style={styles.emptyTitle}>No Pricing Lists</Text>
          <Text style={styles.emptyText}>Create your first pricing template</Text>
          <Pressable style={styles.addButton} onPress={handleAddPricing}>
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.addButtonText}>Add Pricing</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            data={pricingLists}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Pressable
                style={styles.pricingCard}
                onPress={() => handleSelectPricing(item.id)}
              >
                <View style={styles.cardContent}>
                  <Text style={styles.pricingName}>{item.name}</Text>
                  <Text style={styles.codeValue}>{item.price_code}</Text>
                </View>
                <Pressable
                  style={styles.editButton}
                  onPress={() => router.push(`/(app)/edit-pricing/${item.id}` as any)}
                >
                  <Ionicons name="create" size={40} color="#0066cc" />
                </Pressable>
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => handleDeletePricing(item.id)}
                >
                  <View style={styles.deleteCircle}>
                    <Ionicons name="close" size={14} color="white" />
                  </View>
                </Pressable>
              </Pressable>
            )}
          />
          <Pressable style={styles.fab} onPress={handleAddPricing}>
            <Ionicons name="add" size={28} color="white" />
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
  },
  pricingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    position: 'relative',
    minHeight: 120,
  },
  cardContent: {
    flex: 1,
    pointerEvents: 'none',
  },
  pricingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  codeValue: {
    fontSize: 60,
    color: '#0066cc',
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    fontSize: 12,
    color: '#666',
  },
  editButton: {
    position: 'absolute',
    bottom: 2,
    right: -3,
    padding: 8,
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 0,
  },
  actions: {
    display: 'none',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    color: '#1a1a1a',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 24,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#0066cc',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
