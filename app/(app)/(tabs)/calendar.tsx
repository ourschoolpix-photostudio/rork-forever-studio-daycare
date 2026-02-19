import { useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useData } from '@/context/DataContext';
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from '@/utils/dateFormatter';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface ExpandedMonths {
  [key: string]: boolean;
}

export default function CalendarScreen() {
  const { sessions, daycares, deleteSession } = useData();
  const [expandedYears, setExpandedYears] = useState<{ [key: number]: boolean }>({});
  const [expandedMonths, setExpandedMonths] = useState<ExpandedMonths>({});

  useFocusEffect(() => {
    // Initialize on focus
  });

  // Get current month and year
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Group sessions by year
  const sessionsByYear = sessions.reduce((acc, session) => {
    const date = new Date(session.scheduled_date);
    const year = date.getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(session);
    return acc;
  }, {} as Record<number, any[]>);

  // Get sorted years (newest first)
  const sortedYears = Object.keys(sessionsByYear)
    .map(Number)
    .sort((a, b) => b - a);

  const getDaycareName = (daycareId: string) => {
    const daycare = daycares.find((d) => d.id === daycareId);
    return daycare?.name || 'Unknown Daycare';
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
          } catch (err) {
            Alert.alert('Error', 'Failed to delete session');
          }
        },
      },
    ]);
  };

  const toggleYear = (year: number) => {
    setExpandedYears((prev) => {
      const isExpanding = !prev[year];
      const newState = { ...prev, [year]: isExpanding };

      // If expanding current year, auto-expand current month
      if (isExpanding && year === currentYear) {
        const currentMonthKey = `${year}-${currentMonth}`;
        setExpandedMonths((prevMonths) => ({
          ...prevMonths,
          [currentMonthKey]: true,
        }));
      }

      return newState;
    });
  };

  const toggleMonth = (year: number, monthIndex: number) => {
    const monthKey = `${year}-${monthIndex}`;
    setExpandedMonths((prev) => ({
      ...prev,
      [monthKey]: !prev[monthKey],
    }));
  };

  const getSessionsForMonth = (year: number, monthIndex: number) => {
    return (sessionsByYear[year] || [])
      .filter((session) => {
        const date = new Date(session.scheduled_date);
        return date.getMonth() === monthIndex;
      })
      .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());
  };

  const formatTimeToAMPM = (time24: string): string => {
    if (!time24 || !time24.includes(':')) return '';
    const [hours, minutes] = time24.split(':');
    let h = parseInt(hours);
    const period = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${h}:${minutes}${period}`;
  };

  const formatDateRange = (startDate: string, endDate?: string): string => {
    if (!endDate) return formatDate(startDate);
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const calculateDayShoot = (startDate: string, endDate?: string): string => {
    const startDay = parseInt(startDate.split('-')[2]);
    const endDay = endDate ? parseInt(endDate.split('-')[2]) : startDay;
    const dayCount = endDay - startDay + 1;
    return `${dayCount} Day Shoot`;
  };

  if (sortedYears.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="calendar" size={48} color="#ccc" />
          <Text style={styles.emptyTitle}>No Sessions Scheduled</Text>
          <Text style={styles.emptyText}>Go to a daycare account to schedule sessions</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.list}>
        {sortedYears.map((year) => (
          <View key={year} style={styles.yearSection}>
            <Pressable style={styles.yearHeader} onPress={() => toggleYear(year)}>
              <Text style={styles.yearTitle}>{year}</Text>
              <Ionicons
                name={expandedYears[year] ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#0066cc"
              />
            </Pressable>

            {expandedYears[year] && (
              <View style={styles.monthsContainer}>
                {MONTHS.map((monthName, monthIndex) => {
                  const monthKey = `${year}-${monthIndex}`;
                  const monthSessions = getSessionsForMonth(year, monthIndex);
                  const hasSession = monthSessions.length > 0;

                  return (
                    <View key={monthKey}>
                      {hasSession && (
                        <Pressable
                          style={styles.monthHeader}
                          onPress={() => toggleMonth(year, monthIndex)}
                        >
                          <View style={styles.monthLabelContainer}>
                            <View style={styles.sessionCountBadge}>
                              <Text style={styles.sessionCountText}>{monthSessions.length}</Text>
                            </View>
                            <Text style={[styles.monthTitle, styles.monthTitleGreen]}>{monthName}</Text>
                          </View>
                          <Ionicons
                            name={expandedMonths[monthKey] ? 'chevron-up' : 'chevron-down'}
                            size={18}
                            color="#666"
                          />
                        </Pressable>
                      )}

                      {!hasSession && (
                        <View style={styles.monthHeaderEmpty}>
                          <Text style={styles.monthTitleEmpty}>{monthName}</Text>
                        </View>
                      )}

                      {expandedMonths[monthKey] &&
                        monthSessions.map((session) => (
                          <Pressable
                            key={session.id}
                            style={styles.sessionCard}
                            onPress={() =>
                              router.push(`/daycare/${session.daycare_id}/session/${session.id}/sales` as any)
                            }
                          >
                            <Text style={styles.daycareName}>
                              {getDaycareName(session.daycare_id)}
                            </Text>
                            {session.account_number && (
                              <Text style={styles.accountNumber}>{session.account_number}</Text>
                            )}
                            <Text style={styles.dateRange}>
                              {formatDateRange(session.scheduled_date, session.end_date)}
                            </Text>
                            <Text style={styles.dayShoot}>
                              {calculateDayShoot(session.scheduled_date, session.end_date)}
                            </Text>
                            {session.scheduled_time && (
                              <Text style={styles.startTime}>
                                Start Time: {formatTimeToAMPM(session.scheduled_time)}
                              </Text>
                            )}
                            {session.gallery_password && (
                              <Text style={styles.galleryPassword}>{session.gallery_password}</Text>
                            )}
                            <Pressable
                              style={styles.deleteBtn}
                              onPress={() => handleDeleteSession(session.id, session.account_number || 'Session')}
                            >
                              <View style={styles.deleteCircleSmall}>
                                <Ionicons name="close" size={20} color="white" />
                              </View>
                            </Pressable>
                          </Pressable>
                        ))}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
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
    paddingBottom: 32,
  },
  yearSection: {
    marginBottom: 16,
  },
  yearHeader: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  yearTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  monthsContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  monthHeader: {
    backgroundColor: 'white',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  monthHeaderEmpty: {
    backgroundColor: 'white',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  monthLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  monthTitleGreen: {
    color: '#34C759',
  },
  sessionCountBadge: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  sessionCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  monthTitleEmpty: {
    fontSize: 15,
    fontWeight: '600',
    color: '#999',
  },
  sessionCard: {
    backgroundColor: 'white',
    padding: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    position: 'relative',
  },
  accountNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  dateRange: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  dayShoot: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0066cc',
    marginTop: 2,
    marginBottom: 4,
  },
  startTime: {
    fontSize: 12,
    color: '#0066cc',
    marginBottom: 4,
  },
  galleryPassword: {
    fontSize: 12,
    color: '#0066cc',
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  daycareName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  deleteBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 0,
  },
  deleteCircleSmall: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
});
