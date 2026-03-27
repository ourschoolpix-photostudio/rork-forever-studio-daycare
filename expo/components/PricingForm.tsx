import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useData } from '@/context/DataContext';
import { Ionicons } from '@expo/vector-icons';
import AddPackageModal from '@/components/AddPackageModal';
import EditAlaCarteModal from '@/components/EditAlaCarteModal';
import EditSpecialtyItemModal from '@/components/EditSpecialtyItemModal';
import { calculateTotalSheets } from '@/utils/sheetCalculator';
import { DEFAULT_PRICING_ITEMS } from '@/constants/defaultPricingItems';

interface PricingFormProps {
  pricingList?: any;
  onSuccess: () => void;
}

const PricingForm = forwardRef<{ handleSubmit: () => void }, PricingFormProps>(({ pricingList, onSuccess }, ref) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addPricingList, updatePricingList, pricingLists } = useData();
  const [priceCode, setPriceCode] = useState('');
  const [name, setName] = useState('');
  const [digitalPackages, setDigitalPackages] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [buildYourOwn, setBuildYourOwn] = useState<any[]>([]);
  const [wallPortraits, setWallPortraits] = useState<any[]>([]);
  const [alaCarte, setAlaCarte] = useState<any[]>([]);
  const [specialtyItems, setSpecialtyItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddPackageModal, setShowAddPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [editingBuildYourOwn, setEditingBuildYourOwn] = useState<any>(null);
  const [editingWallPortrait, setEditingWallPortrait] = useState<any>(null);
  const [editingDigitalPackage, setEditingDigitalPackage] = useState<any>(null);
  const [editingAlaCarteItem, setEditingAlaCarteItem] = useState<any>(null);
  const [editingSpecialtyItem, setEditingSpecialtyItem] = useState<any>(null);
  const [updateButtonColor, setUpdateButtonColor] = useState('#22c55e');
  const [addingToSection, setAddingToSection] = useState<'digital-package' | 'packages' | 'build-your-own' | 'wall-portrait' | 'ala-carte' | 'specialty' | null>(null);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    digitalPackages: false,
    packages: false,
    buildYourOwn: false,
    wallPortraits: false,
    alaCarte: false,
    specialty: false,
  });

  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  useEffect(() => {
    if (pricingList) {
      console.log('[PricingForm] Loading pricing list:', JSON.stringify(pricingList, null, 2));
      setPriceCode(pricingList.price_code || '');
      setName(pricingList.name || '');
      setDigitalPackages(pricingList.digital_packages || []);
      setPackages(pricingList.packages || []);
      setBuildYourOwn(pricingList.build_your_own || []);
      setWallPortraits(pricingList.wall_portraits || pricingList.wall_portrait || []);
      setAlaCarte(pricingList.ala_carte || []);
      setSpecialtyItems(pricingList.specialty_items || []);
      setUpdateButtonColor('#22c55e');
    } else {
      setDigitalPackages(DEFAULT_PRICING_ITEMS.digital_packages);
      setPackages(DEFAULT_PRICING_ITEMS.packages);
      setBuildYourOwn(DEFAULT_PRICING_ITEMS.build_your_own);
      setWallPortraits(DEFAULT_PRICING_ITEMS.wall_portraits);
      setAlaCarte(DEFAULT_PRICING_ITEMS.ala_carte);
      setSpecialtyItems(DEFAULT_PRICING_ITEMS.specialty_items);
    }
  }, [pricingList]);

  useEffect(() => {
    if (pricingList) {
      const hasChanges =
        JSON.stringify(packages) !== JSON.stringify(pricingList.packages || []) ||
        JSON.stringify(alaCarte) !== JSON.stringify(pricingList.ala_carte || []) ||
        JSON.stringify(specialtyItems) !== JSON.stringify(pricingList.specialty_items || []) ||
        JSON.stringify(digitalPackages) !== JSON.stringify(pricingList.digital_packages || []) ||
        JSON.stringify(buildYourOwn) !== JSON.stringify(pricingList.build_your_own || []) ||
        JSON.stringify(wallPortraits) !== JSON.stringify(pricingList.wall_portraits || pricingList.wall_portrait || []);
      setUpdateButtonColor(hasChanges ? '#22c55e' : '#0066cc');
    }
  }, [packages, alaCarte, specialtyItems, digitalPackages, buildYourOwn, wallPortraits, pricingList]);

  const capitalizeWords = (text: string): string => {
    return text
      .split(' ')
      .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : ''))
      .join(' ');
  };

  const sortItemsAlphabetic = (items: any[]): any[] => {
    return [...items].sort((a, b) => {
      const nameA = (a.name || '').toLowerCase().trim();
      const nameB = (b.name || '').toLowerCase().trim();
      
      const firstCharA = nameA.charAt(0);
      const firstCharB = nameB.charAt(0);
      
      const isLetterA = /[a-z]/.test(firstCharA);
      const isLetterB = /[a-z]/.test(firstCharB);
      
      if (isLetterA && !isLetterB) return -1;
      if (!isLetterA && isLetterB) return 1;
      
      if (!isLetterA && !isLetterB) {
        const numA = parseInt(nameA.match(/^\d+/)?.[0] || '0', 10);
        const numB = parseInt(nameB.match(/^\d+/)?.[0] || '0', 10);
        if (numA !== numB) {
          return numA - numB;
        }
        return nameA.localeCompare(nameB);
      }
      
      return nameA.localeCompare(nameB);
    });
  };

  const handleSubmit = async () => {
    if (!priceCode.trim() || !name.trim()) {
      Alert.alert('Error', 'Price code and pricing list name are required');
      return;
    }

    setLoading(true);
    try {
      const listData = {
        user_id: '00000000-0000-0000-0000-000000000001',
        price_code: priceCode.toUpperCase(),
        name: capitalizeWords(name),
        digital_packages: digitalPackages.length > 0 ? digitalPackages : undefined,
        packages: packages.length > 0 ? packages : undefined,
        build_your_own: buildYourOwn.length > 0 ? buildYourOwn : undefined,
        wall_portraits: wallPortraits.length > 0 ? wallPortraits : undefined,
        ala_carte: alaCarte.length > 0 ? alaCarte : undefined,
        specialty_items: specialtyItems.length > 0 ? specialtyItems : undefined,
      };

      if (pricingList) {
        await updatePricingList(pricingList.id, listData);
        setUpdateButtonColor('#0066cc');
      } else {
        await addPricingList(listData);
        onSuccess();
      }
    } catch (err: any) {
      console.error('Failed to save pricing list:', err.message || err);
      Alert.alert('Error', err.message || 'Failed to save pricing list');
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    handleSubmit,
  }));

  const renderSection = (
    title: string,
    sectionKey: string,
    items: any[],
    onAddPress: () => void,
    onRemoveItem: (id: string) => void,
    onEditItem: (item: any) => void
  ) => {
    const isExpanded = expandedSections[sectionKey] ?? true;

    return (
      <View style={styles.section}>
        <Pressable
          style={styles.sectionHeader}
          onPress={() => toggleSection(sectionKey)}
        >
          <Text style={styles.sectionTitle}>{title}</Text>
          <View style={styles.headerRight}>
            <Pressable
              style={[styles.addButton, loading && styles.buttonDisabled]}
              onPress={onAddPress}
              disabled={loading}
            >
              <Ionicons name="add" size={18} color="white" />
              <Text style={styles.addButtonText}>Add</Text>
            </Pressable>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              color="#666"
              style={styles.chevron}
            />
          </View>
        </Pressable>

        {isExpanded && (
          <>
            {items.length > 0 ? (
              <ScrollView
                style={styles.itemsScroll}
                scrollEnabled={items.length > 3}
                nestedScrollEnabled={true}
              >
                <FlatList
                  data={sortItemsAlphabetic(items)}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <View style={styles.itemCard}>
                      <Pressable
                        style={styles.itemPressable}
                        onPress={() => {
                          console.log('[PricingForm] Tapped item:', item.name);
                          onEditItem(item);
                        }}
                      >
                        <View style={styles.itemInfo}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <View style={styles.itemDetails}>
                            {item.cost !== undefined && (
                              <Text style={styles.itemCost}>Cost: ${item.cost.toFixed(2)}</Text>
                            )}
                            {item.numberOfPoses && (
                              <Text style={styles.itemSubText}>{item.numberOfPoses} Poses</Text>
                            )}
                            {item.price !== undefined && (
                              <Text style={styles.itemPrice}>Price: ${item.price.toFixed(2)}</Text>
                            )}
                          </View>
                        </View>
                      </Pressable>
                      <Pressable
                        style={styles.removeButton}
                        onPress={() => {
                          console.log('[PricingForm] Deleting item:', item.name);
                          onRemoveItem(item.id);
                        }}
                      >
                        <View style={styles.deleteCircle}>
                          <Ionicons name="close" size={12} color="white" />
                        </View>
                      </Pressable>
                    </View>
                  )}
                />
              </ScrollView>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No items added yet</Text>
              </View>
            )}
          </>
        )}
      </View>
    );
  };

  return (
    <View style={styles.outerContainer}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        {pricingList ? (
          <Pressable
            style={[styles.headerButton, { backgroundColor: updateButtonColor }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.headerButtonText}>UPDATE</Text>
          </Pressable>
        ) : (
          <View style={styles.headerButtonPlaceholder} />
        )}
        <Text style={styles.headerTitle}>{pricingList ? 'Edit Pricing List' : 'Create Pricing List'}</Text>
        <Pressable
          style={styles.headerCloseButton}
          onPress={() => router.back()}
        >
          <Text style={styles.headerCloseButtonText}>Close</Text>
        </Pressable>
      </View>
      <ScrollView style={styles.container}>
        <View style={styles.form}>
        <Text style={styles.label}>Price Code *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., PC-001"
          value={priceCode}
          onChangeText={setPriceCode}
          editable={!loading}
        />

        <Text style={styles.label}>Pricing List Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Standard Pricing"
          value={name}
          onChangeText={(text) => setName(capitalizeWords(text))}
          editable={!loading}
        />

        {renderSection(
          'Digital Packages',
          'digitalPackages',
          digitalPackages,
          () => {
            setAddingToSection('digital-package');
            setShowAddPackageModal(true);
          },
          (id) => setDigitalPackages(digitalPackages.filter((p) => p.id !== id)),
          (item) => {
            setAddingToSection('digital-package');
            setEditingDigitalPackage(item);
            setShowAddPackageModal(true);
          }
        )}

        <View style={styles.section}>
          <Pressable
            style={styles.sectionHeader}
            onPress={() => toggleSection('packages')}
          >
            <Text style={styles.sectionTitle}>Print Packages</Text>
            <View style={styles.headerRight}>
              <Pressable
                style={[styles.addButton, loading && styles.buttonDisabled]}
                onPress={() => {
                  setAddingToSection('packages');
                  setShowAddPackageModal(true);
                }}
                disabled={loading}
              >
                <Ionicons name="add" size={18} color="white" />
                <Text style={styles.addButtonText}>Add</Text>
              </Pressable>
              <Ionicons
                name={expandedSections.packages ? 'chevron-up' : 'chevron-down'}
                size={24}
                color="#666"
                style={styles.chevron}
              />
            </View>
          </Pressable>

          {expandedSections.packages && (
            <>
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Multi Pose Packages</Text>
            {packages.filter((p) => p.type === 'multi-pose').length > 0 ? (
              <FlatList
                data={sortItemsAlphabetic(packages.filter((p) => p.type === 'multi-pose'))}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={styles.itemCard}>
                    <Pressable
                      style={styles.itemPressable}
                      onPress={() => {
                        console.log('[PricingForm] Multi-pose package tapped:', item.name);
                        setEditingPackage(item);
                        setShowAddPackageModal(true);
                      }}
                    >
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <View style={styles.itemDetails}>
                          {item.cost !== undefined && (
                            <Text style={styles.itemCost}>Cost: ${item.cost.toFixed(2)}</Text>
                          )}
                          <Text style={styles.itemSubText}>Sheets: {calculateTotalSheets(item.sheetSizes, item.numberOfPoses, item.type)}</Text>
                          {item.numberOfPoses && (
                            <Text style={styles.itemSubText}>{item.numberOfPoses} Poses</Text>
                          )}
                          {item.price !== undefined && (
                            <Text style={styles.itemPrice}>Price: ${item.price.toFixed(2)}</Text>
                          )}
                        </View>
                      </View>
                    </Pressable>
                    <Pressable
                      style={styles.removeButton}
                      onPress={() => {
                        console.log('[PricingForm] Deleting multi-pose package:', item.name);
                        setPackages(packages.filter((p) => p.id !== item.id));
                      }}
                    >
                      <View style={styles.deleteCircle}>
                        <Ionicons name="close" size={12} color="white" />
                      </View>
                    </Pressable>
                  </View>
                )}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No multi-pose packages added</Text>
              </View>
            )}
          </View>

          <View style={[styles.subsection, styles.subsectionLast]}>
            <Text style={styles.subsectionTitle}>Single Pose Packages</Text>
            {packages.filter((p) => p.type === 'single-pose').length > 0 ? (
              <FlatList
                data={sortItemsAlphabetic(packages.filter((p) => p.type === 'single-pose'))}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={styles.itemCard}>
                    <Pressable
                      style={styles.itemPressable}
                      onPress={() => {
                        console.log('[PricingForm] Single-pose package tapped:', item.name);
                        setEditingPackage(item);
                        setShowAddPackageModal(true);
                      }}
                    >
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <View style={styles.itemDetails}>
                          {item.cost !== undefined && (
                            <Text style={styles.itemCost}>Cost: ${item.cost.toFixed(2)}</Text>
                          )}
                          <Text style={styles.itemSubText}>Sheets: {calculateTotalSheets(item.sheetSizes, item.numberOfPoses, item.type)}</Text>
                          {item.price !== undefined && (
                            <Text style={styles.itemPrice}>Price: ${item.price.toFixed(2)}</Text>
                          )}
                        </View>
                      </View>
                    </Pressable>
                    <Pressable
                      style={styles.removeButton}
                      onPress={() => {
                        console.log('[PricingForm] Deleting single-pose package:', item.name);
                        setPackages(packages.filter((p) => p.id !== item.id));
                      }}
                    >
                      <View style={styles.deleteCircle}>
                        <Ionicons name="close" size={12} color="white" />
                      </View>
                    </Pressable>
                  </View>
                )}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No single-pose packages added</Text>
              </View>
            )}
          </View>
            </>
          )}
        </View>

        {renderSection(
          'Build Your Own',
          'buildYourOwn',
          buildYourOwn,
          () => {
            setAddingToSection('build-your-own');
            setShowAddPackageModal(true);
          },
          (id) => setBuildYourOwn(buildYourOwn.filter((p) => p.id !== id)),
          (item) => {
            setAddingToSection('build-your-own');
            setEditingBuildYourOwn(item);
            setShowAddPackageModal(true);
          }
        )}

        {renderSection(
          'A La Carte',
          'alaCarte',
          alaCarte,
          () => {
            setAddingToSection('ala-carte');
            setShowAddPackageModal(true);
          },
          (id) => setAlaCarte(alaCarte.filter((p) => p.id !== id)),
          (item) => {
            console.log('[PricingForm] A La Carte item tapped:', item.name);
            setEditingAlaCarteItem(item);
          }
        )}

        {renderSection(
          'Wall Portrait',
          'wallPortraits',
          wallPortraits,
          () => {
            setAddingToSection('wall-portrait');
            setShowAddPackageModal(true);
          },
          (id) => setWallPortraits(wallPortraits.filter((p) => p.id !== id)),
          (item) => {
            setAddingToSection('wall-portrait');
            setEditingWallPortrait(item);
            setShowAddPackageModal(true);
          }
        )}

        {renderSection(
          'Specialty Items',
          'specialty',
          specialtyItems,
          () => {
            setAddingToSection('specialty');
            setShowAddPackageModal(true);
          },
          (id) => setSpecialtyItems(specialtyItems.filter((p) => p.id !== id)),
          (item) => {
            console.log('[PricingForm] Specialty item tapped:', item.name);
            setEditingSpecialtyItem(item);
          }
        )}

        {!pricingList && (
          <Pressable
            style={[styles.submitButton, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Saving...' : 'Create Pricing List'}
            </Text>
          </Pressable>
        )}
      </View>
      </ScrollView>

      <AddPackageModal
        visible={showAddPackageModal || !!editingPackage || !!editingDigitalPackage || !!editingBuildYourOwn || !!editingWallPortrait}
        onClose={() => {
          console.log('[PricingForm] Closing AddPackageModal');
          setShowAddPackageModal(false);
          setEditingPackage(null);
          setEditingDigitalPackage(null);
          setEditingBuildYourOwn(null);
          setEditingWallPortrait(null);
          setAddingToSection(null);
        }}
        onAdd={(packageData) => {
          if (packageData.type === 'ala-carte') {
            setAlaCarte([...alaCarte, packageData]);
          } else if (packageData.type === 'specialty') {
            setSpecialtyItems([...specialtyItems, packageData]);
          } else if (packageData.type === 'digital-package') {
            setDigitalPackages([...digitalPackages, packageData]);
          } else if (packageData.type === 'build-your-own') {
            setBuildYourOwn([...buildYourOwn, packageData]);
          } else if (packageData.type === 'wall-portrait') {
            setWallPortraits([...wallPortraits, packageData]);
          } else {
            setPackages([...packages, packageData]);
          }
          setShowAddPackageModal(false);
          setAddingToSection(null);
        }}
        editingItem={editingPackage || editingDigitalPackage || editingBuildYourOwn || editingWallPortrait}
        onEdit={(packageData) => {
          console.log('[PricingForm] Editing package:', packageData.name, packageData.type);
          if (packageData.type === 'digital-package') {
            setDigitalPackages(digitalPackages.map((item) => (item.id === packageData.id ? packageData : item)));
            setEditingDigitalPackage(null);
          } else if (packageData.type === 'build-your-own') {
            setBuildYourOwn(buildYourOwn.map((item) => (item.id === packageData.id ? packageData : item)));
            setEditingBuildYourOwn(null);
          } else if (packageData.type === 'wall-portrait') {
            setWallPortraits(wallPortraits.map((item) => (item.id === packageData.id ? packageData : item)));
            setEditingWallPortrait(null);
          } else {
            setPackages(packages.map((p) => (p.id === packageData.id ? packageData : p)));
            setEditingPackage(null);
          }
          setShowAddPackageModal(false);
          setAddingToSection(null);
        }}
      />

      <EditAlaCarteModal
        visible={!!editingAlaCarteItem}
        onClose={() => setEditingAlaCarteItem(null)}
        onSave={(itemData) => {
          setAlaCarte(alaCarte.map((item) => (item.id === itemData.id ? itemData : item)));
          setEditingAlaCarteItem(null);
        }}
        editingItem={editingAlaCarteItem}
      />

      <EditSpecialtyItemModal
        visible={!!editingSpecialtyItem}
        onClose={() => setEditingSpecialtyItem(null)}
        onSave={(itemData) => {
          setSpecialtyItems(specialtyItems.map((item) => (item.id === itemData.id ? itemData : item)));
          setEditingSpecialtyItem(null);
        }}
        editingItem={editingSpecialtyItem}
      />
    </View>
  );
});

PricingForm.displayName = 'PricingForm';

export default PricingForm;

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    flex: 1,
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  headerButtonPlaceholder: {
    width: 70,
  },
  headerButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  headerCloseButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  headerCloseButtonText: {
    color: '#1a1a1a',
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#1a1a1a',
    marginTop: 12,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
    marginBottom: 8,
  },
  section: {
    marginTop: 20,
    marginBottom: 16,
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
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chevron: {
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  subsection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  subsectionLast: {
    borderBottomWidth: 0,
  },
  subsectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066cc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  itemsScroll: {
    maxHeight: 300,
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemPressable: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  itemDetails: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    marginTop: 6,
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
    fontSize: 12,
    color: '#0066cc',
    fontWeight: '600',
  },
  removeButton: {
    padding: 8,
    marginRight: -8,
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
  submitButton: {
    backgroundColor: '#0066cc',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
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
