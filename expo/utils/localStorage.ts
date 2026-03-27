import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_PREFIX = 'daycare_app_';

interface StorageData {
  daycares: any[];
  pricingLists: any[];
  photoSessions: any[];
  sales: any[];
  reminders: any[];
  expenses: any[];
  emailTemplates: any[];
}

const DEFAULT_DATA: StorageData = {
  daycares: [],
  pricingLists: [],
  photoSessions: [],
  sales: [],
  reminders: [],
  expenses: [],
  emailTemplates: [],
};

export const loadAllData = async (): Promise<StorageData> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_PREFIX + 'data');
    const parsed = data ? JSON.parse(data) : DEFAULT_DATA;
    console.log('[Storage] Loaded data:', {
      daycares: parsed.daycares?.length || 0,
      pricingLists: parsed.pricingLists?.length || 0,
      sessions: parsed.photoSessions?.length || 0,
    });
    return parsed;
  } catch (err) {
    console.error('[Storage] Error loading data:', err);
    return DEFAULT_DATA;
  }
};

export const saveAllData = async (data: StorageData): Promise<void> => {
  try {
    console.log('[Storage] Saving data:', {
      daycares: data.daycares?.length || 0,
      pricingLists: data.pricingLists?.length || 0,
      sessions: data.photoSessions?.length || 0,
    });
    await AsyncStorage.setItem(STORAGE_PREFIX + 'data', JSON.stringify(data));
    console.log('[Storage] Data saved successfully');
  } catch (err) {
    console.error('[Storage] Error saving data:', err);
  }
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const clearAllData = async (): Promise<void> => {
  try {
    console.log('[Storage] Clearing all data');
    await AsyncStorage.removeItem(STORAGE_PREFIX + 'data');
    console.log('[Storage] All data cleared successfully');
  } catch (err) {
    console.error('[Storage] Error clearing data:', err);
    throw err;
  }
};
