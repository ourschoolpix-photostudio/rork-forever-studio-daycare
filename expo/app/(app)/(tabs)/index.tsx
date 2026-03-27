import { View, Text, FlatList, Pressable, StyleSheet, Alert, Image, TextInput } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { useData } from '@/context/DataContext';
import { Ionicons } from '@expo/vector-icons';
import { formatPhoneNumber } from '@/utils/phoneFormatter';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { calculateSessionGrandTotal, calculateSessionTotalExpenses, calculateSessionNetProfit, ExpenseData } from '@/utils/salesCalculator';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CARD_COLORS = [
  { name: 'None', bg: 'white', border: '#e0e0e0' },
  { name: 'Light Yellow', bg: '#fef3c7', border: '#fcd34d' },
  { name: 'Light Green', bg: '#dcfce7', border: '#86efac' },
  { name: 'Light Blue', bg: '#dbeafe', border: '#7dd3fc' },
  { name: 'Light Pink', bg: '#fbf1f9', border: '#f4a6e0' },
  { name: 'Light Purple', bg: '#ede9fe', border: '#d8b4fe' },
  { name: 'Light Orange', bg: '#fed7aa', border: '#fdba74' },
  { name: 'Light Red', bg: '#fecaca', border: '#fca5a5' },
  { name: 'Light Cyan', bg: '#cffafe', border: '#a5f3fc' },
  { name: 'Light Indigo', bg: '#e0e7ff', border: '#c7d2fe' },
  { name: 'Light Lime', bg: '#dcfce7', border: '#bfdbfe' },
  { name: 'Light Amber', bg: '#fef08a', border: '#fde047' },
  { name: 'Light Gray', bg: '#f3f4f6', border: '#d1d5db' },
  { name: 'Medium Gray', bg: '#e5e7eb', border: '#9ca3af' },
  { name: 'Dark Gray', bg: '#d1d5db', border: '#6b7280' },
];
const YEAR_SEASON_COLORS_KEY = 'app_year_season_colors';

type YearSeasonColors = Record<string, number>;

function getSeasonFromDate(date: Date): 'F' | 'SP' {
  const month = date.getMonth() + 1;
  return month >= 8 ? 'F' : 'SP';
}

function getYearSeasonKey(date: Date): string {
  const year = date.getFullYear();
  const season = getSeasonFromDate(date);
  return `${year}-${season}`;
}

export default function DashboardScreen() {
  const { daycares, sessions, sales, expenses, loading, deleteDaycare } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [yearSeasonColors, setYearSeasonColors] = useState<YearSeasonColors>({});
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [photographerCost, setPhotographerCost] = useState(0);


  const loadYearSeasonColors = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(YEAR_SEASON_COLORS_KEY);
      console.log('[Dashboard] Loaded year/season colors:', saved);
      if (saved) {
        setYearSeasonColors(JSON.parse(saved));
      } else {
        setYearSeasonColors({});
      }
    } catch (err) {
      console.error('Failed to load year/season colors:', err);
    }
  }, []);

  const loadPhotographerCost = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem('app_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        setPhotographerCost(parseFloat(settings.photographerCost) || 0);
      }
    } catch (err) {
      console.error('Failed to load photographer cost:', err);
    }
  }, []);

  useEffect(() => {
    loadYearSeasonColors();
    loadPhotographerCost();
  }, [loadYearSeasonColors, loadPhotographerCost]);

  useFocusEffect(
    useCallback(() => {
      console.log('[Dashboard] Screen focused, reloading year/season colors');
      loadYearSeasonColors();
      loadPhotographerCost();
    }, [loadYearSeasonColors, loadPhotographerCost])
  );

  const filteredDaycares = useMemo(() => {
    let result = daycares;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = daycares.filter((daycare) => {
        const nameWords = daycare.name.toLowerCase().split(/\s+/);
        return nameWords.some((word) => word.includes(query));
      });
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [daycares, searchQuery]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    const currentYear = new Date().getFullYear();
    years.add(currentYear);
    
    sessions.forEach((session) => {
      const sessionDate = new Date(session.scheduled_date || new Date());
      years.add(sessionDate.getFullYear());
    });
    
    return Array.from(years).sort((a, b) => a - b);
  }, [sessions]);

  const canGoBack = useMemo(() => {
    const currentIndex = availableYears.indexOf(selectedYear);
    return currentIndex > 0;
  }, [availableYears, selectedYear]);

  const canGoForward = useMemo(() => {
    const currentIndex = availableYears.indexOf(selectedYear);
    return currentIndex < availableYears.length - 1;
  }, [availableYears, selectedYear]);

  const handlePreviousYear = useCallback(() => {
    const currentIndex = availableYears.indexOf(selectedYear);
    if (currentIndex > 0) {
      setSelectedYear(availableYears[currentIndex - 1]);
    }
  }, [availableYears, selectedYear]);

  const handleNextYear = useCallback(() => {
    const currentIndex = availableYears.indexOf(selectedYear);
    if (currentIndex < availableYears.length - 1) {
      setSelectedYear(availableYears[currentIndex + 1]);
    }
  }, [availableYears, selectedYear]);

  const getMostRecentSession = useCallback((daycareId: string) => {
    const daycareSessions = sessions.filter((s) => s.daycare_id === daycareId);
    if (daycareSessions.length === 0) return null;
    
    return daycareSessions.reduce((latest, current) => {
      const latestDate = new Date(latest.scheduled_date);
      const currentDate = new Date(current.scheduled_date);
      return currentDate > latestDate ? current : latest;
    });
  }, [sessions]);

  const getCardColorForDaycare = useCallback((daycareId: string) => {
    const mostRecentSession = getMostRecentSession(daycareId);
    if (!mostRecentSession) return null;
    
    const sessionDate = new Date(mostRecentSession.scheduled_date);
    const yearSeasonKey = getYearSeasonKey(sessionDate);
    const colorIndex = yearSeasonColors[yearSeasonKey];
    
    console.log('[Dashboard] Daycare:', daycareId, 'Most recent session:', yearSeasonKey, 'Color index:', colorIndex);
    
    if (colorIndex !== undefined && colorIndex > 0) {
      return CARD_COLORS[colorIndex] || null;
    }
    
    return null;
  }, [getMostRecentSession, yearSeasonColors]);

  const getDaycareFinancials = useCallback((daycareId: string) => {
    const daycareSessions = sessions.filter((s) => s.daycare_id === daycareId);
    if (daycareSessions.length === 0) {
      return { avgPerSale: 0, avgPerChild: 0, avgGrossSales: 0, hasData: false };
    }

    let totalGrossSales = 0;
    let sumOfSessionAvgPerSale = 0;
    let sumOfSessionAvgPerChild = 0;
    let sessionsWithSalesData = 0;
    let sessionsWithChildData = 0;

    daycareSessions.forEach((session) => {
      const sessionSales = sales.filter((s) => s.session_id === session.id);
      const sessionGross = calculateSessionGrandTotal(sessionSales, session, 0.06);
      totalGrossSales += sessionGross;

      const numberOfSales = session.number_of_sales || 0;
      const numberPhotographed = session.number_photographed || 0;

      if (numberOfSales > 0) {
        const sessionAvgPerSale = sessionGross / numberOfSales;
        sumOfSessionAvgPerSale += sessionAvgPerSale;
        sessionsWithSalesData++;
      }

      if (numberPhotographed > 0) {
        const sessionAvgPerChild = sessionGross / numberPhotographed;
        sumOfSessionAvgPerChild += sessionAvgPerChild;
        sessionsWithChildData++;
      }
    });

    const numSessions = daycareSessions.length;
    const avgGrossSales = totalGrossSales / numSessions;
    const avgPerSale = sessionsWithSalesData > 0 ? sumOfSessionAvgPerSale / sessionsWithSalesData : 0;
    const avgPerChild = sessionsWithChildData > 0 ? sumOfSessionAvgPerChild / sessionsWithChildData : 0;

    return { avgPerSale, avgPerChild, avgGrossSales, hasData: true };
  }, [sessions, sales]);

  const ytdTotals = useMemo(() => {
    let ytdRevenue = 0;
    let ytdExpenses = 0;
    let netProfit = 0;

    const processedDaycares = new Set<string>();

    sessions.forEach((session) => {
      const sessionDate = new Date(session.scheduled_date || new Date());
      if (sessionDate.getFullYear() === selectedYear) {
        const sessionSales = sales.filter((s) => s.session_id === session.id);
        const sessionGrandTotal = calculateSessionGrandTotal(sessionSales, session, 0.06);
        
        let daycareExpenseForSession = 0;
        if (!processedDaycares.has(session.daycare_id)) {
          const daycareExpenses = expenses.filter((e) => e.daycare_id === session.daycare_id);
          daycareExpenseForSession = daycareExpenses.reduce((sum, e) => sum + e.amount, 0);
          processedDaycares.add(session.daycare_id);
        }
        
        const expenseData: ExpenseData = {
          daycareExpenses: daycareExpenseForSession,
          photographerCost,
        };
        
        const sessionTotalExpenses = calculateSessionTotalExpenses(sessionSales, session, expenseData);
        const sessionNetProfit = calculateSessionNetProfit(sessionSales, session, expenseData, 0.06);

        ytdRevenue += sessionGrandTotal;
        ytdExpenses += sessionTotalExpenses;
        netProfit += sessionNetProfit;
      }
    });

    return { ytdRevenue, ytdExpenses: ytdExpenses, netProfit };
  }, [sessions, sales, expenses, selectedYear, photographerCost]);

  const handleAddDaycare = () => {
    router.push('/(app)/add-daycare');
  };

  const handleSelectDaycare = (id: string) => {
    console.log('[Dashboard] Navigating to daycare:', id);
    router.push(`/daycare/${id}`);
  };

  const handleDeleteDaycare = async (id: string) => {
    Alert.alert('Delete Daycare', 'Are you sure? This will delete all associated data.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDaycare(id);
          } catch {
            Alert.alert('Error', 'Failed to delete daycare');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {daycares.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <Ionicons name="business" size={48} color="#ccc" />
          <Text style={styles.emptyTitle}>No Daycares Yet</Text>
          <Text style={styles.emptyText}>Add your first daycare account to get started</Text>
          <Pressable style={styles.addButton} onPress={handleAddDaycare}>
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.addButtonText}>Add Daycare</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.ytdSummaryContainer}>
            <View style={styles.yearSelectorRow}>
              <View style={styles.yearSelector}>
                <Pressable
                  style={[styles.yearArrow, !canGoBack && styles.yearArrowDisabled]}
                  onPress={handlePreviousYear}
                  disabled={!canGoBack}
                >
                  <Ionicons name="chevron-back" size={20} color={canGoBack ? '#0066cc' : '#ccc'} />
                </Pressable>
                <Text style={styles.yearLabel}>{selectedYear}</Text>
                <Pressable
                  style={[styles.yearArrow, !canGoForward && styles.yearArrowDisabled]}
                  onPress={handleNextYear}
                  disabled={!canGoForward}
                >
                  <Ionicons name="chevron-forward" size={20} color={canGoForward ? '#0066cc' : '#ccc'} />
                </Pressable>
              </View>
              <Pressable style={styles.topAddButton} onPress={handleAddDaycare}>
                <Ionicons name="add" size={20} color="white" />
              </Pressable>
            </View>
            <View style={styles.ytdCard}>
              <View style={styles.ytdMetric}>
                <Text style={styles.ytdLabel}>Revenue</Text>
                <Text style={styles.ytdRevenueAmount}>${ytdTotals.ytdRevenue.toFixed(2)}</Text>
              </View>
              <View style={styles.ytdDivider} />
              <View style={styles.ytdMetric}>
                <Text style={styles.ytdLabel}>Expenses</Text>
                <Text style={styles.ytdExpensesAmount}>${ytdTotals.ytdExpenses.toFixed(2)}</Text>
              </View>
              <View style={styles.ytdDivider} />
              <View style={styles.ytdMetric}>
                <Text style={styles.ytdLabel}>Net Profit</Text>
                <Text style={[styles.ytdProfitAmount, { color: ytdTotals.netProfit >= 0 ? '#34c759' : '#ff3b30' }]}>
                  ${ytdTotals.netProfit.toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color="#999" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search daycares..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <Pressable
                  style={styles.clearButton}
                  onPress={() => setSearchQuery('')}
                >
                  <Ionicons name="close-circle" size={18} color="#999" />
                </Pressable>
              )}
            </View>
          </View>

          <FlatList
            data={filteredDaycares}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const cardColor = getCardColorForDaycare(item.id);
              const hasValidPhoto = item.photo_uri && 
                typeof item.photo_uri === 'string' && 
                item.photo_uri.trim() !== '' && 
                item.photo_uri !== 'undefined' && 
                item.photo_uri !== 'null';
              return (
              <View style={[
                styles.daycareCard, 
                cardColor && { 
                  backgroundColor: cardColor.bg,
                  borderColor: cardColor.border,
                }
              ]}>
                {hasValidPhoto && (
                  <Image
                    source={{ uri: item.photo_uri }}
                    style={styles.daycarePhoto}
                    resizeMode="cover"
                  />
                )}
                <View style={styles.cardInner}>
                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => handleDeleteDaycare(item.id)}
                  >
                    <View style={styles.deleteCircle}>
                      <Ionicons name="close" size={14} color="white" />
                    </View>
                  </Pressable>
                  <Pressable
                    style={styles.editButton}
                    onPress={() => router.push(`/(app)/edit-daycare/${item.id}`)}
                  >
                    <Ionicons name="create" size={40} color="#0066cc" />
                  </Pressable>
                  <Pressable
                    style={{ flex: 1 }}
                    onPress={() => handleSelectDaycare(item.id)}
                  >
                    <View style={styles.cardContent}>
                      <Text style={styles.daycareName}>{item.name}</Text>
                      {item.daycare_id_number && <Text style={styles.cardText}>ID: {item.daycare_id_number}</Text>}
                      {item.phone && <Text style={styles.cardText}>{formatPhoneNumber(item.phone)}</Text>}
                      {item.city && item.state && <Text style={styles.cardText}>{item.city}, {item.state}</Text>}
                      {item.director_name && <Text style={styles.cardText}>{item.director_name}</Text>}
                      {item.enrollment_number && <Text style={styles.cardText}>Enrollment: {item.enrollment_number}</Text>}
                      {item.age_range && <Text style={styles.cardText}>Age Range: {item.age_range}</Text>}
                    </View>
                  </Pressable>
                </View>
                {(() => {
                  const financials = getDaycareFinancials(item.id);
                  if (!financials.hasData) return null;
                  return (
                    <View style={styles.financialSection}>
                      <View style={styles.financialRow}>
                        <View style={styles.financialItem}>
                          <Text style={styles.financialLabel}>Avg/Sale</Text>
                          <Text style={styles.financialValue}>${financials.avgPerSale.toFixed(2)}</Text>
                        </View>
                        <View style={styles.financialDivider} />
                        <View style={styles.financialItem}>
                          <Text style={styles.financialLabel}>Avg/Child</Text>
                          <Text style={styles.financialValue}>${financials.avgPerChild.toFixed(2)}</Text>
                        </View>
                        <View style={styles.financialDivider} />
                        <View style={styles.financialItem}>
                          <Text style={styles.financialLabel}>Avg Gross</Text>
                          <Text style={styles.financialValue}>${financials.avgGrossSales.toFixed(2)}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })()}
              </View>
            );
            }}
          />
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
  ytdSummaryContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  yearSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 8,
  },
  yearArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearArrowDisabled: {
    backgroundColor: '#f5f5f5',
  },
  yearLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0066cc',
    minWidth: 50,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginTop: 12,
    height: 40,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
    padding: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  ytdCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  ytdMetric: {
    flex: 1,
    alignItems: 'center',
  },
  ytdLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginBottom: 6,
  },
  ytdRevenueAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0066cc',
  },
  ytdExpensesAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ff9500',
  },
  ytdProfitAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  ytdDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  list: {
    padding: 16,
  },
  daycareCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  daycarePhoto: {
    width: '100%',
    height: 120,
  },
  cardInner: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    minHeight: 100,
    position: 'relative',
  },
  cardContent: {
    flex: 1,
  },
  daycareName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  cardText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  editButton: {
    position: 'absolute',
    bottom: 12,
    right: 7,
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 8,
    zIndex: 100,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  financialSection: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 102, 204, 0.04)',
  },
  financialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  financialItem: {
    flex: 1,
    alignItems: 'center',
  },
  financialLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#666',
    marginBottom: 2,
  },
  financialValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0066cc',
  },
  financialDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#e0e0e0',
  },
  headerAddButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
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
  topAddButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
  },

});
