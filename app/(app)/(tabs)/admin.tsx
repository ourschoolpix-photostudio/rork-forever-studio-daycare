import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView, ActivityIndicator, Modal, TextInput, SafeAreaView, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '@/context/DataContext';
import { createBackup, restoreBackup, getBackupInfo, getBackupsList, deleteBackup, createDeviceBackup, restoreDeviceBackup } from '@/utils/backupRestore';

export default function AdminScreen() {
  const { resetAllData, addDaycare, refresh } = useData();
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showBackupsModal, setShowBackupsModal] = useState(false);
  const [backups, setBackups] = useState<{ id: string; created_at: string; itemCount: number }[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [isBackingUpDevice, setIsBackingUpDevice] = useState(false);
  const [isRestoringDevice, setIsRestoringDevice] = useState(false);

  const RESET_PIN = '8650';

  useEffect(() => {
    if (showBackupsModal) {
      fetchBackups();
    }
  }, [showBackupsModal]);



  const fetchBackups = async () => {
    setLoadingBackups(true);
    try {
      console.log('[Admin] Fetching backups...');
      const backupsList = await getBackupsList();
      console.log('[Admin] Backups fetched:', backupsList.length);
      setBackups(backupsList);
    } catch (err: any) {
      console.error('[Admin] Error fetching backups:', err);
      console.error('[Admin] Error type:', typeof err, 'name:', err?.name);
      console.error('[Admin] Error constructor:', err?.constructor?.name);
      
      let errorMessage = 'Failed to load backups';
      if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else {
        errorMessage = 'Unknown error occurred. Please check console logs.';
      }
      
      Alert.alert('Error Loading Backups', errorMessage);
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleResetData = () => {
    setShowPinModal(true);
    setPin('');
    setPinError('');
  };

  const handleVerifyPin = async () => {
    if (pin !== RESET_PIN) {
      setPinError('Incorrect PIN');
      return;
    }

    setShowPinModal(false);
    setPin('');
    setPinError('');

    Alert.alert('Confirm Reset', 'This will delete all daycares, pricing lists, sessions, and sales. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete Everything',
        style: 'destructive',
        onPress: async () => {
          try {
            await resetAllData();
            Alert.alert('Success', 'All data has been cleared');
          } catch (err) {
            Alert.alert('Error', 'Failed to reset data');
          }
        },
      },
    ]);
  };

  const handleBulkLoad = async () => {
    if (!bulkText.trim()) {
      Alert.alert('Error', 'Please paste daycare data');
      return;
    }

    setIsLoading(true);
    console.log('[Admin] RAW BULK TEXT:', bulkText);
    console.log('[Admin] RAW BULK TEXT LENGTH:', bulkText.length);
    
    const allLines = bulkText.split('\n');
    console.log('[Admin] Total lines after split:', allLines.length);
    console.log('[Admin] All lines:', allLines.map((l, i) => `[${i}] "${l}" (trimmed: "${l.trim()}")`).join('\n'));
    
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    const daycares: string[][] = [];
    let currentDaycare: string[] = [];

    for (let i = 0; i < allLines.length; i++) {
      const line = allLines[i];
      const trimmed = line.trim();
      console.log(`[Admin] Processing line ${i}: "${line}" -> trimmed: "${trimmed}" (empty: ${trimmed === ''})`);
      
      if (trimmed === '') {
        if (currentDaycare.length > 0) {
          console.log('[Admin] BLANK LINE - saving daycare with fields:', currentDaycare);
          daycares.push(currentDaycare);
          currentDaycare = [];
        }
      } else {
        currentDaycare.push(trimmed);
        console.log('[Admin] Added field, currentDaycare now:', currentDaycare);
      }
    }
    if (currentDaycare.length > 0) {
      console.log('[Admin] END OF INPUT - saving final daycare with fields:', currentDaycare);
      daycares.push(currentDaycare);
    }

    console.log('[Admin] TOTAL DAYCARES PARSED:', daycares.length);
    daycares.forEach((dc, i) => console.log(`[Admin] Daycare ${i}:`, dc));

    for (let i = 0; i < daycares.length; i++) {
      const daycareLines = daycares[i];
      console.log(`\n[Admin] === Daycare ${i + 1}/${daycares.length} ===`);
      console.log('[Admin] Total fields:', daycareLines.length);
      daycareLines.forEach((field, idx) => console.log(`[Admin]   [${idx}]: "${field}"`));
      
      try {
        let address = '';
        let id = '';
        let name = '';
        let city = '';
        let state = '';
        let zipcode = '';
        let phone = '';
        let director = '';
        let enrollment = '';

        if (daycareLines.length >= 1) address = daycareLines[0];
        if (daycareLines.length >= 2) id = daycareLines[1];
        if (daycareLines.length >= 3) name = daycareLines[2];
        if (daycareLines.length >= 4) city = daycareLines[3];
        if (daycareLines.length >= 5) state = daycareLines[4];
        if (daycareLines.length >= 6) zipcode = daycareLines[5];
        if (daycareLines.length >= 7) phone = daycareLines[6];
        if (daycareLines.length >= 8) director = daycareLines[7];
        if (daycareLines.length >= 9) enrollment = daycareLines[8];

        console.log('[Admin] PARSED:', { address, id, name, city, state, zipcode, phone, director, enrollment });

        if (!name || !address) {
          const preview = daycareLines.slice(0, 3).join(' / ');
          console.log('[Admin] Skipping daycare - missing name or address:', preview);
          continue;
        }

        const newDaycare: any = {
          user_id: '00000000-0000-0000-0000-000000000001',
          name: name.replace(/\b\w/g, l => l.toUpperCase()),
          address: address.replace(/\b\w/g, l => l.toUpperCase()),
        };

        if (id) newDaycare.daycare_id_number = id;
        if (city) newDaycare.city = city.replace(/\b\w/g, l => l.toUpperCase());
        if (state) newDaycare.state = state.toUpperCase();
        if (zipcode) newDaycare.zip_code = zipcode;
        if (phone) newDaycare.phone = phone;
        if (director) newDaycare.director_name = director.replace(/\b\w/g, l => l.toUpperCase());
        if (enrollment) newDaycare.enrollment_number = enrollment;

        await addDaycare(newDaycare);
        successCount++;
      } catch (err: any) {
        console.error('[Admin] Bulk load error:', err);
        const preview = daycareLines.slice(0, 2).join(' / ');
        errors.push(`"${preview}" - ${err.message}`);
        errorCount++;
      }
    }

    setIsLoading(false);
    setBulkText('');
    setShowBulkModal(false);

    let message = `Loaded ${successCount} daycare${successCount !== 1 ? 's' : ''}`;
    if (errorCount > 0) {
      message += `\n\n${errorCount} error${errorCount !== 1 ? 's' : ''}:\n${errors.slice(0, 3).join('\n')}`;
      if (errors.length > 3) message += `\n... and ${errors.length - 3} more`;
    }

    Alert.alert('Bulk Load Complete', message);
  };

  const handleBackup = async () => {
    try {
      const info = await getBackupInfo();
      const itemCount = info?.itemCount || 0;
      
      Alert.alert(
        'Create Backup',
        `This will save a backup to the cloud with ${itemCount} total items (daycares, sessions, sales, etc.). You can restore it later.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Create Backup',
            onPress: async () => {
              setIsBackingUp(true);
              try {
                const backupId = await createBackup();
                console.log('[Admin] Backup created:', backupId);
                Alert.alert('Success', 'Backup saved to cloud successfully!');
              } catch (err: any) {
                console.error('[Admin] Backup error:', err);
                Alert.alert('Error', err.message || 'Failed to create backup');
              } finally {
                setIsBackingUp(false);
              }
            },
          },
        ]
      );
    } catch (err) {
      console.error('[Admin] Backup info error:', err);
      Alert.alert('Error', 'Failed to prepare backup');
    }
  };

  const handleRestore = async () => {
    Alert.alert(
      'Restore Options',
      'Choose where to restore from:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Device Backup',
          onPress: handleRestoreFromDevice,
        },
        {
          text: 'Cloud Backup',
          onPress: () => setShowBackupsModal(true),
        },
      ]
    );
  };

  const handleBackupToDevice = async () => {
    try {
      const info = await getBackupInfo();
      const itemCount = info?.itemCount || 0;
      
      Alert.alert(
        'Create Device Backup',
        `This will save a backup to this device with ${itemCount} total items. This backup will be stored locally and can be used if cloud restore fails.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Create Backup',
            onPress: async () => {
              setIsBackingUpDevice(true);
              try {
                await createDeviceBackup();
                console.log('[Admin] Device backup created');
                Alert.alert('Success', 'Backup file saved! You can now save it to your device.');
              } catch (err: any) {
                console.error('[Admin] Device backup error:', err);
                Alert.alert('Error', err.message || 'Failed to create device backup');
              } finally {
                setIsBackingUpDevice(false);
              }
            },
          },
        ]
      );
    } catch (err) {
      console.error('[Admin] Device backup info error:', err);
      Alert.alert('Error', 'Failed to prepare backup');
    }
  };

  const handleRestoreFromDevice = async () => {
    Alert.alert(
      'Restore from Device',
      'This will replace ALL current data with data from the backup file you select. Current data will be lost. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Select Backup File',
          style: 'destructive',
          onPress: async () => {
            setIsRestoringDevice(true);
            try {
              await restoreDeviceBackup();
              await refresh();
              Alert.alert('Success', 'Data restored from device backup successfully');
            } catch (err: any) {
              console.error('[Admin] Device restore error:', err);
              if (err.message === 'File selection cancelled') {
                return;
              }
              Alert.alert('Error', err.message || 'Failed to restore from device backup');
            } finally {
              setIsRestoringDevice(false);
            }
          },
        },
      ]
    );
  };

  const handleRestoreBackup = async (backupId: string, timestamp: string) => {
    Alert.alert(
      'Restore Backup',
      `This will replace ALL current data with data from backup created on ${new Date(timestamp).toLocaleString()}. Current data will be lost. Are you sure?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            setIsRestoring(true);
            try {
              await restoreBackup(backupId);
              await refresh();
              setShowBackupsModal(false);
              Alert.alert('Success', 'Data restored from backup successfully');
            } catch (err: any) {
              console.error('[Admin] Restore error:', err);
              Alert.alert('Error', err.message || 'Failed to restore backup');
            } finally {
              setIsRestoring(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteBackup = async (backupId: string, timestamp: string) => {
    Alert.alert(
      'Delete Backup',
      `Are you sure you want to delete the backup from ${new Date(timestamp).toLocaleString()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBackup(backupId);
              await fetchBackups();
              Alert.alert('Success', 'Backup deleted successfully');
            } catch (err: any) {
              console.error('[Admin] Delete error:', err);
              Alert.alert('Error', err.message || 'Failed to delete backup');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Backup & Restore</Text>

          <Pressable
            style={[styles.button, styles.backupButton]}
            onPress={handleBackup}
            disabled={isBackingUp}
          >
            {isBackingUp ? (
              <ActivityIndicator size="small" color="#0066cc" />
            ) : (
              <Ionicons name="cloud-download-outline" size={20} color="#0066cc" />
            )}
            <Text style={styles.backupButtonText}>
              {isBackingUp ? 'Creating Backup...' : 'Create Backup'}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.restoreButton]}
            onPress={handleRestore}
            disabled={isRestoring || isRestoringDevice}
          >
            {(isRestoring || isRestoringDevice) ? (
              <ActivityIndicator size="small" color="#ff9500" />
            ) : (
              <Ionicons name="cloud-upload-outline" size={20} color="#ff9500" />
            )}
            <Text style={styles.restoreButtonText}>
              {(isRestoring || isRestoringDevice) ? 'Restoring...' : 'Restore Backup'}
            </Text>
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Device Backup (Offline)</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            style={[styles.button, styles.deviceBackupButton]}
            onPress={handleBackupToDevice}
            disabled={isBackingUpDevice}
          >
            {isBackingUpDevice ? (
              <ActivityIndicator size="small" color="#8e44ad" />
            ) : (
              <Ionicons name="phone-portrait-outline" size={20} color="#8e44ad" />
            )}
            <Text style={styles.deviceBackupButtonText}>
              {isBackingUpDevice ? 'Creating Backup...' : 'Backup to Device'}
            </Text>
          </Pressable>

          <View style={styles.deviceBackupInfo}>
            <Ionicons name="information-circle-outline" size={16} color="#666" />
            <Text style={styles.deviceBackupInfoText}>
              Backup files are saved as JSON files that you can store anywhere on your device. Use this if cloud backup fails.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bulk Operations</Text>

          <Pressable
            style={[styles.button, styles.bulkButton]}
            onPress={() => {
              setBulkText('');
              setShowBulkModal(true);
            }}
          >
            <Ionicons name="add-circle" size={20} color="#16a34a" />
            <Text style={styles.bulkButtonText}>Bulk Load Daycares</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>

          <Pressable style={[styles.button, styles.dangerButton]} onPress={handleResetData}>
            <View style={styles.deleteCircle}>
              <Ionicons name="close" size={16} color="white" />
            </View>
            <Text style={styles.dangerButtonText}>Reset All Data</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={showPinModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPinModal(false)}
      >
        <View style={styles.pinModalOverlay}>
          <View style={styles.pinModal}>
            <Text style={styles.pinModalTitle}>Enter PIN to Confirm</Text>
            <TextInput
              style={styles.pinInput}
              placeholder="0000"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              secureTextEntry={false}
              maxLength={4}
              value={pin}
              onChangeText={(text) => {
                setPin(text);
                setPinError('');
              }}
            />
            {pinError ? <Text style={styles.pinError}>{pinError}</Text> : null}
            <View style={styles.pinButtonContainer}>
              <Pressable
                style={[styles.pinButton, styles.pinButtonCancel]}
                onPress={() => setShowPinModal(false)}
              >
                <Text style={styles.pinButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.pinButton, styles.pinButtonConfirm]}
                onPress={handleVerifyPin}
              >
                <Text style={[styles.pinButtonText, styles.pinConfirmText]}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showBulkModal}
        animationType="slide"
        onRequestClose={() => !isLoading && setShowBulkModal(false)}
      >
        <SafeAreaView style={styles.bulkModalContainer}>
          <View style={styles.bulkModalHeader}>
            <Pressable onPress={() => !isLoading && setShowBulkModal(false)} disabled={isLoading}>
              <Text style={styles.bulkModalHeaderButton}>Cancel</Text>
            </Pressable>
            <Text style={styles.bulkModalTitle}>Bulk Load Daycares</Text>
            <Pressable onPress={handleBulkLoad} disabled={isLoading || !bulkText.trim()}>
              <Text style={[styles.bulkModalHeaderButton, (!bulkText.trim() || isLoading) && styles.disabledButton]}>
                {isLoading ? 'Loading...' : 'Load'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.bulkModalInfo}>
            <Text style={styles.bulkModalInfoText}>One field per line. Leave blank line between daycares:</Text>
            <Text style={styles.bulkModalFormat}>Address</Text>
            <Text style={styles.bulkModalFormat}>ID</Text>
            <Text style={styles.bulkModalFormat}>Daycare Name</Text>
            <Text style={styles.bulkModalFormat}>City</Text>
            <Text style={styles.bulkModalFormat}>State</Text>
            <Text style={styles.bulkModalFormat}>Zipcode</Text>
            <Text style={styles.bulkModalFormat}>Phone</Text>
            <Text style={styles.bulkModalFormat}>Director Name</Text>
            <Text style={styles.bulkModalFormat}>Enrollment Number</Text>
            <Text style={[styles.bulkModalInfoText, { marginTop: 8 }]}>Example:</Text>
            <Text style={styles.bulkModalFormat}>123 Main Street{'\n'}001{'\n'}ABC Learning{'\n'}Fairfax{'\n'}VA{'\n'}22151{'\n'}7031234567{'\n'}Diane Smith{'\n'}24</Text>
          </View>

          <TextInput
            style={styles.bulkModalTextInput}
            placeholder="Paste data here (one field per line, blank line between daycares)"
            value={bulkText}
            onChangeText={setBulkText}
            multiline
            editable={!isLoading}
            placeholderTextColor="#999"
          />
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showBackupsModal}
        animationType="slide"
        onRequestClose={() => !isRestoring && setShowBackupsModal(false)}
      >
        <SafeAreaView style={styles.backupsModalContainer}>
          <View style={styles.backupsModalHeader}>
            <Pressable onPress={() => !isRestoring && setShowBackupsModal(false)} disabled={isRestoring}>
              <Text style={styles.backupsModalHeaderButton}>Close</Text>
            </Pressable>
            <Text style={styles.backupsModalTitle}>Cloud Backups</Text>
            <View style={{ width: 60 }} />
          </View>

          {loadingBackups ? (
            <View style={styles.backupsLoading}>
              <ActivityIndicator size="large" color="#0066cc" />
              <Text style={styles.backupsLoadingText}>Loading backups...</Text>
            </View>
          ) : backups.length === 0 ? (
            <View style={styles.backupsEmpty}>
              <Ionicons name="cloud-offline-outline" size={64} color="#ccc" />
              <Text style={styles.backupsEmptyText}>No backups found</Text>
              <Text style={styles.backupsEmptySubtext}>Create a backup to get started</Text>
            </View>
          ) : (
            <FlatList
              data={backups}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.backupsList}
              renderItem={({ item }) => (
                <View style={styles.backupItem}>
                  <View style={styles.backupItemInfo}>
                    <View style={styles.backupIconContainer}>
                      <Ionicons name="cloud-done-outline" size={24} color="#0066cc" />
                    </View>
                    <View style={styles.backupItemText}>
                      <Text style={styles.backupItemDate}>
                        {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString()}
                      </Text>
                      <Text style={styles.backupItemCount}>{item.itemCount} items</Text>
                    </View>
                  </View>
                  <View style={styles.backupItemActions}>
                    <Pressable
                      style={styles.backupActionButton}
                      onPress={() => handleRestoreBackup(item.id, item.created_at)}
                      disabled={isRestoring}
                    >
                      <Ionicons name="download-outline" size={20} color="#0066cc" />
                    </Pressable>
                    <Pressable
                      style={styles.backupActionButton}
                      onPress={() => handleDeleteBackup(item.id, item.created_at)}
                      disabled={isRestoring}
                    >
                      <Ionicons name="trash-outline" size={20} color="#ff3b30" />
                    </Pressable>
                  </View>
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  button: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    gap: 12,
    marginBottom: 12,
  },

  dangerButton: {
    backgroundColor: '#fff5f5',
    borderColor: '#ff3b30',
  },
  dangerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff3b30',
  },
  deleteCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bulkButton: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
  },
  bulkButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  backupButton: {
    backgroundColor: '#f0f7ff',
    borderColor: '#0066cc',
  },
  backupButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066cc',
  },
  restoreButton: {
    backgroundColor: '#fff8f0',
    borderColor: '#ff9500',
  },
  restoreButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff9500',
  },
  bulkModalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  bulkModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  bulkModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  bulkModalHeaderButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066cc',
    paddingHorizontal: 12,
  },
  disabledButton: {
    opacity: 0.5,
    color: '#999',
  },
  bulkModalInfo: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  bulkModalInfoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  bulkModalFormat: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  bulkModalTextInput: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 12,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  pinModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 300,
  },
  pinModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  pinInput: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
    color: '#1a1a1a',
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 12,
  },
  pinError: {
    color: '#ff3b30',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  pinButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  pinButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinButtonCancel: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pinButtonConfirm: {
    backgroundColor: '#ff3b30',
  },
  pinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  pinConfirmText: {
    color: 'white',
  },
  backupsModalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  backupsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  backupsModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  backupsModalHeaderButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066cc',
    paddingHorizontal: 12,
  },
  backupsLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  backupsLoadingText: {
    fontSize: 14,
    color: '#666',
  },
  backupsEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  backupsEmptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  backupsEmptySubtext: {
    fontSize: 14,
    color: '#666',
  },
  backupsList: {
    padding: 16,
  },
  backupItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  backupItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backupIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backupItemText: {
    flex: 1,
  },
  backupItemDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  backupItemCount: {
    fontSize: 12,
    color: '#666',
  },
  backupItemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  backupActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  deviceBackupButton: {
    backgroundColor: '#f4f0ff',
    borderColor: '#8e44ad',
  },
  deviceBackupButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#8e44ad',
  },
  divider: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    fontSize: 12,
    color: '#999',
    marginHorizontal: 12,
    fontWeight: '500' as const,
  },
  deviceBackupInfo: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginTop: 8,
  },
  deviceBackupInfoText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
});
