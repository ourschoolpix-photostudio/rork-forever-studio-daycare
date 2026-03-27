import { useState, useLayoutEffect, useEffect } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, router, useFocusEffect, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useData } from '@/context/DataContext';
import { formatDate } from '@/utils/dateFormatter';
import { formatPhoneNumber } from '@/utils/phoneFormatter';
import { getSessionStatus } from '@/utils/sessionStatus';
import SessionFormModal from '@/components/SessionFormModal';
import { calculateSessionNetProfit } from '@/utils/salesCalculator';
import AsyncStorage from '@react-native-async-storage/async-storage';

const formatTimeToAMPM = (time24: string): string => {
  if (!time24 || !time24.includes(':')) return '';
  const [hours, minutes] = time24.split(':');
  let h = parseInt(hours);
  const period = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${minutes}${period}`;
};

export default function DaycareDetailScreen() {
  const { id } = useLocalSearchParams();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { daycares, sessions: allSessions, deleteSession, sales, expenses } = useData();
  const [editingSession, setEditingSession] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [photographerCost, setPhotographerCost] = useState(0);

  useEffect(() => {
    const loadPhotographerCost = async () => {
      try {
        const saved = await AsyncStorage.getItem('app_auto_expense');
        if (saved) {
          const settings = JSON.parse(saved);
          setPhotographerCost(parseFloat(settings.photographerCost) || 0);
        }
      } catch (err) {
        console.error('[DaycareDetail] Failed to load photographer cost:', err);
      }
    };
    loadPhotographerCost();
  }, []);

  const daycare = daycares.find((d) => d.id === id);
  const sessions = allSessions
    .filter((s) => s.daycare_id === id)
    .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());

  const getTopClass = (): string | null => {
    const classTotals: Record<string, number> = {};
    sessions.forEach((session) => {
      if (session.class_gross_sales) {
        Object.entries(session.class_gross_sales).forEach(([className, amount]) => {
          classTotals[className] = (classTotals[className] || 0) + amount;
        });
      }
    });
    const entries = Object.entries(classTotals);
    if (entries.length === 0) return null;
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    if (sorted[0][1] === 0) return null;
    return sorted[0][0];
  };

  const topClass = getTopClass();

  useLayoutEffect(() => {
    if (daycare) {
      const mostRecentSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;
      navigation.setOptions({
        headerTitle: () => (
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: 'white' }}>Details</Text>
            <Text style={{ fontSize: 14, fontWeight: '500', color: 'white', marginTop: 2 }}>{daycare.name}</Text>
            <Text style={{ fontSize: 12, fontWeight: '400', color: 'rgba(255,255,255,0.9)', marginTop: 1 }}>
              {mostRecentSession?.account_number || 'No Account #'}
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
  }, [navigation, daycare, sessions]);

  useFocusEffect(() => {
    console.log('[DaycareDetail] Screen focused - Daycare ID:', id);
  });

  const handleAddSession = () => {
    setEditingSession(null);
    setShowModal(true);
  };

  const handleEditSession = (session: any) => {
    setEditingSession(session);
    setShowModal(true);
  };

  const handleAddressPress = async () => {
    if (!daycare?.address) return;
    
    let fullAddress = daycare.address;
    if (daycare.city || daycare.state || daycare.zip_code) {
      fullAddress += `, ${daycare.city || ''}, ${daycare.state || ''} ${daycare.zip_code || ''}`.replace(/,\s*,/g, ',').trim();
    }
    
    try {
      await Clipboard.setStringAsync(fullAddress);
    } catch {
      console.log('Error copying address');
    }
  };

  const handlePhonePress = async () => {
    if (!daycare?.phone) return;

    try {
      await Clipboard.setStringAsync(daycare.phone);
    } catch {
      console.log('Error copying phone');
    }
  };

  const handleDeleteSession = (sessionId: string, sessionName: string) => {
    Alert.alert('Delete Session', `Remove "${sessionName}" from calendar?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSession(sessionId);
          } catch {
            Alert.alert('Error', 'Failed to delete session');
          }
        },
      },
    ]);
  };

  if (!daycare) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Daycare not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{daycare.name}</Text>
            {daycare.daycare_id_number && <Text style={styles.text}>ID: {daycare.daycare_id_number}</Text>}
            {daycare.phone && (
              <Pressable onPress={handlePhonePress} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
                <Text style={[styles.text, styles.phoneText]}>{formatPhoneNumber(daycare.phone)}</Text>
              </Pressable>
            )}
            {(daycare.address || daycare.city || daycare.state || daycare.zip_code) && (
              <Pressable onPress={handleAddressPress} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
                {daycare.address && <Text style={[styles.text, styles.addressText]}>{daycare.address}</Text>}
                {daycare.city && daycare.state && daycare.zip_code && (
                  <Text style={[styles.text, styles.addressText]}>{daycare.city}, {daycare.state} {daycare.zip_code}</Text>
                )}
              </Pressable>
            )}
            {daycare.director_name && <Text style={styles.text}>Director: {daycare.director_name}</Text>}
            {daycare.assistant_director_name && (
              <Text style={styles.text}>Asst. Director: {daycare.assistant_director_name}</Text>
            )}
            {daycare.enrollment_number && <Text style={styles.text}>Enrollment: {daycare.enrollment_number}</Text>}
            {daycare.age_range && <Text style={styles.text}>Ages: {daycare.age_range}</Text>}
          </View>
          {daycare.classes_memo && (
            <View style={styles.headerRight}>
              <Text style={styles.classesLabel}>Classes</Text>
              {daycare.classes_memo.split('\n').map((className, index) => {
                const trimmed = className.trim();
                const isTop = topClass && trimmed.toLowerCase() === topClass.toLowerCase();
                return (
                  <View
                    key={index}
                    style={[
                      styles.classItem,
                      isTop && styles.classItemHighlight,
                    ]}
                  >
                    <Text
                      style={[
                        styles.classesText,
                        isTop && styles.classTextHighlight,
                      ]}
                    >
                      {trimmed}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>

      <ScrollView style={styles.content}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Pressable style={styles.addSessionButton} onPress={handleAddSession}>
            <Text style={styles.addSessionButtonText}>Add Photo Sessions</Text>
          </Pressable>
        </View>

        {sessions.length === 0 ? (
          <Text style={styles.empty}>No sessions yet</Text>
        ) : (
          <FlatList
            data={sessions}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => {
              const sessionSales = sales.filter((s) => s.session_id === item.id);
              const daycareExpensesTotal = expenses.filter((e) => e.daycare_id === id).reduce((sum, e) => sum + e.amount, 0);
              const netProfit = calculateSessionNetProfit(sessionSales, item, {
                daycareExpenses: daycareExpensesTotal,
                photographerCost,
              });

              return (
                <Pressable
                  style={styles.sessionItem}
                  onPress={() => {
                    console.log('[DaycareDetail] Session card tapped - navigating to sales');
                    console.log('[DaycareDetail] Daycare ID:', id, 'Session ID:', item.id);
                    router.push(`/daycare/${id}/session/${item.id}/sales` as any);
                  }}
                >
                  <View style={styles.sessionInfo}>
                    {item.account_number && (
                      <Text style={styles.accountNumber}>{item.account_number}</Text>
                    )}
                    <Text style={styles.sessionDate}>{formatDate(item.scheduled_date)}</Text>
                    {item.scheduled_time && (
                      <Text style={styles.sessionTime}>Start Time: {formatTimeToAMPM(item.scheduled_time)}</Text>
                    )}
                    {item.gallery_password && (
                      <Text style={styles.galleryPassword}>{item.gallery_password}</Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.status,
                      getSessionStatus(item.scheduled_date, item.end_date) === 'scheduled' && styles.status_scheduled,
                      getSessionStatus(item.scheduled_date, item.end_date) === 'active' && styles.status_active,
                      getSessionStatus(item.scheduled_date, item.end_date) === 'complete' && styles.status_complete,
                    ]}
                  >
                    {getSessionStatus(item.scheduled_date, item.end_date).charAt(0).toUpperCase() + getSessionStatus(item.scheduled_date, item.end_date).slice(1)}
                  </Text>
                  <Text
                    style={[
                      styles.netProfitBadge,
                      netProfit >= 0 ? styles.netProfitPositive : styles.netProfitNegative,
                    ]}
                  >
                    ${netProfit.toFixed(2)}
                  </Text>
                  <Pressable
                    style={[styles.sessionActionBtn, styles.sessionEditBtn]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleEditSession(item);
                    }}
                  >
                    <Ionicons name="create" size={40} color="#0066cc" />
                  </Pressable>
                  <Pressable
                    style={[styles.sessionActionBtn, styles.sessionDeleteBtn]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(item.id, item.account_number || 'Session');
                    }}
                  >
                    <View style={styles.deleteCircle}>
                      <Ionicons name="close" size={14} color="white" />
                    </View>
                  </Pressable>
                </Pressable>
              );
            }}
          />
        )}
      </View>

      <SessionFormModal
        visible={showModal}
        session={editingSession}
        daycareId={id as string}
        onClose={() => {
          setShowModal(false);
          setEditingSession(null);
        }}
        onSuccess={() => {
          setShowModal(false);
          setEditingSession(null);
        }}
      />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom || 12 }]}>
        <Pressable 
          style={[styles.footerButton, styles.footerButtonActive]}
          onPress={() => router.push('/(app)/(tabs)')}
        >
          <Ionicons name="home" size={24} color="white" />
          <Text style={styles.footerButtonText}>Home</Text>
        </Pressable>
        <Pressable
          style={styles.footerButton}
          onPress={() => {
            if (sessions.length > 0) {
              const mostRecentSession = sessions[sessions.length - 1];
              console.log('[DaycareDetail] Footer sales button pressed');
              console.log('[DaycareDetail] Navigating to - Daycare ID:', id, 'Session ID:', mostRecentSession.id);
              router.push(`/daycare/${id}/session/${mostRecentSession.id}/sales` as any);
            } else {
              Alert.alert('No Sessions', 'Please add a session first to view sales.');
            }
          }}
        >
          <Ionicons name="cart" size={24} color="white" />
          <Text style={styles.footerButtonText}>Sales</Text>
        </Pressable>
        <Pressable
          style={styles.footerButton}
        >
          <Ionicons name="mail" size={24} color="white" />
          <Text style={styles.footerButtonText}>Email</Text>
        </Pressable>
        <Pressable
          style={styles.footerButton}
        >
          <Ionicons name="notifications" size={24} color="white" />
          <Text style={styles.footerButtonText}>Notice</Text>
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
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    paddingLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
    minWidth: 120,
  },
  classesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  classesText: {
    fontSize: 15,
    color: '#1a1a1a',
    lineHeight: 20,
  },
  classItem: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginVertical: 1,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  classItemHighlight: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  classTextHighlight: {
    fontWeight: '700' as const,
    color: '#065f46',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  addressText: {
    color: '#0066cc',
    textDecorationLine: 'underline',
  },
  phoneText: {
    color: '#0066cc',
    textDecorationLine: 'underline',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 12,
  },
  addSessionButton: {
    backgroundColor: '#0066cc',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addSessionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  empty: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 24,
  },
  sessionItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    position: 'relative',
    minHeight: 80,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  accountNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  sessionDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  dayShoot: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0066cc',
    marginTop: 2,
  },
  sessionTime: {
    fontSize: 12,
    color: '#0066cc',
    marginTop: 2,
  },
  galleryPassword: {
    fontSize: 12,
    color: '#0066cc',
    fontWeight: '600',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: 4,
    marginTop: -12,
  },
  status_scheduled: {
    backgroundColor: '#e3f2fd',
    color: '#0066cc',
  },
  status_active: {
    backgroundColor: '#fff3cd',
    color: '#ff9800',
  },
  status_complete: {
    backgroundColor: '#e8f5e9',
    color: '#00b300',
  },
  netProfitBadge: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: 4,
    marginTop: 8,
  },
  netProfitPositive: {
    backgroundColor: '#e8f5e9',
    color: '#00b300',
  },
  netProfitNegative: {
    backgroundColor: '#ffebee',
    color: '#d32f2f',
  },
  content: {
    flex: 1,
    paddingBottom: 16,
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
  deleteCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionActionBtn: {
    position: 'absolute',
    padding: 8,
  },
  sessionEditBtn: {
    bottom: -8,
    right: -3,
  },
  sessionDeleteBtn: {
    top: -3,
    right: 2,
  },
});
