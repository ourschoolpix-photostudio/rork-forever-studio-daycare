import { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useData } from '@/context/DataContext';
import PhotoPicker from '@/components/PhotoPicker';

interface DaycareFormProps {
  daycare?: any;
  onSuccess: () => void;
  showHeader?: boolean;
}

const DaycareForm = forwardRef(function DaycareForm({ daycare, onSuccess, showHeader = true }: DaycareFormProps, ref) {
  const insets = useSafeAreaInsets();
  const { addDaycare, updateDaycare, daycares } = useData();
  const [daycareIdNumber, setDaycareIdNumber] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [phone, setPhone] = useState('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [directorName, setDirectorName] = useState('');
  const [assistantDirectorName, setAssistantDirectorName] = useState('');
  const [email, setEmail] = useState('');
  const [classesMemo, setClassesMemo] = useState('');
  const [photoUri, setPhotoUri] = useState('');
  const [loading, setLoading] = useState(false);
  const isEditing = !!daycare;

  const getNextId = useCallback((): string => {
    if (daycares.length === 0) return '001';
    
    const ids = daycares
      .map((d) => parseInt(d.daycare_id_number || '0', 10))
      .filter((id) => !isNaN(id));
    
    if (ids.length === 0) return '001';
    const maxId = Math.max(...ids);
    return (maxId + 1).toString().padStart(3, '0');
  }, [daycares]);

  useEffect(() => {
    if (daycare) {
      setDaycareIdNumber(daycare.daycare_id_number || '');
      setName(daycare.name || '');
      setAddress(daycare.address || '');
      setCity(daycare.city || '');
      setState(daycare.state || '');
      setZipCode(daycare.zip_code || '');
      setPhone(daycare.phone?.replace(/\D/g, '') || '');
      setEnrollmentNumber(daycare.enrollment_number || '');
      setAgeRange(daycare.age_range || '');
      setDirectorName(daycare.director_name || '');
      setAssistantDirectorName(daycare.assistant_director_name || '');
      setEmail(daycare.email || '');
      setClassesMemo(daycare.classes_memo || '');
      setPhotoUri(daycare.photo_uri || '');
    } else {
      setDaycareIdNumber(getNextId());
    }
  }, [daycare, getNextId]);

  useImperativeHandle(ref, () => ({
    handleSubmit,
  }));

  const padIdNumber = (id: string): string => {
    const numericOnly = id.replace(/\D/g, '');
    if (numericOnly.length === 0) return '';
    const padded = numericOnly.padStart(3, '0');
    return padded.substring(0, 10);
  };

  const capitalizeWords = (text: string): string => {
    return text
      .split(' ')
      .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : ''))
      .join(' ');
  };

  const formatPhoneNumber = (text: string): string => {
    const numericOnly = text.replace(/\D/g, '');
    if (numericOnly.length <= 3) return numericOnly;
    if (numericOnly.length <= 6) return `(${numericOnly.slice(0, 3)}) ${numericOnly.slice(3)}`;
    return `(${numericOnly.slice(0, 3)}) ${numericOnly.slice(3, 6)}-${numericOnly.slice(6, 10)}`;
  };

  const handleSubmit = async () => {
    if (!daycareIdNumber.trim() || !name.trim()) {
      Alert.alert('Error', 'ID number and daycare name are required');
      return;
    }

    const paddedId = padIdNumber(daycareIdNumber);
    if (paddedId.length < 3) {
      Alert.alert('Error', 'ID number must be at least 3 digits');
      return;
    }

    const isDuplicate = daycares.some(
      (d) => d.daycare_id_number === paddedId && d.id !== daycare?.id
    );
    if (isDuplicate) {
      Alert.alert('Error', `ID number ${paddedId} is already in use. Please use a different ID.`);
      return;
    }

    setLoading(true);
    try {
      const daycareData = {
        user_id: '00000000-0000-0000-0000-000000000001',
        daycare_id_number: paddedId,
        name,
        address: address || undefined,
        city: city || undefined,
        state: state || undefined,
        zip_code: zipCode || undefined,
        phone: phone || undefined,
        email: email || undefined,
        enrollment_number: enrollmentNumber || undefined,
        age_range: ageRange || undefined,
        director_name: directorName || undefined,
        assistant_director_name: assistantDirectorName || undefined,
        classes_memo: classesMemo || undefined,
        photo_uri: photoUri || undefined,
      };

      if (daycare) {
        await updateDaycare(daycare.id, daycareData);
        onSuccess();
      } else {
        await addDaycare(daycareData);
        onSuccess();
      }
    } catch (err: any) {
      console.error('Failed to save daycare:', err.message || err);
      Alert.alert('Error', err.message || 'Failed to save daycare');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.outerContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {showHeader && (
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <Pressable
            style={[styles.headerIconButton, styles.saveButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Ionicons name="checkmark" size={18} color="white" />
          </Pressable>
          <Text style={styles.headerTitle}>{daycare ? 'Edit Daycare' : 'Add Daycare'}</Text>
          <Pressable
            style={[styles.headerIconButton, styles.closeButton]}
            onPress={onSuccess}
          >
            <Ionicons name="close" size={18} color="white" />
          </Pressable>
        </View>
      )}
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <PhotoPicker 
            photoUri={photoUri}
            onPhotoSelected={setPhotoUri}
            width="100%"
            height={120}
          />

          <Text style={styles.label}>ID Number * {!isEditing && '(Auto-assigned)'}</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.disabledInput]}
            placeholder="e.g., 1 or 12 or 123"
            value={daycareIdNumber}
            onChangeText={setDaycareIdNumber}
            keyboardType="number-pad"
            editable={isEditing && !loading}
          />
          {!isEditing && (
            <Text style={styles.helperText}>Automatically assigned: {daycareIdNumber}</Text>
          )}

          <Text style={styles.label}>Daycare Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter daycare name"
            value={name.toUpperCase()}
            onChangeText={(text) => setName(text.toUpperCase())}
            autoCapitalize="characters"
            editable={!loading}
          />

          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Street address"
            value={address}
            onChangeText={(text) => setAddress(capitalizeWords(text))}
            autoCapitalize="words"
            editable={!loading}
          />

          <View style={styles.row}>
            <View style={styles.halfColumn}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                placeholder="City"
                value={city}
                onChangeText={(text) => setCity(capitalizeWords(text))}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>
            <View style={styles.halfColumn}>
              <Text style={styles.label}>State (All Caps)</Text>
              <TextInput
                style={styles.input}
                placeholder="CA"
                value={state.toUpperCase()}
                onChangeText={(text) => setState(text.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2))}
                autoCapitalize="characters"
                editable={!loading}
                maxLength={2}
              />
            </View>
          </View>

          <Text style={styles.label}>ZIP Code</Text>
          <TextInput
            style={styles.input}
            placeholder="ZIP code"
            value={zipCode}
            onChangeText={setZipCode}
            keyboardType="number-pad"
            editable={!loading}
          />

          <Text style={styles.label}>Telephone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="(555) 555-5555"
            value={formatPhoneNumber(phone)}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            editable={!loading}
          />

          <Text style={styles.label}>Enrollment Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Number of enrolled children"
            value={enrollmentNumber}
            onChangeText={setEnrollmentNumber}
            keyboardType="number-pad"
            editable={!loading}
          />

          <Text style={styles.label}>Age Range</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 2-5 years"
            value={ageRange}
            onChangeText={(text) => setAgeRange(capitalizeWords(text))}
            autoCapitalize="words"
            editable={!loading}
          />

          <Text style={styles.label}>Director&apos;s Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Director full name"
            value={directorName}
            onChangeText={(text) => setDirectorName(capitalizeWords(text))}
            autoCapitalize="words"
            editable={!loading}
          />

          <Text style={styles.label}>Assistant Director&apos;s Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Assistant director full name"
            value={assistantDirectorName}
            onChangeText={(text) => setAssistantDirectorName(capitalizeWords(text))}
            autoCapitalize="words"
            editable={!loading}
          />

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="daycare@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />

          <Text style={styles.label}>Classes</Text>
          <TextInput
            style={[styles.input, { height: 160, textAlignVertical: 'top' }]}
            placeholder="Enter class information and notes"
            value={classesMemo}
            onChangeText={setClassesMemo}
            multiline
            editable={!loading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
});

export default DaycareForm;

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
    paddingHorizontal: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIconButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#34c759',
  },
  closeButton: {
    backgroundColor: '#ff3b30',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'center',
  },
  form: {
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 120,
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
    marginBottom: 4,
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  helperText: {
    fontSize: 12,
    color: '#0066cc',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfColumn: {
    flex: 1,
  },
  button: {
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
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});