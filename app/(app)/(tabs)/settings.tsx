import { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, TextInput, KeyboardAvoidingView, Platform, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';

const GALLERY_PASSWORD_KEY = 'app_gallery_password';
const SEASON_KEY = 'app_selected_season';
const SESSION_CARD_COLOR_KEY = 'app_session_card_color';
const YEAR_SEASON_COLORS_KEY = 'app_year_season_colors';
const AUTO_EXPENSE_KEY = 'app_auto_expense';

interface AutoExpenseSettings {
  photographerCost: string;
}

type YearSeasonColors = Record<string, number>;

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

const SEASONS = ['F', 'SP'] as const;
const SEASON_LABELS: Record<string, string> = {
  F: 'Fall',
  SP: 'Spring',
};

function generateYearSeasonOptions(): string[] {
  const currentYear = new Date().getFullYear();
  const options: string[] = [];
  for (let year = currentYear - 1; year <= currentYear + 2; year++) {
    for (const season of SEASONS) {
      options.push(`${year}-${season}`);
    }
  }
  return options;
}

export default function SettingsScreen() {
  const { signOut, user } = useAuth();
  const navigation = useNavigation();
  const [galleryPassword, setGalleryPassword] = useState('');
  const [season, setSeason] = useState<'F' | 'W' | 'SP' | 'SM' | null>(null);
  const [selectedCardColor, setSelectedCardColor] = useState(0);
  const [yearSeasonColors, setYearSeasonColors] = useState<YearSeasonColors>({});
  const [editingYearSeason, setEditingYearSeason] = useState<string | null>(null);

  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [isSeasonModalVisible, setIsSeasonModalVisible] = useState(false);
  const [isColorModalVisible, setIsColorModalVisible] = useState(false);
  const [isYearSeasonColorModalVisible, setIsYearSeasonColorModalVisible] = useState(false);
  const [isAutoExpenseModalVisible, setIsAutoExpenseModalVisible] = useState(false);
  const [photographerCost, setPhotographerCost] = useState('');

  const yearSeasonOptions = generateYearSeasonOptions();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable 
          style={{ paddingLeft: 12 }}
          onPress={() => router.push('/')}
        >
          <Ionicons name="home" size={24} color="#0066cc" />
        </Pressable>
      ),
      headerRight: () => (
        <Pressable 
          style={{ paddingRight: 12 }}
          onPress={() => {
            Alert.alert('Log Out', 'Are you sure you want to log out?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Log Out',
                style: 'destructive',
                onPress: async () => {
                  await signOut();
                },
              },
            ]);
          }}
        >
          <Ionicons name="log-out" size={24} color="#ff3b30" />
        </Pressable>
      ),
    });
  }, [navigation, signOut]);

  useEffect(() => {
    loadGalleryPassword();
    loadSeason();
    loadCardColor();
    loadYearSeasonColors();
    loadAutoExpense();
  }, []);

  const loadGalleryPassword = async () => {
    try {
      const saved = await AsyncStorage.getItem(GALLERY_PASSWORD_KEY);
      if (saved) {
        setGalleryPassword(saved);
      }
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

  const saveSeason = async (selectedSeason: 'F' | 'W' | 'SP' | 'SM' | null) => {
    try {
      if (selectedSeason) {
        await AsyncStorage.setItem(SEASON_KEY, selectedSeason);
      } else {
        await AsyncStorage.removeItem(SEASON_KEY);
      }
    } catch (err) {
      console.error('Failed to save season:', err);
    }
  };

  const loadCardColor = async () => {
    try {
      const saved = await AsyncStorage.getItem(SESSION_CARD_COLOR_KEY);
      if (saved) {
        setSelectedCardColor(parseInt(saved));
      }
    } catch (err) {
      console.error('Failed to load card color:', err);
    }
  };

  const saveCardColor = async (colorIndex: number) => {
    try {
      await AsyncStorage.setItem(SESSION_CARD_COLOR_KEY, colorIndex.toString());
      setSelectedCardColor(colorIndex);
    } catch (err) {
      console.error('Failed to save card color:', err);
    }
  };

  const loadYearSeasonColors = async () => {
    try {
      const saved = await AsyncStorage.getItem(YEAR_SEASON_COLORS_KEY);
      if (saved) {
        setYearSeasonColors(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Failed to load year/season colors:', err);
    }
  };

  const saveYearSeasonColor = async (yearSeason: string, colorIndex: number) => {
    try {
      const updated = { ...yearSeasonColors, [yearSeason]: colorIndex };
      if (colorIndex === 0) {
        delete updated[yearSeason];
      }
      await AsyncStorage.setItem(YEAR_SEASON_COLORS_KEY, JSON.stringify(updated));
      setYearSeasonColors(updated);
    } catch (err) {
      console.error('Failed to save year/season color:', err);
    }
  };

  const formatYearSeasonLabel = (yearSeason: string) => {
    const [year, season] = yearSeason.split('-');
    return `${year} ${SEASON_LABELS[season] || season}`;
  };

  const loadAutoExpense = async () => {
    try {
      const saved = await AsyncStorage.getItem(AUTO_EXPENSE_KEY);
      if (saved) {
        const settings: AutoExpenseSettings = JSON.parse(saved);
        setPhotographerCost(settings.photographerCost || '');
      }
    } catch (err) {
      console.error('Failed to load auto expense settings:', err);
    }
  };

  const saveAutoExpense = async (cost: string) => {
    try {
      const settings: AutoExpenseSettings = {
        photographerCost: cost,
      };
      await AsyncStorage.setItem(AUTO_EXPENSE_KEY, JSON.stringify(settings));
      setPhotographerCost(cost);
    } catch (err) {
      console.error('Failed to save auto expense settings:', err);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const saveGalleryPassword = async (password: string) => {
    try {
      if (password.trim()) {
        await AsyncStorage.setItem(GALLERY_PASSWORD_KEY, password);
      } else {
        await AsyncStorage.removeItem(GALLERY_PASSWORD_KEY);
      }
    } catch (err) {
      console.error('Failed to save gallery password:', err);
      Alert.alert('Error', 'Failed to save password');
    }
  };

  const getSeasonLabel = () => {
    if (!season) return 'Not set';
    const labels: Record<string, string> = {
      F: 'Fall',
      W: 'Winter',
      SP: 'Spring',
      SM: 'Summer',
    };
    return labels[season] || season;
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Global Details</Text>
          
          <Pressable 
            style={styles.settingButton}
            onPress={() => setIsPasswordModalVisible(true)}
          >
            <View style={styles.settingButtonLeft}>
              <Ionicons name="lock-closed" size={20} color="#0066cc" />
              <Text style={styles.settingButtonLabel}>Gallery Password</Text>
            </View>
            <View style={styles.settingButtonRight}>
              <Text style={styles.settingButtonValue}>
                {galleryPassword || 'Not set'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </View>
          </Pressable>

          <Pressable 
            style={styles.settingButton}
            onPress={() => setIsSeasonModalVisible(true)}
          >
            <View style={styles.settingButtonLeft}>
              <Ionicons name="calendar" size={20} color="#0066cc" />
              <Text style={styles.settingButtonLabel}>Season</Text>
            </View>
            <View style={styles.settingButtonRight}>
              <Text style={styles.settingButtonValue}>{getSeasonLabel()}</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </View>
          </Pressable>

          <Pressable 
            style={styles.settingButton}
            onPress={() => setIsYearSeasonColorModalVisible(true)}
          >
            <View style={styles.settingButtonLeft}>
              <Ionicons name="color-palette" size={20} color="#0066cc" />
              <Text style={styles.settingButtonLabel}>Card Highlight Colors</Text>
            </View>
            <View style={styles.settingButtonRight}>
              <View style={styles.colorPreviewRow}>
                {Object.entries(yearSeasonColors).slice(0, 3).map(([key, colorIdx]) => (
                  <View
                    key={key}
                    style={[
                      styles.colorPreviewSmall,
                      {
                        backgroundColor: CARD_COLORS[colorIdx]?.bg || 'white',
                        borderColor: CARD_COLORS[colorIdx]?.border || '#e0e0e0',
                      }
                    ]}
                  />
                ))}
                {Object.keys(yearSeasonColors).length === 0 && (
                  <Text style={styles.settingButtonValue}>Not set</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </View>
          </Pressable>

          <Pressable 
            style={styles.settingButton}
            onPress={() => router.push('/email-templates')}
          >
            <View style={styles.settingButtonLeft}>
              <Ionicons name="mail" size={20} color="#0066cc" />
              <Text style={styles.settingButtonLabel}>Email Settings</Text>
            </View>
            <View style={styles.settingButtonRight}>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </View>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Auto Expense</Text>
          
          <Pressable 
            style={styles.settingButton}
            onPress={() => setIsAutoExpenseModalVisible(true)}
          >
            <View style={styles.settingButtonLeft}>
              <Ionicons name="camera" size={20} color="#0066cc" />
              <Text style={styles.settingButtonLabel}>Photographer</Text>
            </View>
            <View style={styles.settingButtonRight}>
              <Text style={styles.settingButtonValue}>
                {photographerCost ? `${photographerCost}` : 'Not set'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </View>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Info</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Purpose</Text>
            <Text style={styles.infoValue}>Sales Tracking</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>User</Text>
            <Text style={styles.infoValue}>{user?.id ? 'Logged in' : 'Not logged in'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Pressable 
            style={styles.logoutButton}
            onPress={() => {
              Alert.alert('Log Out', 'Are you sure you want to log out?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Log Out',
                  style: 'destructive',
                  onPress: async () => {
                    await signOut();
                  },
                },
              ]);
            }}
          >
            <Ionicons name="log-out" size={18} color="#ff3b30" />
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={isPasswordModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsPasswordModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.floatingModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable 
            style={styles.floatingModalOverlay}
            onPress={() => setIsPasswordModalVisible(false)}
          >
            <Pressable style={styles.floatingModalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Gallery Password</Text>
                <Pressable onPress={() => setIsPasswordModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </Pressable>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.modalLabel}>Enter password for gallery access:</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter gallery password"
                  value={galleryPassword}
                  onChangeText={setGalleryPassword}
                  autoFocus={true}
                />
              </View>

              <View style={styles.modalFooter}>
                <Pressable
                  style={styles.modalCancelButton}
                  onPress={() => setIsPasswordModalVisible(false)}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={styles.modalSaveButton}
                  onPress={async () => {
                    await saveGalleryPassword(galleryPassword);
                    Alert.alert('Saved', 'Gallery password updated');
                    setIsPasswordModalVisible(false);
                  }}
                >
                  <Text style={styles.modalSaveButtonText}>Save</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={isSeasonModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsSeasonModalVisible(false)}
      >
        <Pressable 
          style={styles.floatingModalOverlay}
          onPress={() => setIsSeasonModalVisible(false)}
        >
          <Pressable style={styles.floatingModalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Season</Text>
              <Pressable onPress={() => setIsSeasonModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Choose your current season:</Text>
              <View style={styles.seasonButtonsGroup}>
                <Pressable
                  style={[styles.seasonButton, season === 'F' && styles.seasonButtonActive]}
                  onPress={() => {
                    const newSeason = season === 'F' ? null : 'F';
                    setSeason(newSeason);
                    saveSeason(newSeason);
                  }}
                >
                  <Text style={[styles.seasonButtonText, season === 'F' && styles.seasonButtonTextActive]}>F</Text>
                  <Text style={[styles.seasonButtonSubtext, season === 'F' && styles.seasonButtonTextActive]}>Fall</Text>
                </Pressable>
                <Pressable
                  style={[styles.seasonButton, season === 'W' && styles.seasonButtonActive]}
                  onPress={() => {
                    const newSeason = season === 'W' ? null : 'W';
                    setSeason(newSeason);
                    saveSeason(newSeason);
                  }}
                >
                  <Text style={[styles.seasonButtonText, season === 'W' && styles.seasonButtonTextActive]}>W</Text>
                  <Text style={[styles.seasonButtonSubtext, season === 'W' && styles.seasonButtonTextActive]}>Winter</Text>
                </Pressable>
                <Pressable
                  style={[styles.seasonButton, season === 'SP' && styles.seasonButtonActive]}
                  onPress={() => {
                    const newSeason = season === 'SP' ? null : 'SP';
                    setSeason(newSeason);
                    saveSeason(newSeason);
                  }}
                >
                  <Text style={[styles.seasonButtonText, season === 'SP' && styles.seasonButtonTextActive]}>SP</Text>
                  <Text style={[styles.seasonButtonSubtext, season === 'SP' && styles.seasonButtonTextActive]}>Spring</Text>
                </Pressable>
                <Pressable
                  style={[styles.seasonButton, season === 'SM' && styles.seasonButtonActive]}
                  onPress={() => {
                    const newSeason = season === 'SM' ? null : 'SM';
                    setSeason(newSeason);
                    saveSeason(newSeason);
                  }}
                >
                  <Text style={[styles.seasonButtonText, season === 'SM' && styles.seasonButtonTextActive]}>SM</Text>
                  <Text style={[styles.seasonButtonSubtext, season === 'SM' && styles.seasonButtonTextActive]}>Summer</Text>
                </Pressable>
              </View>
              <Text style={styles.modalHint}>Tap again to deselect</Text>
            </View>

            <View style={styles.modalFooter}>
              <Pressable
                style={styles.modalSaveButton}
                onPress={() => setIsSeasonModalVisible(false)}
              >
                <Text style={styles.modalSaveButtonText}>Done</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={isYearSeasonColorModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsYearSeasonColorModalVisible(false)}
      >
        <Pressable 
          style={styles.floatingModalOverlay}
          onPress={() => setIsYearSeasonColorModalVisible(false)}
        >
          <Pressable style={styles.yearSeasonModalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Card Highlight Colors</Text>
              <Pressable onPress={() => setIsYearSeasonColorModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </Pressable>
            </View>

            <ScrollView style={styles.yearSeasonModalBody}>
              <Text style={styles.modalLabel}>Set a color for each year/season. Cards will show the color of their most recent session.</Text>
              {yearSeasonOptions.map((yearSeason) => {
                const colorIdx = yearSeasonColors[yearSeason] || 0;
                const color = CARD_COLORS[colorIdx];
                return (
                  <Pressable
                    key={yearSeason}
                    style={styles.yearSeasonRow}
                    onPress={() => {
                      setEditingYearSeason(yearSeason);
                      setIsYearSeasonColorModalVisible(false);
                      setTimeout(() => setIsColorModalVisible(true), 100);
                    }}
                  >
                    <Text style={styles.yearSeasonLabel}>{formatYearSeasonLabel(yearSeason)}</Text>
                    <View style={styles.yearSeasonRight}>
                      <View
                        style={[
                          styles.colorPreview,
                          {
                            backgroundColor: color.bg,
                            borderColor: color.border,
                          }
                        ]}
                      />
                      <Text style={styles.yearSeasonColorName}>{color.name}</Text>
                      <Ionicons name="chevron-forward" size={18} color="#999" />
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={styles.modalSaveButton}
                onPress={() => setIsYearSeasonColorModalVisible(false)}
              >
                <Text style={styles.modalSaveButtonText}>Done</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={isColorModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setIsColorModalVisible(false);
          if (editingYearSeason) {
            setTimeout(() => setIsYearSeasonColorModalVisible(true), 100);
          }
          setEditingYearSeason(null);
        }}
      >
        <Pressable 
          style={styles.floatingModalOverlay}
          onPress={() => setIsColorModalVisible(false)}
        >
          <Pressable style={styles.floatingModalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingYearSeason ? formatYearSeasonLabel(editingYearSeason) : 'Select Color'}
              </Text>
              <Pressable onPress={() => {
                setIsColorModalVisible(false);
                if (editingYearSeason) {
                  setTimeout(() => setIsYearSeasonColorModalVisible(true), 100);
                }
                setEditingYearSeason(null);
              }}>
                <Ionicons name="close" size={24} color="#666" />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Select highlight color:</Text>
              <View style={styles.colorGrid}>
                {CARD_COLORS.map((color, index) => {
                  const isSelected = editingYearSeason
                    ? (yearSeasonColors[editingYearSeason] || 0) === index
                    : selectedCardColor === index;
                  return (
                    <Pressable
                      key={index}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color.bg, borderColor: color.border },
                        isSelected && styles.colorOptionSelected,
                      ]}
                      onPress={() => {
                        if (editingYearSeason) {
                          saveYearSeasonColor(editingYearSeason, index);
                        } else {
                          saveCardColor(index);
                        }
                      }}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={28} color="#0066cc" />
                      )}
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.colorName}>
                {CARD_COLORS[editingYearSeason ? (yearSeasonColors[editingYearSeason] || 0) : selectedCardColor].name}
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <Pressable
                style={styles.modalSaveButton}
                onPress={() => {
                  setIsColorModalVisible(false);
                  if (editingYearSeason) {
                    setTimeout(() => setIsYearSeasonColorModalVisible(true), 100);
                  }
                  setEditingYearSeason(null);
                }}
              >
                <Text style={styles.modalSaveButtonText}>Done</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={isAutoExpenseModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsAutoExpenseModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.floatingModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable 
            style={styles.floatingModalOverlay}
            onPress={() => setIsAutoExpenseModalVisible(false)}
          >
            <Pressable style={styles.floatingModalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Photographer Cost</Text>
                <Pressable onPress={() => setIsAutoExpenseModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </Pressable>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.modalLabel}>Enter default photographer cost per session:</Text>
                <View style={styles.currencyInputContainer}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.currencyInput}
                    placeholder="0.00"
                    value={photographerCost}
                    onChangeText={setPhotographerCost}
                    keyboardType="decimal-pad"
                    autoFocus={true}
                  />
                </View>
              </View>

              <View style={styles.modalFooter}>
                <Pressable
                  style={styles.modalCancelButton}
                  onPress={() => setIsAutoExpenseModalVisible(false)}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={styles.modalSaveButton}
                  onPress={async () => {
                    await saveAutoExpense(photographerCost);
                    Alert.alert('Saved', 'Photographer cost updated');
                    setIsAutoExpenseModalVisible(false);
                  }}
                >
                  <Text style={styles.modalSaveButtonText}>Save</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  settingButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  settingButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingButtonLabel: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  settingButtonRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingButtonValue: {
    fontSize: 14,
    color: '#666',
  },
  colorPreview: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
  },
  infoItem: {
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
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  logoutButton: {
    backgroundColor: '#fff5f5',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff3b30',
    gap: 12,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff3b30',
  },

  floatingModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  floatingModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  modalBody: {
    padding: 20,
    minHeight: 120,
  },
  modalLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  modalInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#0066cc',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  modalSaveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  seasonButtonsGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    justifyContent: 'space-between',
  },
  seasonButton: {
    flex: 1,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  seasonButtonActive: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  seasonButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#666',
  },
  seasonButtonSubtext: {
    fontSize: 11,
    fontWeight: '500',
    color: '#999',
  },
  seasonButtonTextActive: {
    color: 'white',
  },
  modalHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
    justifyContent: 'center',
  },
  colorOption: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#0066cc',
  },
  colorName: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '500',
  },
  colorPreviewRow: {
    flexDirection: 'row',
    gap: 4,
  },
  colorPreviewSmall: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  yearSeasonModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  yearSeasonModalBody: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  yearSeasonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  yearSeasonLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  yearSeasonRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  yearSeasonColorName: {
    fontSize: 13,
    color: '#666',
  },
  currencyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 14,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginRight: 4,
  },
  currencyInput: {
    flex: 1,
    padding: 14,
    fontSize: 18,
    fontWeight: '500',
  },
});
