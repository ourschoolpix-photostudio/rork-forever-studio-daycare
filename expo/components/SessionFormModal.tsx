import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, Modal, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useData } from '@/context/DataContext';
import DateInput from '@/components/DateInput';
import { parseDate } from '@/utils/dateFormatter';

const GALLERY_PASSWORD_KEY = 'app_gallery_password';
const SEASON_KEY = 'app_selected_season';

interface SessionFormModalProps {
  visible: boolean;
  session?: any;
  daycareId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SessionFormModal({ visible, session, daycareId, onClose, onSuccess }: SessionFormModalProps) {
  const insets = useSafeAreaInsets();
  const { addSession, updateSession, pricingLists, daycares } = useData();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [arrivalPeriod, setArrivalPeriod] = useState<'AM' | 'PM'>('AM');
  const [time, setTime] = useState('');
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [notes, setNotes] = useState('');
  const [galleryPassword, setGalleryPassword] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [pricingListId, setPricingListId] = useState<string | null>(null);
  const [season, setSeason] = useState<'F' | 'W' | 'SP' | 'SM' | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPricingOptions, setShowPricingOptions] = useState(false);

  useEffect(() => {
    if (visible) {
      if (session) {
        if (session.scheduled_date) {
          const [year, month, day] = session.scheduled_date.split('-');
          setStartDate(`${month}/${day}/${year}`);
        } else {
          setStartDate('');
        }
        if (session.end_date) {
          const [year, month, day] = session.end_date.split('-');
          setEndDate(`${month}/${day}/${year}`);
        } else {
          setEndDate('');
        }
        setNotes(session.notes || '');
        setGalleryPassword(session.gallery_password || '');
        setAccountNumber(session.account_number || '');
        setPricingListId(session.pricing_list_id || null);

        if (session.arrival_time) {
          const [hours, minutes] = session.arrival_time.split(':');
          let h = parseInt(hours);
          const periodVal = h >= 12 ? 'PM' : 'AM';
          if (h > 12) h -= 12;
          if (h === 0) h = 12;
          setArrivalTime(`${h}:${minutes}`);
          setArrivalPeriod(periodVal as 'AM' | 'PM');
        }
        if (session.scheduled_time) {
          const [hours, minutes] = session.scheduled_time.split(':');
          let h = parseInt(hours);
          const periodVal = h >= 12 ? 'PM' : 'AM';
          if (h > 12) h -= 12;
          if (h === 0) h = 12;
          setTime(`${h}:${minutes}`);
          setPeriod(periodVal as 'AM' | 'PM');
        }
      } else {
        setStartDate('');
        setEndDate('');
        setArrivalTime('');
        setArrivalPeriod('AM');
        setTime('');
        setPeriod('AM');
        setNotes('');
        const defaultPricingList = pricingLists.find((p) => p.price_code === 'D');
        setPricingListId(defaultPricingList?.id || null);
        setAccountNumber('');
        setGalleryPassword('');
        loadGalleryPassword();
        loadSeason();
      }
      setShowPricingOptions(false);
    }
  }, [visible, session, pricingLists]);

  useEffect(() => {
    if (visible && !session) {
      generateAccountNumber();
    }
  }, [pricingListId, season, visible, startDate]);

  useEffect(() => {
    if (season && !session) {
      AsyncStorage.setItem(SEASON_KEY, season).catch(err => console.error('[SessionFormModal] Failed to save season:', err));
    }
  }, [season, session]);

  const loadGalleryPassword = async () => {
    try {
      const saved = await AsyncStorage.getItem(GALLERY_PASSWORD_KEY);
      const daycare = daycares.find((d) => d.id === daycareId);
      const daycareIdNumber = daycare?.daycare_id_number || '';
      
      const basePassword = saved || '';
      const fullPassword = basePassword && daycareIdNumber 
        ? `${basePassword}${daycareIdNumber}`
        : basePassword;
      
      setGalleryPassword(fullPassword);
    } catch (err) {
      console.error('Failed to load gallery password:', err);
    }
  };

  const loadSeason = async () => {
    try {
      const saved = await AsyncStorage.getItem(SEASON_KEY);
      if (saved) {
        setSeason(saved as 'F' | 'W' | 'SP' | 'SM');
      }
    } catch (err) {
      console.error('Failed to load season:', err);
    }
  };

  const generateAccountNumber = () => {
    const daycare = daycares.find((d) => d.id === daycareId);
    const enrollmentNumber = daycare?.enrollment_number || '00';
    const daycareIdNumber = daycare?.daycare_id_number || '';
    const pricingList = pricingLists.find((p) => p.id === pricingListId);
    const priceCode = pricingList?.price_code || '';

    let monthAbbr = '';
    let yearSuffix = '';
    if (startDate) {
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      
      const numericOnly = startDate.replace(/\D/g, '');
      if (numericOnly.length === 8) {
        const monthStr = numericOnly.substring(0, 2);
        const monthNum = parseInt(monthStr, 10);
        if (monthNum >= 1 && monthNum <= 12) {
          monthAbbr = monthNames[monthNum - 1];
        }
        const yearStr = numericOnly.substring(4, 8);
        yearSuffix = yearStr.slice(-2);
      } else {
        const parsedDate = parseDate(startDate);
        if (parsedDate) {
          monthAbbr = monthNames[parsedDate.getMonth()];
          yearSuffix = parsedDate.getFullYear().toString().slice(-2);
        }
      }
    }

    if (yearSuffix && season && monthAbbr && priceCode) {
      const generated = `${yearSuffix}${season}${monthAbbr}${enrollmentNumber}${priceCode}-${daycareIdNumber}`;
      setAccountNumber(generated);
    } else {
      setAccountNumber('');
    }
  };

  const formatTime12Hour = (input: string): string => {
    const numericOnly = input.replace(/\D/g, '');
    if (numericOnly.length === 0) return '';

    if (numericOnly.length === 3) {
      const hours = numericOnly.slice(0, 1);
      const minutes = numericOnly.slice(1, 3);
      return `${hours}:${minutes}`;
    }

    if (numericOnly.length === 4) {
      const hours = numericOnly.slice(0, 2);
      const minutes = numericOnly.slice(2, 4);
      return `${hours}:${minutes}`;
    }

    if (numericOnly.length <= 2) return numericOnly;
    return numericOnly;
  };

  const formatTimeFor24Hour = (timeStr: string, ampm: 'AM' | 'PM'): string => {
    if (!timeStr.includes(':')) return '';
    const [hours, minutes] = timeStr.split(':');
    let h = parseInt(hours);
    if (isNaN(h) || h < 1 || h > 12) return '';
    if (minutes && (isNaN(parseInt(minutes)) || parseInt(minutes) < 0 || parseInt(minutes) > 59)) return '';

    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;

    const formatted24 = `${String(h).padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    return formatted24;
  };

  const handleSubmit = async () => {
    if (!startDate.trim()) {
      Alert.alert('Error', 'Start date is required');
      return;
    }

    if (!accountNumber && !session) {
      Alert.alert('Error', 'Please select a season and pricing list to generate account number');
      return;
    }

    const parsedStartDate = parseDate(startDate);
    if (!parsedStartDate) {
      Alert.alert('Error', 'Invalid start date format');
      return;
    }

    let parsedEndDate = null;
    if (endDate.trim()) {
      parsedEndDate = parseDate(endDate);
      if (!parsedEndDate) {
        Alert.alert('Error', 'Invalid end date format');
        return;
      }
    }

    setLoading(true);
    try {
      const formattedArrivalTime = arrivalTime ? formatTimeFor24Hour(arrivalTime, arrivalPeriod) : undefined;
      const formattedTime = time ? formatTimeFor24Hour(time, period) : undefined;

      const sessionData = {
        daycare_id: daycareId,
        pricing_list_id: pricingListId || undefined,
        account_number: accountNumber || undefined,
        scheduled_date: parsedStartDate.toISOString().split('T')[0],
        end_date: parsedEndDate ? parsedEndDate.toISOString().split('T')[0] : undefined,
        arrival_time: formattedArrivalTime,
        scheduled_time: formattedTime,
        notes: notes || undefined,
        gallery_password: galleryPassword || undefined,
        status: 'scheduled',
      };

      if (session) {
        await updateSession(session.id, sessionData);
        Alert.alert('Success', 'Session updated!');
      } else {
        await addSession(sessionData);
        Alert.alert('Success', 'Session added!');
      }
      onSuccess();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.header, { paddingTop: insets.top + 12, paddingBottom: 12 }]}>
          <Pressable onPress={onClose} disabled={loading}>
            <Text style={styles.closeBtn}>Cancel</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{session ? 'Edit Session' : 'Add Session'}</Text>
          <Pressable
            onPress={handleSubmit}
            disabled={loading || !startDate.trim()}
            style={[styles.saveBtn, (!startDate.trim()) && styles.saveBtnDisabled]}
          >
            <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Save'}</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.form}>
          {!session && (
            <>
              <Text style={styles.label}>Season</Text>
              <View style={styles.seasonRow}>
                <Pressable
                  style={[styles.seasonButton, season === 'F' && styles.seasonButtonActive]}
                  onPress={() => setSeason('F')}
                  disabled={loading}
                >
                  <Text style={[styles.seasonButtonText, season === 'F' && styles.seasonButtonTextActive]}>
                    Fall
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.seasonButton, season === 'W' && styles.seasonButtonActive]}
                  onPress={() => setSeason('W')}
                  disabled={loading}
                >
                  <Text style={[styles.seasonButtonText, season === 'W' && styles.seasonButtonTextActive]}>
                    Winter
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.seasonButton, season === 'SP' && styles.seasonButtonActive]}
                  onPress={() => setSeason('SP')}
                  disabled={loading}
                >
                  <Text style={[styles.seasonButtonText, season === 'SP' && styles.seasonButtonTextActive]}>
                    Spring
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.seasonButton, season === 'SM' && styles.seasonButtonActive]}
                  onPress={() => setSeason('SM')}
                  disabled={loading}
                >
                  <Text style={[styles.seasonButtonText, season === 'SM' && styles.seasonButtonTextActive]}>
                    Summer
                  </Text>
                </Pressable>
              </View>
            </>
          )}

          <Text style={styles.label}>Account Number</Text>
          <View style={styles.accountNumberDisplay}>
            <Text style={styles.accountNumberText}>{accountNumber || '(auto-generated)'}</Text>
          </View>

          <Text style={styles.label}>Start Date *</Text>
          <View style={styles.dateRow}>
            <DateInput value={startDate} onChangeText={setStartDate} editable={!loading} />
          </View>

          <Text style={styles.label}>End Date</Text>
          <View style={styles.dateRow}>
            <DateInput value={endDate} onChangeText={setEndDate} editable={!loading} />
          </View>

          <Text style={styles.label}>Arrival Time</Text>
          <View style={styles.timeInputGroup}>
            <TextInput
              style={[styles.input, styles.timeInput]}
              placeholder="8:00"
              value={arrivalTime}
              onChangeText={(text) => setArrivalTime(formatTime12Hour(text))}
              keyboardType="number-pad"
              editable={!loading}
              maxLength={5}
            />
            <Pressable
              style={[styles.periodButton, arrivalPeriod === 'AM' && styles.periodButtonActive]}
              onPress={() => setArrivalPeriod('AM')}
              disabled={loading}
            >
              <Text style={[styles.periodButtonText, arrivalPeriod === 'AM' && styles.periodButtonTextActive]}>
                AM
              </Text>
            </Pressable>
            <Pressable
              style={[styles.periodButton, arrivalPeriod === 'PM' && styles.periodButtonActive]}
              onPress={() => setArrivalPeriod('PM')}
              disabled={loading}
            >
              <Text style={[styles.periodButtonText, arrivalPeriod === 'PM' && styles.periodButtonTextActive]}>
                PM
              </Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Start Time</Text>
          <View style={styles.timeInputGroup}>
            <TextInput
              style={[styles.input, styles.timeInput]}
              placeholder="8:00"
              value={time}
              onChangeText={(text) => setTime(formatTime12Hour(text))}
              keyboardType="number-pad"
              editable={!loading}
              maxLength={5}
            />
            <Pressable
              style={[styles.periodButton, period === 'AM' && styles.periodButtonActive]}
              onPress={() => setPeriod('AM')}
              disabled={loading}
            >
              <Text style={[styles.periodButtonText, period === 'AM' && styles.periodButtonTextActive]}>
                AM
              </Text>
            </Pressable>
            <Pressable
              style={[styles.periodButton, period === 'PM' && styles.periodButtonActive]}
              onPress={() => setPeriod('PM')}
              disabled={loading}
            >
              <Text style={[styles.periodButtonText, period === 'PM' && styles.periodButtonTextActive]}>
                PM
              </Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Pricing List (Optional)</Text>
          <Pressable
            style={styles.selectButton}
            onPress={() => setShowPricingOptions(!showPricingOptions)}
          >
            <Text style={styles.selectText}>
              {pricingListId
                ? pricingLists.find((p) => p.id === pricingListId)?.name || 'Select pricing'
                : 'Select pricing list'}
            </Text>
          </Pressable>

          {showPricingOptions && (
            <View style={styles.optionsList}>
              <Pressable
                style={[styles.optionItem, !pricingListId && styles.optionItemSelected]}
                onPress={() => {
                  setPricingListId(null);
                  setShowPricingOptions(false);
                }}
              >
                <Text style={[styles.optionText, !pricingListId && styles.optionTextSelected]}>
                  None
                </Text>
              </Pressable>
              {pricingLists.map((list) => (
                <Pressable
                  key={list.id}
                  style={[styles.optionItem, pricingListId === list.id && styles.optionItemSelected]}
                  onPress={() => {
                    setPricingListId(list.id);
                    setShowPricingOptions(false);
                  }}
                >
                  <Text style={[styles.optionText, pricingListId === list.id && styles.optionTextSelected]}>
                    {list.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <Text style={styles.label}>Gallery Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Auto-filled from settings"
            value={galleryPassword}
            onChangeText={setGalleryPassword}
            editable={!loading}
          />

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Session notes..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            editable={!loading}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  closeBtn: {
    fontSize: 16,
    color: '#0066cc',
    fontWeight: '500',
  },
  saveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: 16,
    color: '#0066cc',
    fontWeight: '600',
  },
  form: {
    flex: 1,
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
    marginBottom: 12,
  },
  textArea: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  selectButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    marginBottom: 12,
  },
  selectText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  optionsList: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
    overflow: 'hidden',
  },
  optionItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionItemSelected: {
    backgroundColor: '#e3f2fd',
  },
  optionText: {
    fontSize: 14,
    color: '#666',
  },
  optionTextSelected: {
    color: '#0066cc',
    fontWeight: '600',
  },
  timeInputGroup: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  timeInput: {
    flex: 1,
  },
  periodButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  periodButtonTextActive: {
    color: 'white',
  },
  accountNumberDisplay: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
    justifyContent: 'center',
  },
  accountNumberText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    fontFamily: 'monospace',
  },
  dateRow: {
    marginBottom: 12,
  },
  seasonRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  seasonButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seasonButtonActive: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  seasonButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  seasonButtonTextActive: {
    color: 'white',
  },
});
