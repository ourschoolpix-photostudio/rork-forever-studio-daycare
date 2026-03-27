import { useState, useMemo, useLayoutEffect, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useData, type Sale } from '@/context/DataContext';
import { Ionicons } from '@expo/vector-icons';
import { calculateTotalSheets } from '@/utils/sheetCalculator';

import SalesItemsForm from '@/components/SalesItemsForm';
import { generateInvoicePDF } from '@/utils/invoiceGenerator';

const TYPE_ORDER: Record<string, number> = {
  'custom': 0,
  'digital_packages': 1,
  'print_packages': 2,
  'build_your_own': 3,
  'ala_carte': 4,
  'wall_portraits': 5,
  'specialty_items': 6,
};

export default function SessionSalesScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { id: daycareId, sessionId } = useLocalSearchParams<{ id: string; sessionId: string }>();
  const { daycares, sessions: allSessions, sales, deleteSale, pricingLists, saveSessionDiscount, saveClassGrossSales, addSessionSale, updateSale, expenses } = useData();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNumPhotographed, setEditingNumPhotographed] = useState(false);
  const [editingNumSales, setEditingNumSales] = useState(false);
  const [editingEarlyBirdDiscount, setEditingEarlyBirdDiscount] = useState(false);
  const [editingRegularDiscount, setEditingRegularDiscount] = useState(false);
  const [editingShipping, setEditingShipping] = useState(false);
  const [numPhotographedInput, setNumPhotographedInput] = useState('');
  const [numSalesInput, setNumSalesInput] = useState('');
  const [earlyBirdDiscountInput, setEarlyBirdDiscountInput] = useState('');
  const [regularDiscountInput, setRegularDiscountInput] = useState('');
  const [shippingInput, setShippingInput] = useState('');
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editingClassSales, setEditingClassSales] = useState<Record<string, boolean>>({});
  const [classGrossSalesInputs, setClassGrossSalesInputs] = useState<Record<string, string>>({});
  const [photographerCost, setPhotographerCost] = useState(0);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const daycare = daycares.find((d) => d.id === daycareId);
  const session = allSessions.find((s) => s.id === sessionId);

  const daycareExpenses = useMemo(() => {
    return expenses.filter((e) => e.daycare_id === daycareId);
  }, [expenses, daycareId]);

  useEffect(() => {
    const loadPhotographerCost = async () => {
      try {
        const saved = await AsyncStorage.getItem('app_auto_expense');
        if (saved) {
          const settings = JSON.parse(saved);
          const cost = parseFloat(settings.photographerCost) || 0;
          setPhotographerCost(cost);
        }
      } catch (err) {
        console.error('Failed to load photographer cost:', err);
      }
    };
    loadPhotographerCost();
  }, []);

  useLayoutEffect(() => {
    if (daycare && session) {
      navigation.setOptions({
        headerTitle: () => (
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: 'white' }}>Sales</Text>
            <Text style={{ fontSize: 14, fontWeight: '500', color: 'white', marginTop: 2 }}>{daycare.name}</Text>
            <Text style={{ fontSize: 12, fontWeight: '400', color: 'rgba(255,255,255,0.9)', marginTop: 1 }}>
              {session.account_number || 'No Account #'}
            </Text>
          </View>
        ),
        headerStyle: {
          backgroundColor: '#065f46',
          height: 110,
        },
        headerTintColor: 'white',
        headerLeft: () => null,
      });
    }
  }, [navigation, daycare, session]);

  const pricingList = useMemo(() => {
    if (!session?.pricing_list_id) return null;
    return pricingLists.find((p) => p.id === session.pricing_list_id);
  }, [session, pricingLists]);

  const sessionSales = useMemo(() => {
    return sales.filter((s) => s.session_id === sessionId)
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  }, [sales, sessionId]);

  const getItemType = useCallback((itemName: string): string => {
    if (!pricingList) return 'custom';
    
    const digitalPackage = (pricingList.digital_packages || []).find(item => item.name === itemName);
    if (digitalPackage) return 'digital_packages';
    
    const printPackage = (pricingList.packages || []).find(item => item.name === itemName);
    if (printPackage) return 'print_packages';
    
    const buildYourOwn = (pricingList.build_your_own || []).find(item => item.name === itemName);
    if (buildYourOwn) return 'build_your_own';
    
    const alaCarte = (pricingList.ala_carte || []).find(item => item.name === itemName);
    if (alaCarte) return 'ala_carte';
    
    const wallPortrait = (pricingList.wall_portraits || []).find(item => item.name === itemName);
    if (wallPortrait) return 'wall_portraits';
    
    const specialtyItem = (pricingList.specialty_items || []).find(item => item.name === itemName);
    if (specialtyItem) return 'specialty_items';
    
    return 'custom';
  }, [pricingList]);

  const sortSalesByTypeAndName = useCallback((salesToSort: Sale[]) => {
    return [...salesToSort].sort((a, b) => {
      const typeA = getItemType(a.item_name || '');
      const typeB = getItemType(b.item_name || '');
      
      const typeOrderA = TYPE_ORDER[typeA] ?? 99;
      const typeOrderB = TYPE_ORDER[typeB] ?? 99;
      
      if (typeOrderA !== typeOrderB) {
        return typeOrderA - typeOrderB;
      }
      
      const nameA = (a.item_name || '').toLowerCase().trim();
      const nameB = (b.item_name || '').toLowerCase().trim();
      return nameA.localeCompare(nameB, undefined, { numeric: true });
    });
  }, [getItemType]);

  const earlyBirdSales = useMemo(() => {
    return sortSalesByTypeAndName(sessionSales.filter(s => s.type === 'early-bird'));
  }, [sessionSales, sortSalesByTypeAndName]);

  const regularSales = useMemo(() => {
    return sortSalesByTypeAndName(sessionSales.filter(s => s.type === 'regular'));
  }, [sessionSales, sortSalesByTypeAndName]);

  const allSales = useMemo(() => {
    return [...earlyBirdSales, ...regularSales];
  }, [earlyBirdSales, regularSales]);

  const subtotal = allSales.reduce((sum, sale) => sum + (sale.total_price || 0), 0);
  const tax = subtotal * 0.06;
  const shipping = session?.shipping || 0;
  const earlyBirdDiscount = session?.early_bird_discount || 0;
  const otherDiscount = session?.regular_discount || 0;
  const grandTotal = subtotal + tax + shipping - earlyBirdDiscount - otherDiscount;

  const handleDeleteSale = (saleId: string, itemName?: string) => {
    Alert.alert('Delete Sale', `Remove "${itemName || 'this item'}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSale(saleId);
          } catch {
            Alert.alert('Error', 'Failed to delete sale');
          }
        },
      },
    ]);
  };

  const handleSaveNumPhotographed = async () => {
    if (!sessionId) return;
    const num = parseInt(numPhotographedInput) || 0;
    try {
      await saveSessionDiscount(sessionId, 'number_photographed', num);
      setEditingNumPhotographed(false);
    } catch {
      Alert.alert('Error', 'Failed to save number photographed');
    }
  };

  const handleSaveNumSales = async () => {
    if (!sessionId) return;
    const num = parseInt(numSalesInput) || 0;
    try {
      await saveSessionDiscount(sessionId, 'number_of_sales', num);
      setEditingNumSales(false);
    } catch {
      Alert.alert('Error', 'Failed to save number of sales');
    }
  };

  const handleSaveEarlyBirdDiscount = async () => {
    if (!sessionId) return;
    const discount = parseFloat(earlyBirdDiscountInput) || 0;
    try {
      await saveSessionDiscount(sessionId, 'early-bird', discount);
      setEditingEarlyBirdDiscount(false);
    } catch {
      Alert.alert('Error', 'Failed to save discount');
    }
  };

  const handleSaveRegularDiscount = async () => {
    if (!sessionId) return;
    const discount = parseFloat(regularDiscountInput) || 0;
    try {
      await saveSessionDiscount(sessionId, 'regular', discount);
      setEditingRegularDiscount(false);
    } catch {
      Alert.alert('Error', 'Failed to save discount');
    }
  };

  const startEditNumPhotographed = () => {
    setNumPhotographedInput(session?.number_photographed?.toString() || '0');
    setEditingNumPhotographed(true);
  };

  const startEditNumSales = () => {
    setNumSalesInput(session?.number_of_sales?.toString() || '0');
    setEditingNumSales(true);
  };

  const startEditEarlyBirdDiscount = () => {
    setEarlyBirdDiscountInput(session?.early_bird_discount?.toString() || '0');
    setEditingEarlyBirdDiscount(true);
  };

  const startEditRegularDiscount = () => {
    setRegularDiscountInput(session?.regular_discount?.toString() || '0');
    setEditingRegularDiscount(true);
  };

  const handleSaveShipping = async () => {
    if (!sessionId) return;
    const amount = parseFloat(shippingInput) || 0;
    try {
      await saveSessionDiscount(sessionId, 'shipping', amount);
      setEditingShipping(false);
    } catch {
      Alert.alert('Error', 'Failed to save shipping');
    }
  };

  const startEditShipping = () => {
    setShippingInput(session?.shipping?.toString() || '0');
    setEditingShipping(true);
  };

  const parseClassNames = (classesMemo: string | undefined): string[] => {
    if (!classesMemo) return [];
    return classesMemo
      .split(/[,\n]+/)
      .map(c => c.trim())
      .filter(c => c.length > 0);
  };

  const classNames = useMemo(() => parseClassNames(daycare?.classes_memo), [daycare?.classes_memo]);

  const totalClassGrossSales = useMemo(() => {
    if (!session?.class_gross_sales) return 0;
    return Object.values(session.class_gross_sales).reduce((sum, val) => sum + (val || 0), 0);
  }, [session?.class_gross_sales]);

  const startEditClassGrossSales = (className: string) => {
    const currentValue = session?.class_gross_sales?.[className] || 0;
    setClassGrossSalesInputs(prev => ({ ...prev, [className]: currentValue > 0 ? currentValue.toString() : '' }));
    setEditingClassSales(prev => ({ ...prev, [className]: true }));
  };

  const handleSaveClassGrossSales = async (className: string) => {
    if (!sessionId) return;
    const amount = parseFloat(classGrossSalesInputs[className]) || 0;
    try {
      await saveClassGrossSales(sessionId, className, amount);
      setEditingClassSales(prev => ({ ...prev, [className]: false }));
    } catch {
      Alert.alert('Error', 'Failed to save class gross sales');
    }
  };

  const findItemInPricingList = (itemName: string) => {
    if (!pricingList) return null;
    
    const allItems = [
      ...(pricingList.packages || []),
      ...(pricingList.digital_packages || []),
      ...(pricingList.wall_portraits || []),
      ...(pricingList.ala_carte || []),
      ...(pricingList.specialty_items || []),
      ...(pricingList.build_your_own || []),
    ];
    
    return allItems.find(item => item.name === itemName);
  };

  const calculateSaleSheets = (sale: Sale) => {
    const item = findItemInPricingList(sale.item_name || '');
    if (!item) return '0';
    
    const itemSheets = calculateTotalSheets(
      (item as any).sheetSizes,
      (item as any).numberOfPoses,
      (item as any).type
    );
    
    const totalSheets = parseFloat(itemSheets) * sale.quantity;
    return Number.isInteger(totalSheets) ? totalSheets.toString() : totalSheets.toFixed(1);
  };

  const handleEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setShowAddModal(true);
  };

  const handleGenerateInvoice = async () => {
    if (!daycare || !session) return;
    
    setGeneratingPDF(true);
    try {
      await generateInvoicePDF({
        daycare,
        session,
        sales: allSales,
        expenses: daycareExpenses,
        photographerCost,
      });
    } catch (error) {
      console.error('Error generating invoice:', error);
      Alert.alert('Error', 'Failed to generate invoice PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const renderSaleItem = (sale: Sale) => {
    const sheets = calculateSaleSheets(sale);
    
    return (
      <Pressable 
        key={sale.id} 
        style={styles.saleItem}
        onPress={() => handleEditSale(sale)}
      >
        <View style={styles.saleContent}>
          <Text style={styles.saleName}>{sale.item_name || 'Sale Item'}</Text>
          <View style={styles.saleDetails}>
            <Text style={styles.saleQuantity}>Qty: {sale.quantity}</Text>
            <Text style={styles.salePrice}>${sale.unit_price.toFixed(2)} ea</Text>
            {parseFloat(sheets) > 0 && (
              <Text style={styles.saleSheets}>Sheets: {sheets}</Text>
            )}
          </View>
        </View>
        <View style={styles.saleActions}>
          <Text style={styles.saleTotal}>${sale.total_price.toFixed(2)}</Text>
          <Pressable
            style={styles.deleteButton}
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteSale(sale.id, sale.item_name);
            }}
          >
            <Ionicons name="close" size={16} color="white" />
          </Pressable>
        </View>
      </Pressable>
    );
  };

  if (!daycare || !session) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Session not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 110 : 0}
    >

      <View style={styles.statsRow}>
        <Pressable 
          style={styles.statCard} 
          onPress={startEditNumPhotographed}
        >
          <Ionicons name="camera" size={20} color="#0066cc" />
          <Text style={styles.statLabel}>Photographed</Text>
          {editingNumPhotographed ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.editInput}
                value={numPhotographedInput}
                onChangeText={setNumPhotographedInput}
                keyboardType="number-pad"
                autoFocus
              />
              <Pressable style={styles.saveButton} onPress={handleSaveNumPhotographed}>
                <Ionicons name="checkmark" size={16} color="white" />
              </Pressable>
            </View>
          ) : (
            <Text style={styles.statValue}>{session.number_photographed || 0}</Text>
          )}
        </Pressable>

        <View style={styles.grandTotalCard}>
          <Ionicons name="cash" size={18} color="white" />
          <Text style={styles.statLabelWhite}>Grand Total</Text>
          <Text style={styles.grandTotalValue}>${grandTotal.toFixed(2)}</Text>
        </View>

        <Pressable 
          style={styles.statCard} 
          onPress={startEditNumSales}
        >
          <Ionicons name="cart" size={20} color="#16a34a" />
          <Text style={styles.statLabel}>Sales</Text>
          {editingNumSales ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.editInput}
                value={numSalesInput}
                onChangeText={setNumSalesInput}
                keyboardType="number-pad"
                autoFocus
              />
              <Pressable style={styles.saveButton} onPress={handleSaveNumSales}>
                <Ionicons name="checkmark" size={16} color="white" />
              </Pressable>
            </View>
          ) : (
            <Text style={styles.statValue}>{session.number_of_sales || 0}</Text>
          )}
        </Pressable>
      </View>

      <ScrollView style={styles.content}>

        <View style={styles.salesSection}>
          <View style={styles.sectionHeader}>
            <Pressable 
              style={styles.addButton} 
              onPress={() => {
                setEditingSale(null);
                setShowAddModal(true);
              }}
            >
              <Text style={styles.addButtonText}>Add Sales+</Text>
            </Pressable>
            <Pressable 
              style={({ pressed }) => [
                styles.invoiceButton, 
                generatingPDF && styles.invoiceButtonDisabled,
                pressed && !generatingPDF && styles.invoiceButtonPressed
              ]} 
              onPress={handleGenerateInvoice}
              disabled={generatingPDF}
            >
              {generatingPDF ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="document-text" size={16} color="white" />
                  <Text style={styles.invoiceButtonText}>Invoice</Text>
                </>
              )}
            </Pressable>
          </View>

          {allSales.length === 0 && earlyBirdDiscount === 0 && otherDiscount === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No sales yet</Text>
            </View>
          ) : (
            <View style={styles.salesList}>
              {allSales.length === 0 && (earlyBirdDiscount > 0 || otherDiscount > 0) && (
                <View style={styles.warningBox}>
                  <Ionicons name="warning" size={20} color="#dc2626" />
                  <Text style={styles.warningText}>
                    There are no sales items but discounts are applied. Zero out the discounts below to fix the negative total.
                  </Text>
                </View>
              )}
              {earlyBirdSales.length > 0 && (
                <View style={styles.separator}>
                  <Text style={styles.separatorText}>Early Bird Sales</Text>
                </View>
              )}
              {earlyBirdSales.map(renderSaleItem)}
              {regularSales.length > 0 && (
                <View style={styles.separator}>
                  <Text style={styles.separatorText}>Regular Sales</Text>
                </View>
              )}
              {regularSales.map(renderSaleItem)}
              <View style={styles.summaryBox}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tax (6%)</Text>
                  <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
                </View>
                <Pressable 
                  style={styles.summaryRow} 
                  onPress={startEditShipping}
                >
                  <Text style={styles.summaryLabel}>Shipping</Text>
                  {editingShipping ? (
                    <View style={styles.editRow}>
                      <Text style={styles.currencySymbol}>$</Text>
                      <TextInput
                        style={styles.editInput}
                        value={shippingInput}
                        onChangeText={setShippingInput}
                        keyboardType="decimal-pad"
                        autoFocus
                      />
                      <Pressable style={styles.saveButton} onPress={handleSaveShipping}>
                        <Ionicons name="checkmark" size={16} color="white" />
                      </Pressable>
                    </View>
                  ) : (
                    <Text style={styles.summaryValue}>${shipping.toFixed(2)}</Text>
                  )}
                </Pressable>
                <Pressable 
                  style={styles.summaryRow} 
                  onPress={startEditEarlyBirdDiscount}
                >
                  <Text style={styles.summaryLabel}>Early Bird Discounts</Text>
                  {editingEarlyBirdDiscount ? (
                    <View style={styles.editRow}>
                      <Text style={styles.currencySymbol}>$</Text>
                      <TextInput
                        style={styles.editInput}
                        value={earlyBirdDiscountInput}
                        onChangeText={setEarlyBirdDiscountInput}
                        keyboardType="decimal-pad"
                        autoFocus
                      />
                      <Pressable style={styles.saveButton} onPress={handleSaveEarlyBirdDiscount}>
                        <Ionicons name="checkmark" size={16} color="white" />
                      </Pressable>
                    </View>
                  ) : (
                    <Text style={styles.summaryValueDiscount}>-${earlyBirdDiscount.toFixed(2)}</Text>
                  )}
                </Pressable>
                <Pressable 
                  style={styles.summaryRow} 
                  onPress={startEditRegularDiscount}
                >
                  <Text style={styles.summaryLabel}>Other Discounts</Text>
                  {editingRegularDiscount ? (
                    <View style={styles.editRow}>
                      <Text style={styles.currencySymbol}>$</Text>
                      <TextInput
                        style={styles.editInput}
                        value={regularDiscountInput}
                        onChangeText={setRegularDiscountInput}
                        keyboardType="decimal-pad"
                        autoFocus
                      />
                      <Pressable style={styles.saveButton} onPress={handleSaveRegularDiscount}>
                        <Ionicons name="checkmark" size={16} color="white" />
                      </Pressable>
                    </View>
                  ) : (
                    <Text style={styles.summaryValueDiscount}>-${otherDiscount.toFixed(2)}</Text>
                  )}
                </Pressable>
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>${grandTotal.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.classesSection}>
          <View style={styles.classesTitleRow}>
            <Text style={styles.classesSectionTitle}>Class Gross Sales</Text>
            <Text style={styles.classTotalValue}>${totalClassGrossSales.toFixed(2)}</Text>
          </View>
          <Text style={styles.classesSubtitle}>For informational purposes only</Text>
          {classNames.length > 0 ? (
            <View style={styles.classCardsList}>
              {classNames.map((className) => (
                <View key={className} style={styles.classCard}>
                  <Text style={styles.classCardName}>{className}</Text>
                  {editingClassSales[className] ? (
                    <View style={styles.classEditRow}>
                      <Text style={styles.currencySymbol}>$</Text>
                      <TextInput
                        style={styles.classEditInput}
                        value={classGrossSalesInputs[className] || ''}
                        onChangeText={(text) => setClassGrossSalesInputs(prev => ({ ...prev, [className]: text }))}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                        autoFocus
                      />
                      <Pressable style={styles.saveButton} onPress={() => handleSaveClassGrossSales(className)}>
                        <Ionicons name="checkmark" size={16} color="white" />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable onPress={() => startEditClassGrossSales(className)}>
                      <Text style={styles.classGrossSalesValue}>
                        ${(session?.class_gross_sales?.[className] || 0).toFixed(2)}
                      </Text>
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.classesEmptyText}>Name of classes have not been entered yet.</Text>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom || 12 }]}>
        <Pressable
          style={styles.footerButton}
          onPress={() => router.push('/(app)/(tabs)')}
        >
          <Ionicons name="home" size={24} color="white" />
          <Text style={styles.footerButtonText}>Home</Text>
        </Pressable>
        <Pressable
          style={styles.footerButton}
          onPress={() => router.push(`/daycare/${daycareId}` as any)}
        >
          <Ionicons name="information-circle" size={24} color="white" />
          <Text style={styles.footerButtonText}>Details</Text>
        </Pressable>
        <Pressable style={[styles.footerButton, styles.footerButtonActive]}>
          <Ionicons name="cash" size={24} color="white" />
          <Text style={styles.footerButtonText}>Sales</Text>
        </Pressable>
        <Pressable
          style={styles.footerButton}
          onPress={() => router.push(`/daycare/${daycareId}/session/${sessionId}/expense` as any)}
        >
          <Ionicons name="receipt" size={24} color="white" />
          <Text style={styles.footerButtonText}>Expenses</Text>
        </Pressable>
        <Pressable
          style={styles.footerButton}
          onPress={() => router.push(`/daycare/${daycareId}/session/${sessionId}/summary` as any)}
        >
          <Ionicons name="stats-chart" size={24} color="white" />
          <Text style={styles.footerButtonText}>Summary</Text>
        </Pressable>
      </View>

      {pricingList && (
        <SalesItemsForm
          visible={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingSale(null);
          }}
          priceCode={pricingList.price_code}
          sessionId={sessionId || ''}
          editingSale={editingSale}
          onAddSale={async (quantity, unitPrice, itemName, salesType, cost) => {
            if (!sessionId) return;
            const newSale = {
              quantity,
              unit_price: unitPrice,
              total_price: quantity * unitPrice,
              type: salesType,
              item_name: itemName,
              cost: cost || 0,
            };
            await addSessionSale(sessionId, newSale);
          }}
          onUpdateSale={async (saleId, quantity, unitPrice, itemName, salesType, cost) => {
            await updateSale(saleId, {
              quantity,
              unit_price: unitPrice,
              total_price: quantity * unitPrice,
              type: salesType,
              item_name: itemName,
              cost: cost || 0,
            });
          }}
          onDeleteSale={async (saleId) => {
            await deleteSale(saleId);
          }}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#f5f5f5',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#003366',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 6,
    marginBottom: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
  statLabelWhite: {
    fontSize: 9,
    color: 'white',
    marginTop: 6,
    marginBottom: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  grandTotalCard: {
    flex: 1,
    backgroundColor: '#0066cc',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
    minWidth: 60,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },

  salesSection: {
    backgroundColor: '#d0d0d0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#b0b0b0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  invoiceButton: {
    backgroundColor: '#0066cc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 90,
    justifyContent: 'center',
  },
  invoiceButtonDisabled: {
    opacity: 0.7,
  },
  invoiceButtonPressed: {
    backgroundColor: '#004c99',
    transform: [{ scale: 0.97 }],
  },
  invoiceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },

  emptyState: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  salesList: {
    gap: 10,
  },
  saleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#0066cc',
  },
  saleContent: {
    flex: 1,
  },
  saleName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  saleDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  saleQuantity: {
    fontSize: 12,
    color: '#666',
  },
  salePrice: {
    fontSize: 12,
    color: '#666',
  },
  saleSheets: {
    fontSize: 12,
    color: '#0066cc',
    fontWeight: '600',
  },
  saleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  saleTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0066cc',
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#666',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  summaryValueDiscount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ff3b30',
  },
  totalRow: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16a34a',
  },
  addButton: {
    backgroundColor: '#16a34a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  footer: {
    backgroundColor: '#065f46',
    borderTopWidth: 1,
    borderTopColor: '#064e3b',
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 8,
  },
  footerButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  footerButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  footerButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
  },
  empty: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 24,
  },
  separator: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#4a4a4a',
    borderRadius: 6,
    marginVertical: 4,
  },
  separatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#991b1b',
    lineHeight: 18,
  },
  classesSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  classesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  classesSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  classTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065f46',
  },
  classesSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  classCardsList: {
    gap: 10,
  },
  classCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  classCardName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  classEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  classEditInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    minWidth: 80,
    textAlign: 'right',
  },
  classGrossSalesValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065f46',
  },
  classesEmptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});
