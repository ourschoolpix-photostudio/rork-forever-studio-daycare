import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useData } from '@/context/DataContext';
import { Ionicons } from '@expo/vector-icons';

type SalesType = 'early-bird' | 'regular';
interface Sale {
  id: string;
  item_name?: string;
  quantity: number;
  unit_price: number;
  type?: SalesType;
  cost?: number;
}

interface SalesItemsFormProps {
  visible: boolean;
  onClose: () => void;
  priceCode: string;
  sessionId: string;
  editingSale?: Sale | null;
  onAddSale: (quantity: number, unitPrice: number, itemName: string, salesType: SalesType, cost?: number) => Promise<void>;
  onUpdateSale?: (saleId: string, quantity: number, unitPrice: number, itemName: string, salesType: SalesType, cost?: number) => Promise<void>;
  onDeleteSale?: (saleId: string) => Promise<void>;
}

export default function SalesItemsForm({
  visible,
  onClose,
  priceCode,
  sessionId,
  editingSale,
  onAddSale,
  onUpdateSale,
  onDeleteSale,
}: SalesItemsFormProps) {
  const insets = useSafeAreaInsets();
  const { pricingLists } = useData();
  const [salesType, setSalesType] = useState<SalesType>('early-bird');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [costs, setCosts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [customSalesAmount, setCustomSalesAmount] = useState('');
  const [customSalesQuantity, setCustomSalesQuantity] = useState('');
  const [customSalesCost, setCustomSalesCost] = useState('');
  const [customSalesName, setCustomSalesName] = useState('');
  const [editingCustomSale, setEditingCustomSale] = useState(false);

  const pricingList = useMemo(() => {
    const found = pricingLists.find((p) => p.price_code === priceCode);
    return found;
  }, [pricingLists, priceCode]);

  const findItemInPricingList = useCallback((itemIdOrName: string) => {
    const allItems = [
      ...(pricingList?.packages || []),
      ...(pricingList?.digital_packages || []),
      ...((pricingList?.wall_portraits || (pricingList as any)?.wall_portrait) || []),
      ...(pricingList?.ala_carte || []),
      ...(pricingList?.specialty_items || []),
      ...(pricingList?.build_your_own || []),
    ];
    
    return allItems.find((i) => i.id === itemIdOrName || i.name === itemIdOrName) || null;
  }, [pricingList]);

  useEffect(() => {
    const loadSalesType = async () => {
      try {
        if (editingSale && visible && pricingList) {
          setSalesType(editingSale.type || 'early-bird');
          
          const item = findItemInPricingList(editingSale.item_name || '');
          
          if (!item) {
            setEditingCustomSale(true);
            setCustomSalesName(editingSale.item_name || '');
            setCustomSalesAmount(editingSale.unit_price.toString());
            setCustomSalesQuantity(editingSale.quantity.toString());
            setCustomSalesCost(editingSale.cost?.toString() || '');
          } else {
            setEditingCustomSale(false);
            const itemId = item.id;
            setQuantities({ [itemId]: editingSale.quantity });
            
            if (editingSale.cost !== undefined) {
              setCosts({ [itemId]: editingSale.cost.toString() });
            }
          }
        } else if (visible && !editingSale) {
          const savedSalesType = await AsyncStorage.getItem('lastSalesType');
          const typeToUse = (savedSalesType as SalesType) || 'early-bird';
          setSalesType(typeToUse);
          setQuantities({});
          setCosts({});
          setExpandedSections({});
          setCustomSalesAmount('');
          setCustomSalesQuantity('');
          setCustomSalesCost('');
          setCustomSalesName('');
          setEditingCustomSale(false);
        }
      } catch (err) {
        console.log('[SalesItemsForm] Error loading sales type:', err);
        setSalesType('early-bird');
      }
    };
    
    loadSalesType();
  }, [editingSale, visible, pricingList, findItemInPricingList]);

  useEffect(() => {
    const saveSalesType = async () => {
      try {
        await AsyncStorage.setItem('lastSalesType', salesType);
      } catch (err) {
        console.log('[SalesItemsForm] Error saving sales type:', err);
      }
    };

    saveSalesType();
  }, [salesType]);

  const buildYourOwnItems = useMemo(() => {
    return pricingList?.build_your_own || [];
  }, [pricingList]);

  const handleClose = () => {
    setQuantities({});
    setCosts({});
    setExpandedSections({});
    setCustomSalesAmount('');
    setCustomSalesQuantity('');
    setCustomSalesCost('');
    setCustomSalesName('');
    onClose();
  };

  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
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

  const handleQtyChange = (itemId: string, qty: string) => {
    const numQty = Math.max(0, parseInt(qty) || 0);
    setQuantities((prev) => ({
      ...prev,
      [itemId]: numQty,
    }));

    if (numQty > 0) {
      const item = findItemInPricingList(itemId);
      if (item && item.cost !== undefined && !costs[itemId]) {
        setCosts((prev) => ({
          ...prev,
          [itemId]: item.cost!.toString(),
        }));
      }
    }
  };

  const handleCostChange = (itemId: string, cost: string) => {
    setCosts((prev) => ({
      ...prev,
      [itemId]: cost,
    }));
  };

  const handleSubmit = async () => {
    const itemsToAdd = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, qty]) => {
        const item = findItemInPricingList(itemId);
        return {
          itemId,
          name: item?.name || '',
          quantity: qty,
          unitPrice: item?.price || 0,
        };
      });

    const hasCustomSale = customSalesAmount && parseFloat(customSalesAmount) > 0 && customSalesQuantity && parseInt(customSalesQuantity) > 0;

    if (itemsToAdd.length === 0 && !hasCustomSale) {
      Alert.alert('Error', 'Please enter quantities for at least one item or add a custom sale');
      return;
    }

    setLoading(true);
    try {
      if (editingSale && onUpdateSale) {
        if (editingCustomSale) {
          const amount = parseFloat(customSalesAmount);
          const qty = parseInt(customSalesQuantity);
          const cost = parseFloat(customSalesCost) || 0;
          const itemName = customSalesName.trim() || 'Total Sales';
          await onUpdateSale(editingSale.id, qty, amount, itemName, salesType, cost);
        } else {
          const item = itemsToAdd[0];
          const cost = parseFloat(costs[item.itemId]) || 0;
          await onUpdateSale(editingSale.id, item.quantity, item.unitPrice, item.name, salesType, cost);
        }
      } else {
        if (hasCustomSale) {
          const amount = parseFloat(customSalesAmount);
          const qty = parseInt(customSalesQuantity);
          const cost = parseFloat(customSalesCost) || 0;
          const itemName = customSalesName.trim() || 'Total Sales';
          await onAddSale(qty, amount, itemName, salesType, cost);
        }
        
        for (const item of itemsToAdd) {
          const cost = parseFloat(costs[item.itemId]) || 0;
          await onAddSale(item.quantity, item.unitPrice, item.name, salesType, cost);
        }
      }
      handleClose();
    } catch (err: any) {
      console.log('[SalesItemsForm] Error:', err);
      Alert.alert('Error', editingSale ? 'Failed to update sale' : 'Failed to add sales');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editingSale || !onDeleteSale) return;
    
    Alert.alert(
      'Delete Sale?',
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await onDeleteSale(editingSale.id);
              onClose();
            } catch {
              Alert.alert('Error', 'Failed to delete sale');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderSection = (title: string, sectionKey: string, items: any[]) => {
    const isExpanded = expandedSections[sectionKey] ?? false;
    const sortedItems = sortItemsAlphabetic(items);

    return (
      <View style={styles.section}>
        <Pressable
          style={styles.sectionHeader}
          onPress={() => toggleSection(sectionKey)}
          hitSlop={8}
        >
          <Text style={styles.sectionTitle}>{title}</Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color="#666"
            style={styles.chevron}
          />
        </Pressable>

        {isExpanded && sortedItems.length > 0 && (
          <View>
            {sortedItems.map((item) => (
              <View key={item.id}>
                <View style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                  </View>
                  <View style={styles.qtyContainer}>
                    <Pressable
                      style={styles.qtyButton}
                      onPress={() => handleQtyChange(item.id, Math.max(0, (quantities[item.id] || 0) - 1).toString())}
                      disabled={loading || (quantities[item.id] || 0) <= 0}
                    >
                      <Ionicons name="remove" size={18} color={(quantities[item.id] || 0) <= 0 ? '#ccc' : '#0066cc'} />
                    </Pressable>
                    <TextInput
                      style={styles.qtyInput}
                      placeholder="0"
                      keyboardType="number-pad"
                      value={quantities[item.id]?.toString() || ''}
                      onChangeText={(text) => handleQtyChange(item.id, text)}
                      editable={!loading}
                      maxLength={3}
                    />
                    <Pressable
                      style={styles.qtyButton}
                      onPress={() => handleQtyChange(item.id, ((quantities[item.id] || 0) + 1).toString())}
                      disabled={loading}
                    >
                      <Ionicons name="add" size={18} color="#0066cc" />
                    </Pressable>
                  </View>
                </View>
                {quantities[item.id] > 0 && (
                  <View style={styles.costInputRow}>
                    <Text style={styles.costLabel}>Production Cost Per Item</Text>
                    <View style={styles.costInputContainer}>
                      <Text style={styles.costCurrency}>$</Text>
                      <TextInput
                        style={styles.costInput}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                        value={costs[item.id] || ''}
                        onChangeText={(text) => handleCostChange(item.id, text)}
                        editable={!loading}
                        maxLength={8}
                      />
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (!pricingList) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <Pressable style={styles.topPressable} onPress={onClose} />
          <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
              <Pressable onPress={handleClose}>
                <Ionicons name="close" size={28} color="#1a1a1a" />
              </Pressable>
              <Text style={styles.headerTitle}>Sales Items</Text>
              <View style={{ width: 28 }} />
            </View>
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Pricing list not found</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Pressable style={styles.topPressable} onPress={handleClose} />
        <View style={styles.container}>
          <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
            <Pressable onPress={handleClose} disabled={loading}>
              <Ionicons name="close" size={28} color="#1a1a1a" />
            </Pressable>
            <Text style={styles.headerTitle}>Sales Items</Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionLabel}>Sale Type</Text>
              <View style={styles.selectionGroup}>
                <Pressable
                  style={[
                    styles.selectionButton,
                    salesType === 'early-bird' && styles.selectionButtonActive,
                  ]}
                  onPress={() => setSalesType('early-bird')}
                >
                  <Ionicons
                    name={salesType === 'early-bird' ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={salesType === 'early-bird' ? '#0066cc' : '#ccc'}
                  />
                  <Text
                    style={[
                      styles.selectionButtonText,
                      salesType === 'early-bird' && styles.selectionButtonTextActive,
                    ]}
                  >
                    Early Bird Sales
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.selectionButton,
                    salesType === 'regular' && styles.selectionButtonActive,
                  ]}
                  onPress={() => setSalesType('regular')}
                >
                  <Ionicons
                    name={salesType === 'regular' ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={salesType === 'regular' ? '#0066cc' : '#ccc'}
                  />
                  <Text
                    style={[
                      styles.selectionButtonText,
                      salesType === 'regular' && styles.selectionButtonTextActive,
                    ]}
                  >
                    Regular Sales
                  </Text>
                </Pressable>
              </View>
            </View>

            {(!editingSale || editingCustomSale) && (
              <View style={styles.customSalesSection}>
                <Text style={styles.customSalesTitle}>Custom Sale</Text>
                <View style={styles.customSalesNameRow}>
                  <Text style={styles.customSalesLabel}>Item Name (optional)</Text>
                  <TextInput
                    style={styles.customSalesNameInput}
                    placeholder="Total Sales"
                    value={customSalesName}
                    onChangeText={setCustomSalesName}
                    editable={!loading}
                    maxLength={50}
                  />
                </View>
                <View style={styles.customSalesRow}>
                  <View style={styles.customSalesInputGroup}>
                    <Text style={styles.customSalesLabel}>Amount</Text>
                    <View style={styles.customSalesInputContainer}>
                      <Text style={styles.customSalesCurrency}>$</Text>
                      <TextInput
                        style={styles.customSalesInput}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                        value={customSalesAmount}
                        onChangeText={setCustomSalesAmount}
                        editable={!loading}
                        maxLength={8}
                      />
                    </View>
                  </View>
                  <View style={styles.customSalesInputGroup}>
                    <Text style={styles.customSalesLabel}>Qty</Text>
                    <View style={styles.customQtyContainer}>
                      <Pressable
                        style={styles.customQtyButton}
                        onPress={() => {
                          const current = parseInt(customSalesQuantity) || 0;
                          if (current > 0) setCustomSalesQuantity((current - 1).toString());
                        }}
                        disabled={loading || (parseInt(customSalesQuantity) || 0) <= 0}
                      >
                        <Ionicons name="remove" size={18} color={(parseInt(customSalesQuantity) || 0) <= 0 ? '#ccc' : '#0066cc'} />
                      </Pressable>
                      <TextInput
                        style={styles.customSalesQtyInputField}
                        placeholder="0"
                        keyboardType="number-pad"
                        value={customSalesQuantity}
                        onChangeText={setCustomSalesQuantity}
                        editable={!loading}
                        maxLength={3}
                      />
                      <Pressable
                        style={styles.customQtyButton}
                        onPress={() => {
                          const current = parseInt(customSalesQuantity) || 0;
                          setCustomSalesQuantity((current + 1).toString());
                        }}
                        disabled={loading}
                      >
                        <Ionicons name="add" size={18} color="#0066cc" />
                      </Pressable>
                    </View>
                  </View>
                </View>
                {customSalesAmount && parseFloat(customSalesAmount) > 0 && customSalesQuantity && parseInt(customSalesQuantity) > 0 && (
                  <View style={styles.customSalesCostRow}>
                    <Text style={styles.costLabel}>Production Cost Per Item</Text>
                    <View style={styles.costInputContainer}>
                      <Text style={styles.costCurrency}>$</Text>
                      <TextInput
                        style={styles.costInput}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                        value={customSalesCost}
                        onChangeText={setCustomSalesCost}
                        editable={!loading}
                        maxLength={8}
                      />
                    </View>
                  </View>
                )}
              </View>
            )}

            {!editingCustomSale && pricingList.digital_packages && pricingList.digital_packages.length > 0 &&
              renderSection('Digital Packages', 'digital_packages', pricingList.digital_packages)}
            {!editingCustomSale && pricingList.packages && pricingList.packages.length > 0 &&
              renderSection('Print Packages', 'packages', pricingList.packages)}
            {!editingCustomSale && buildYourOwnItems.length > 0 &&
              renderSection('Build Your Own', 'build_your_own_packages', buildYourOwnItems)}
            {!editingCustomSale && pricingList.ala_carte && pricingList.ala_carte.length > 0 &&
              renderSection('A La Carte', 'ala_carte', pricingList.ala_carte)}
            {!editingCustomSale && (pricingList.wall_portraits || (pricingList as any).wall_portrait) && (pricingList.wall_portraits || (pricingList as any).wall_portrait)?.length > 0 &&
              renderSection('Wall Portraits', 'wall_portraits', pricingList.wall_portraits || (pricingList as any).wall_portrait || [])}
            {!editingCustomSale && pricingList.specialty_items && pricingList.specialty_items.length > 0 &&
              renderSection('Specialty Items', 'specialty_items', pricingList.specialty_items)}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
            {editingSale && (
              <Pressable
                style={[styles.deleteButton, loading && styles.addButtonDisabled]}
                onPress={handleDelete}
                disabled={loading}
              >
                <Ionicons name="trash" size={24} color="white" />
              </Pressable>
            )}
            <Pressable
              style={[
                styles.addButton,
                loading && styles.addButtonDisabled,
                editingSale && styles.addButtonWithDelete,
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.addButtonText}>
                {loading ? (editingSale ? 'Updating...' : 'Adding...') : (editingSale ? 'Update' : 'Add All')}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  topPressable: {
    minHeight: 44,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flexDirection: 'column',
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
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
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  chevron: {
    marginLeft: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 13,
    color: '#666',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  qtyButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  qtyInput: {
    width: 44,
    paddingHorizontal: 4,
    paddingVertical: 8,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    backgroundColor: '#f5f5f5',
  },
  costInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  costLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    flex: 1,
  },
  costInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 8,
    height: 32,
    width: 100,
    justifyContent: 'flex-end',
  },
  costCurrency: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 2,
  },
  costInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    padding: 0,
    textAlign: 'right',
  },
  footer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#0066cc',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    flex: 1,
  },
  addButtonWithDelete: {
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  sectionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  selectionGroup: {
    gap: 12,
  },
  selectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: 'white',
    gap: 10,
  },
  selectionButtonActive: {
    backgroundColor: '#f0f7ff',
    borderColor: '#0066cc',
  },
  selectionButtonText: {
    fontSize: 14,
    color: '#666',
  },
  selectionButtonTextActive: {
    color: '#0066cc',
    fontWeight: '600',
  },
  customSalesSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 16,
    marginBottom: 12,
  },
  customSalesTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  customSalesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  customSalesInputGroup: {
    flex: 1,
  },
  customSalesLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    marginBottom: 6,
  },
  customSalesInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
    height: 44,
  },
  customSalesCurrency: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 4,
  },
  customSalesInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    padding: 0,
  },
  customQtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
    height: 44,
  },
  customQtyButton: {
    width: 40,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  customSalesQtyInputField: {
    flex: 1,
    paddingHorizontal: 4,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    backgroundColor: '#f5f5f5',
  },
  customSalesCostRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  customSalesNameRow: {
    marginBottom: 12,
  },
  customSalesNameInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
});
