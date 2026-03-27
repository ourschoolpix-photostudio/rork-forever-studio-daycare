import { useMemo, useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useNavigation, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useData } from '@/context/DataContext';
import { Ionicons } from '@expo/vector-icons';
import { calculateSessionGrandTotal, calculateSessionNetProfit, calculateSessionTotalExpenses } from '@/utils/salesCalculator';

export default function SessionSummaryScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { id: daycareId, sessionId } = useLocalSearchParams<{ id: string; sessionId: string }>();
  const { daycares, sessions: allSessions, sales, expenses } = useData();
  const [numberOfSalesInput, setNumberOfSalesInput] = useState('');
  const [photographerCost, setPhotographerCost] = useState(0);

  const daycare = daycares.find((d) => d.id === daycareId);
  const session = allSessions.find((s) => s.id === sessionId);

  useLayoutEffect(() => {
    if (daycare && session) {
      navigation.setOptions({
        headerTitle: () => (
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: 'white' }}>Summary</Text>
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

  useEffect(() => {
    if (session?.number_of_sales) {
      setNumberOfSalesInput(session.number_of_sales.toFixed(0));
    } else {
      const loadFromStorage = async () => {
        try {
          const stored = await AsyncStorage.getItem(`session_${sessionId}_number_of_sales`);
          if (stored) {
            setNumberOfSalesInput(stored);
          }
        } catch (err) {
          console.log('[SessionSummary] Error loading number of sales:', err);
        }
      };
      loadFromStorage();
    }
  }, [sessionId, session?.number_of_sales]);

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
        console.error('[SessionSummary] Failed to load photographer cost:', err);
      }
    };
    loadPhotographerCost();
  }, []);

  const sessionSales = useMemo(() => {
    return sales.filter((s) => s.session_id === sessionId);
  }, [sales, sessionId]);

  const grandSalesTotal = session ? calculateSessionGrandTotal(sessionSales, session, 0.06) : 0;

  const daycareExpenses = useMemo(() => {
    return expenses.filter((e) => e.daycare_id === daycareId);
  }, [expenses, daycareId]);

  const totalDaycareExpenses = daycareExpenses.reduce((sum, e) => sum + e.amount, 0);

  const expenseData = useMemo(() => ({
    daycareExpenses: totalDaycareExpenses,
    photographerCost,
  }), [totalDaycareExpenses, photographerCost]);

  const totalExpenses = session ? calculateSessionTotalExpenses(sessionSales, session, expenseData) : 0;
  const netProfit = session ? calculateSessionNetProfit(sessionSales, session, expenseData) : 0;

  const numberPhotographed = session?.number_photographed || 0;
  const avgPerChild = numberPhotographed > 0 ? grandSalesTotal / numberPhotographed : 0;

  const numberOfSales = parseFloat(numberOfSalesInput) || 0;
  const avgPerSale = numberOfSales > 0 ? grandSalesTotal / numberOfSales : 0;

  console.log('[SessionSummary] numberOfSalesInput:', numberOfSalesInput, 'parsed:', numberOfSales, 'numberPhotographed:', numberPhotographed, 'percentage:', (numberOfSales / numberPhotographed) * 100);

  const earlyBirdSales = sessionSales.filter((s) => s.type === 'early-bird');
  const earlyBirdTotal = earlyBirdSales.reduce((sum, sale) => sum + sale.total_price, 0);
  const earlyBirdDiscount = session?.early_bird_discount || 0;
  
  // Calculate early bird percentage:
  // If there are early bird items, use earlyBirdTotal as the base
  // If no early bird items but discount exists, use grandSalesTotal as the base
  const earlyBirdPercentage = earlyBirdTotal > 0 
    ? (earlyBirdDiscount / earlyBirdTotal) * 100 
    : (grandSalesTotal > 0 && earlyBirdDiscount > 0) 
      ? (earlyBirdDiscount / grandSalesTotal) * 100 
      : 0;

  const regularDiscount = session?.regular_discount || 0;
  const otherDiscountsPercentage = grandSalesTotal > 0 ? (regularDiscount / grandSalesTotal) * 100 : 0;

  const salesPercentage = numberPhotographed > 0 ? (numberOfSales / numberPhotographed) * 100 : 0;

  const parseClassNames = (classesMemo: string | undefined): string[] => {
    if (!classesMemo) return [];
    return classesMemo
      .split(/[,\n]+/)
      .map(c => c.trim())
      .filter(c => c.length > 0);
  };

  const classNames = useMemo(() => parseClassNames(daycare?.classes_memo), [daycare?.classes_memo]);

  const classPercentages = useMemo(() => {
    if (classNames.length === 0) return [];
    
    const classGrossSales = session?.class_gross_sales || {};
    const totalClassSales = classNames.reduce((sum, className) => {
      return sum + (classGrossSales[className] || 0);
    }, 0);
    
    return classNames.map(className => {
      const sales = classGrossSales[className] || 0;
      const percentage = totalClassSales > 0 ? (sales / totalClassSales) * 100 : 0;
      return { className, sales, percentage };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [classNames, session?.class_gross_sales]);

  const totalClassSales = useMemo(() => {
    return classPercentages.reduce((sum, c) => sum + c.sales, 0);
  }, [classPercentages]);

  if (!daycare || !session) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Session not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <ScrollView style={styles.content}>
        <View style={styles.cardsGrid}>
          <View style={[styles.card, styles.revenueCard]}>
            <Text style={styles.cardLabel}>Total Revenue</Text>
            <Text style={styles.cardAmount}>${grandSalesTotal.toFixed(2)}</Text>
            <Ionicons name="cash" size={32} color="#0066cc" style={styles.cardIcon} />
          </View>

          <View style={[styles.card, styles.expensesCard]}>
            <Text style={styles.cardLabel}>Total Expenses</Text>
            <Text style={styles.cardAmount}>${totalExpenses.toFixed(2)}</Text>
            <Ionicons name="receipt" size={32} color="#ff3b30" style={styles.cardIcon} />
          </View>

          <View style={[styles.card, styles.profitCard]}>
            <Text style={styles.cardLabel}>Net Profit</Text>
            <Text style={[styles.cardAmount, { color: netProfit >= 0 ? '#34c759' : '#ff3b30' }]}>
              ${netProfit.toFixed(2)}
            </Text>
            <Ionicons name="stats-chart" size={32} color={netProfit >= 0 ? '#34c759' : '#ff3b30'} style={styles.cardIcon} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sales Analysis</Text>
          <View style={styles.metricsGrid}>
            <View style={[styles.metricSquare, styles.metricCardEarlyBird]}>
              <Ionicons name="alarm" size={32} color="#d97706" style={styles.metricIcon} />
              <Text style={styles.metricLabel}>Early Bird %</Text>
              <Text style={[styles.metricValue, styles.metricValueEarlyBird]}>{earlyBirdPercentage.toFixed(1)}%</Text>
            </View>
            <View style={[styles.metricSquare, styles.metricCardOtherDiscount]}>
              <Ionicons name="pricetag" size={32} color="#8b5cf6" style={styles.metricIcon} />
              <Text style={styles.metricLabel}>Other Discounts %</Text>
              <Text style={[styles.metricValue, styles.metricValueOtherDiscount]}>{otherDiscountsPercentage.toFixed(1)}%</Text>
            </View>
            <View style={[styles.metricSquare, styles.metricCardSalesPercent]}>
              <Ionicons name="trending-up" size={32} color="#16a34a" style={styles.metricIcon} />
              <Text style={styles.metricLabel}>Sales %</Text>
              <Text style={[styles.metricValue, styles.metricValueSalesPercent]}>{salesPercentage.toFixed(1)}%</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          <View style={styles.metricsGrid}>
            <View style={[styles.metricSquare, styles.metricCardNumberOfSales]}>
              <Ionicons name="layers" size={32} color="#ec4899" style={styles.metricIcon} />
              <Text style={styles.metricLabel}>Number of Sales</Text>
              <Text style={[styles.metricValue, styles.metricValueNumberOfSales]}>{numberOfSalesInput || '0'}</Text>
            </View>
            <View style={[styles.metricSquare, styles.metricCard]}>
              <Ionicons name="people" size={32} color="#6b21a8" style={styles.metricIcon} />
              <Text style={styles.metricLabel}>Avg Per Child</Text>
              <Text style={styles.metricValue}>${avgPerChild.toFixed(2)}</Text>
            </View>
            <View style={[styles.metricSquare, styles.metricCardSales]}>
              <Ionicons name="receipt" size={32} color="#0066cc" style={styles.metricIcon} />
              <Text style={styles.metricLabel}>Avg Per Sale</Text>
              <Text style={[styles.metricValue, styles.metricValueSales]}>${avgPerSale.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Class Percentage of Sales</Text>
          {classNames.length > 0 ? (
            <View style={styles.classPercentageList}>
              {classPercentages.map((item, index) => {
                const isTopClass = index === 0 && item.percentage > 0;
                return (
                  <View 
                    key={item.className} 
                    style={[
                      styles.classPercentageRow,
                      isTopClass && styles.topClassRow
                    ]}
                  >
                    <View style={styles.classPercentageInfo}>
                      <View style={styles.classNameContainer}>
                        {isTopClass && (
                          <Ionicons name="trophy" size={16} color="#f59e0b" style={styles.trophyIcon} />
                        )}
                        <Text style={[
                          styles.classPercentageName,
                          isTopClass && styles.topClassName
                        ]}>{item.className}</Text>
                      </View>
                      <Text style={[
                        styles.classPercentageSales,
                        isTopClass && styles.topClassSales
                      ]}>${item.sales.toFixed(2)}</Text>
                    </View>
                    <View style={styles.classPercentageBarContainer}>
                      <View 
                        style={[
                          styles.classPercentageBar, 
                          { width: `${Math.min(item.percentage, 100)}%` },
                          { backgroundColor: isTopClass ? '#f59e0b' : getClassColor(index) }
                        ]} 
                      />
                    </View>
                    <Text style={[
                      styles.classPercentageValue, 
                      { color: isTopClass ? '#f59e0b' : getClassColor(index) },
                      isTopClass && styles.topClassPercentage
                    ]}>
                      {item.percentage.toFixed(1)}%
                    </Text>
                  </View>
                );
              })}
              <View style={styles.classPercentageTotal}>
                <Text style={styles.classPercentageTotalLabel}>Total Class Sales</Text>
                <Text style={styles.classPercentageTotalValue}>${totalClassSales.toFixed(2)}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.classPercentageEmpty}>No classes have been entered yet.</Text>
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
        <Pressable
          style={styles.footerButton}
          onPress={() => router.push(`/daycare/${daycareId}/session/${sessionId}/expense` as any)}
        >
          <Ionicons name="receipt" size={24} color="white" />
          <Text style={styles.footerButtonText}>Expenses</Text>
        </Pressable>
        <Pressable style={[styles.footerButton, styles.footerButtonActive]}>
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
  content: {
    flex: 1,
    padding: 16,
  },
  cardsGrid: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 20,
  },
  card: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  revenueCard: {
    backgroundColor: '#f0f7ff',
    borderColor: '#0066cc',
  },
  expensesCard: {
    backgroundColor: '#fff5f5',
    borderColor: '#ff3b30',
  },
  profitCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#34c759',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  metricSquare: {
    width: 113,
    height: 113,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 19,
    borderWidth: 1,
  },
  metricCard: {
    backgroundColor: '#faf5ff',
    borderColor: '#6b21a8',
  },
  metricCardSales: {
    backgroundColor: '#f0f7ff',
    borderColor: '#0066cc',
  },
  metricCardEarlyBird: {
    backgroundColor: '#fef3c7',
    borderColor: '#d97706',
  },
  metricCardOtherDiscount: {
    backgroundColor: '#f3e8ff',
    borderColor: '#8b5cf6',
  },
  metricCardSalesPercent: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
  },
  metricCardNumberOfSales: {
    backgroundColor: '#fce7f3',
    borderColor: '#ec4899',
  },
  metricIcon: {
    marginBottom: 8,
    opacity: 0.7,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginBottom: 6,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6b21a8',
    textAlign: 'center',
  },
  metricValueSales: {
    color: '#0066cc',
  },
  metricValueEarlyBird: {
    color: '#d97706',
  },
  metricValueOtherDiscount: {
    color: '#8b5cf6',
  },
  metricValueSalesPercent: {
    color: '#16a34a',
  },
  metricValueNumberOfSales: {
    color: '#ec4899',
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  cardAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0066cc',
  },
  cardIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
    opacity: 0.2,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  chartPlaceholder: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#e0e0e0',
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
    textAlign: 'center',
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
  classPercentageList: {
    gap: 12,
  },
  classPercentageRow: {
    gap: 8,
  },
  classPercentageInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  classPercentageName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  classNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trophyIcon: {
    marginRight: 2,
  },
  topClassRow: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  topClassName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400e',
  },
  topClassSales: {
    fontWeight: '700',
    color: '#92400e',
  },
  topClassPercentage: {
    fontSize: 16,
    fontWeight: '800',
  },
  classPercentageSales: {
    fontSize: 13,
    color: '#666',
  },
  classPercentageBarContainer: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  classPercentageBar: {
    height: '100%',
    borderRadius: 4,
  },
  classPercentageValue: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  classPercentageTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  classPercentageTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  classPercentageTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065f46',
  },
  classPercentageEmpty: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});

const CLASS_COLORS = ['#0066cc', '#16a34a', '#d97706', '#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#ef4444'];

function getClassColor(index: number): string {
  return CLASS_COLORS[index % CLASS_COLORS.length];
}
