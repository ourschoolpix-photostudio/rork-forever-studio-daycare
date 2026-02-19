import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '@/context/DataContext';
import { calculateTotalSheets } from '@/utils/sheetCalculator';

export default function PricingDetailScreen() {
  const { id } = useLocalSearchParams();
  const { pricingLists } = useData();
  const [pricingList, setPricingList] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    digitalPackages: false,
    multiPose: false,
    singlePose: false,
    buildYourOwn: false,
    alaCarte: false,
    wallPortraits: false,
    specialty: false,
  });

  useEffect(() => {
    const list = pricingLists.find((p) => p.id === id);
    if (list) {
      console.log('[PricingDetail] Loaded pricing list:', { id: list.id, price_code: list.price_code, name: list.name });
    }
    setPricingList(list);
  }, [id, pricingLists]);

  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const renderItemCard = (item: any) => (
    <View key={item.id} style={styles.itemCard}>
      <View style={styles.itemContent}>
        <Text style={styles.itemName}>{item.name}</Text>
        <View style={styles.itemDetails}>
          {item.cost !== undefined && (
            <Text style={styles.itemCost}>Cost: ${item.cost.toFixed(2)}</Text>
          )}
          {item.numberOfPoses && (
            <Text style={styles.itemSubText}>{item.numberOfPoses} Poses</Text>
          )}
          {item.sheetSizes && (
            <Text style={styles.itemSubText}>
              Sheets: {calculateTotalSheets(item.sheetSizes, item.numberOfPoses, item.type)}
            </Text>
          )}
          {item.price !== undefined && (
            <Text style={styles.itemPrice}>Price: ${item.price.toFixed(2)}</Text>
          )}
        </View>
      </View>
    </View>
  );

  const renderPackageCard = (item: any) => {
    const sheetSizesWithValues = Array.isArray(item.sheetSizes)
      ? item.sheetSizes
          .filter((s: { size: string; qty: string | number }) => {
            const qty = typeof s.qty === 'string' ? parseInt(s.qty) : s.qty;
            return qty && qty > 0;
          })
      : [];

    return (
      <View key={item.id} style={styles.packageCard}>
        <View style={styles.packageLeft}>
          <Text style={styles.itemName}>{item.name}</Text>
          <View style={styles.itemDetails}>
            {item.cost !== undefined && (
              <Text style={styles.itemCost}>Cost: ${item.cost.toFixed(2)}</Text>
            )}
            {item.numberOfPoses && (
              <Text style={styles.itemSubText}>{item.numberOfPoses} Poses</Text>
            )}
            {item.sheetSizes && (
              <Text style={styles.itemSubText}>
                Total Sheets: {calculateTotalSheets(item.sheetSizes, item.numberOfPoses, item.type)}
              </Text>
            )}
            {item.price !== undefined && (
              <Text style={styles.itemPrice}>Price: ${item.price.toFixed(2)}</Text>
            )}
          </View>
        </View>

        {sheetSizesWithValues.length > 0 && (
          <View style={styles.packageRight}>
            <Text style={styles.sheetSizesLabel}>Sheets</Text>
            {sheetSizesWithValues.map(({ size, qty }: { size: string; qty: string | number }) => (
              <Text key={size} style={styles.sheetSizeItem}>
                {size}: {qty}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderSection = (
    title: string,
    sectionKey: string,
    items: any[]
  ) => {
    const isExpanded = expandedSections[sectionKey] ?? false;

    return (
      <View style={styles.section} key={sectionKey}>
        <Pressable
          style={styles.sectionHeader}
          onPress={() => toggleSection(sectionKey)}
        >
          <Text style={styles.sectionTitle}>{title}</Text>
          <View style={styles.headerRight}>
            {items.length > 0 && (
              <Text style={styles.itemCount}>{items.length}</Text>
            )}
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              color="#0066cc"
            />
          </View>
        </Pressable>

        {isExpanded && (
          <>
            {items.length > 0 ? (
              <View style={styles.itemsList}>
                {sectionKey === 'multiPose' || sectionKey === 'singlePose'
                  ? items.map((item) => renderPackageCard(item))
                  : items.map((item) => renderItemCard(item))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No items</Text>
              </View>
            )}
          </>
        )}
      </View>
    );
  };

  if (!pricingList) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const multiPosePackages = (pricingList.packages || []).filter(
    (p: any) => p.type === 'multi-pose'
  );
  const singlePosePackages = (pricingList.packages || []).filter(
    (p: any) => p.type === 'single-pose'
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>{pricingList.name}</Text>
          <Text style={styles.priceCode}>{pricingList.price_code}</Text>
        </View>

        {renderSection(
          'Digital Packages',
          'digitalPackages',
          pricingList.digital_packages || []
        )}

        <View style={styles.section}>
          <Pressable
            style={styles.sectionHeader}
            onPress={() => toggleSection('multiPose')}
          >
            <Text style={styles.sectionTitle}>Multi-Pose Packages</Text>
            <View style={styles.headerRight}>
              {multiPosePackages.length > 0 && (
                <Text style={styles.itemCount}>{multiPosePackages.length}</Text>
              )}
              <Ionicons
                name={expandedSections['multiPose'] ? 'chevron-up' : 'chevron-down'}
                size={24}
                color="#0066cc"
              />
            </View>
          </Pressable>
          {expandedSections['multiPose'] && (
            <>
              {multiPosePackages.length > 0 ? (
                <View style={styles.itemsList}>
                  {multiPosePackages.map((item: any) => renderPackageCard(item))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No items</Text>
                </View>
              )}
            </>
          )}
        </View>

        <View style={styles.section}>
          <Pressable
            style={styles.sectionHeader}
            onPress={() => toggleSection('singlePose')}
          >
            <Text style={styles.sectionTitle}>Single Pose Packages</Text>
            <View style={styles.headerRight}>
              {singlePosePackages.length > 0 && (
                <Text style={styles.itemCount}>{singlePosePackages.length}</Text>
              )}
              <Ionicons
                name={expandedSections['singlePose'] ? 'chevron-up' : 'chevron-down'}
                size={24}
                color="#0066cc"
              />
            </View>
          </Pressable>
          {expandedSections['singlePose'] && (
            <>
              {singlePosePackages.length > 0 ? (
                <View style={styles.itemsList}>
                  {singlePosePackages.map((item: any) => renderPackageCard(item))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No items</Text>
                </View>
              )}
            </>
          )}
        </View>

        {renderSection(
          'Build Your Own',
          'buildYourOwn',
          pricingList.build_your_own || []
        )}

        {renderSection(
          'A La Carte',
          'alaCarte',
          pricingList.ala_carte || []
        )}

        {renderSection(
          'Wall Portraits',
          'wallPortraits',
          pricingList.wall_portraits || pricingList.wall_portrait || []
        )}

        {renderSection(
          'Specialty Items',
          'specialty',
          pricingList.specialty_items || []
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  priceCode: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  section: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0066cc',
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  itemsList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  packageCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 12,
  },
  packageLeft: {
    flex: 1,
  },
  packageRight: {
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
    minWidth: 100,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  itemDetails: {
    gap: 4,
  },
  itemSubText: {
    fontSize: 12,
    color: '#666',
  },
  itemCost: {
    fontSize: 12,
    color: '#ff3b30',
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: 13,
    color: '#0066cc',
    fontWeight: '700',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  sheetSizesLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  sheetSizeItem: {
    fontSize: 11,
    color: '#888',
    marginBottom: 3,
    fontFamily: 'monospace',
  },
});
