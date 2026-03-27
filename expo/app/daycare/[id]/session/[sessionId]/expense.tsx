import { useState, useMemo, useLayoutEffect, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useData } from '@/context/DataContext';
import { Ionicons } from '@expo/vector-icons';
import { calculateSessionGrandTotal, calculateSessionProductionCost, calculateSessionTotalExpenses, ExpenseData } from '@/utils/salesCalculator';

export default function SessionExpensesScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { id: daycareId, sessionId } = useLocalSearchParams<{ id: string; sessionId: string }>();
  const { daycares, sessions: allSessions, sales, expenses, addExpense, deleteExpense } = useData();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [photographerCost, setPhotographerCost] = useState(0);

  const daycare = daycares.find((d) => d.id === daycareId);
  const session = allSessions.find((s) => s.id === sessionId);

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
            <Text style={{ fontSize: 18, fontWeight: '600', color: 'white' }}>Expenses</Text>
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
        headerBackVisible: false,
      });
    }
  }, [navigation, daycare, session]);

  const sessionSales = useMemo(() => {
    return sales.filter((s) => s.session_id === sessionId);
  }, [sales, sessionId]);

  const grandSalesTotal = session ? calculateSessionGrandTotal(sessionSales, session, 0.06) : 0;

  const productionCost = calculateSessionProductionCost(sessionSales);
  const shippingExpense = session?.shipping || 0;

  const daycareExpenses = useMemo(() => {
    return expenses.filter((e) => e.daycare_id === daycareId);
  }, [expenses, daycareId]);

  const totalDaycareExpenses = daycareExpenses.reduce((sum, e) => sum + e.amount, 0);

  const expenseData: ExpenseData = useMemo(() => ({
    daycareExpenses: totalDaycareExpenses,
    photographerCost,
  }), [totalDaycareExpenses, photographerCost]);

  const totalExpenses = session ? calculateSessionTotalExpenses(sessionSales, session, expenseData) : 0;

  const handleAddExpense = async () => {
    if (!description.trim() || !amount.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      await addExpense({
        daycare_id: daycareId || '',
        description: description.trim(),
        amount: parsedAmount,
        date: new Date().toISOString().split('T')[0],
      });
      setDescription('');
      setAmount('');
    } catch {
      Alert.alert('Error', 'Failed to add expense');
    }
  };

  const handleDeleteExpense = (id: string) => {
    Alert.alert('Delete Expense', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteExpense(id);
          } catch {
            Alert.alert('Error', 'Failed to delete expense');
          }
        },
      },
    ]);
  };

  if (!daycare || !session) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Session not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <View style={styles.grandSalesTotalCard}>
        <Text style={styles.grandSalesTotalLabel}>Grand Sales Total</Text>
        <Text style={styles.grandSalesTotalAmount}>${grandSalesTotal.toFixed(2)}</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.addExpenseSection}>
          <View style={styles.sectionHeaderRow}>
            <Pressable style={styles.addSectionButton} onPress={handleAddExpense}>
              <Text style={styles.addSectionButtonText}>Add Expense +</Text>
            </Pressable>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Expense description"
            placeholderTextColor="#999"
            value={description}
            onChangeText={setDescription}
          />
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
          </View>
        </View>

        <View style={styles.expensesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Expenses</Text>
            {daycareExpenses.length > 0 && (
              <Text style={styles.expenseCount}>{daycareExpenses.length}</Text>
            )}
          </View>

          {daycareExpenses.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt" size={40} color="#ccc" />
              <Text style={styles.emptyText}>No expenses yet</Text>
            </View>
          ) : (
            <View style={styles.expensesList}>
              {daycareExpenses.map((expense) => (
                <View key={expense.id} style={styles.expenseItem}>
                  <View style={styles.expenseContent}>
                    <Text style={styles.expenseDescription}>{expense.description}</Text>
                    <Text style={styles.expenseDate}>{expense.date}</Text>
                  </View>
                  <View style={styles.expenseActions}>
                    <Text style={styles.expenseAmount}>${expense.amount.toFixed(2)}</Text>
                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => handleDeleteExpense(expense.id)}
                    >
                      <Ionicons name="close" size={16} color="white" />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}

          {daycareExpenses.length > 0 && (
            <>
              <View style={styles.totalDaycareExpensesRow}>
                <Text style={styles.totalLabel}>Subtotal (Daycare Expenses)</Text>
                <Text style={styles.totalAmount}>${totalDaycareExpenses.toFixed(2)}</Text>
              </View>
              <View style={styles.productionCostRow}>
                <Text style={styles.productionCostRowLabel}>Production Cost</Text>
                <Text style={styles.productionCostRowAmount}>${productionCost.toFixed(2)}</Text>
              </View>
              <View style={styles.shippingExpenseRow}>
                <Text style={styles.shippingExpenseRowLabel}>Shipping</Text>
                <Text style={styles.shippingExpenseRowAmount}>${shippingExpense.toFixed(2)}</Text>
              </View>
              <View style={styles.photographerCostRow}>
                <Text style={styles.photographerCostRowLabel}>Photographer</Text>
                <Text style={styles.photographerCostRowAmount}>${photographerCost.toFixed(2)}</Text>
              </View>
              <View style={styles.totalExpensesRow}>
                <Text style={styles.totalLabel}>Total Expenses (All)</Text>
                <Text style={styles.totalAmount}>${totalExpenses.toFixed(2)}</Text>
              </View>
            </>
          )}
          {daycareExpenses.length === 0 && (productionCost > 0 || shippingExpense > 0 || photographerCost > 0) && (
            <>
              <View style={styles.productionCostRow}>
                <Text style={styles.productionCostRowLabel}>Production Cost</Text>
                <Text style={styles.productionCostRowAmount}>${productionCost.toFixed(2)}</Text>
              </View>
              <View style={styles.shippingExpenseRow}>
                <Text style={styles.shippingExpenseRowLabel}>Shipping</Text>
                <Text style={styles.shippingExpenseRowAmount}>${shippingExpense.toFixed(2)}</Text>
              </View>
              <View style={styles.photographerCostRow}>
                <Text style={styles.photographerCostRowLabel}>Photographer</Text>
                <Text style={styles.photographerCostRowAmount}>${photographerCost.toFixed(2)}</Text>
              </View>
              <View style={styles.totalExpensesRow}>
                <Text style={styles.totalLabel}>Total Expenses (All)</Text>
                <Text style={styles.totalAmount}>${totalExpenses.toFixed(2)}</Text>
              </View>
            </>
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
        <Pressable
          style={styles.footerButton}
          onPress={() => router.push(`/daycare/${daycareId}/session/${sessionId}/sales` as any)}
        >
          <Ionicons name="cash" size={24} color="white" />
          <Text style={styles.footerButtonText}>Sales</Text>
        </Pressable>
        <Pressable style={[styles.footerButton, styles.footerButtonActive]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  grandSalesTotalCard: {
    backgroundColor: '#0066cc',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grandSalesTotalLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'white',
    marginBottom: 6,
  },
  grandSalesTotalAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  productionCostRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 0,
  },
  productionCostRowLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ff9500',
    flex: 1,
    marginRight: 0,
  },
  productionCostRowAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ff9500',
  },
  shippingExpenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 8,
  },
  shippingExpenseRowLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8b5cf6',
    flex: 1,
    marginRight: 0,
  },
  shippingExpenseRowAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  photographerCostRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 8,
  },
  photographerCostRowLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
    flex: 1,
    marginRight: 0,
  },
  photographerCostRowAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  addExpenseSection: {
    backgroundColor: '#d0d0d0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#b0b0b0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 12,
  },
  addSectionButton: {
    backgroundColor: '#0066cc',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addSectionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1a1a1a',
    marginBottom: 12,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
    padding: 0,
  },

  expensesSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  expenseCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066cc',
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  expensesList: {
    gap: 10,
  },
  expenseItem: {
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
  expenseContent: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 12,
    color: '#999',
  },
  expenseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  expenseAmount: {
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
  totalDaycareExpensesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 12,
  },
  totalExpensesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 0,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0066cc',
  },
  footer: {
    backgroundColor: '#065f46',
    borderTopWidth: 1,
    borderTopColor: '#064e3b',
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
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
});
