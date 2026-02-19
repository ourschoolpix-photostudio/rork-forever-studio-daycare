
import { loadAllData, saveAllData } from './localStorage';
import { supabase } from '@/integrations/supabase/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface AppSettings {
  galleryPassword?: string;
  selectedSeason?: string;
  sessionCardColor?: string;
  yearSeasonColors?: string;
  autoExpense?: string;
}

interface BackupData {
  daycares: any[];
  pricingLists: any[];
  photoSessions: any[];
  sales: any[];
  expenses: any[];
  reminders: any[];
  emailTemplates: any[];
  appSettings?: AppSettings;
  timestamp: string;
  version: string;
}

export async function createBackup(): Promise<string> {
  try {
    console.log('[Backup] Loading data...');
    const data = await loadAllData();
    
    console.log('[Backup] Loading app settings...');
    const appSettings: AppSettings = {};
    try {
      const galleryPassword = await AsyncStorage.getItem('app_gallery_password');
      const selectedSeason = await AsyncStorage.getItem('app_selected_season');
      const sessionCardColor = await AsyncStorage.getItem('app_session_card_color');
      const yearSeasonColors = await AsyncStorage.getItem('app_year_season_colors');
      const autoExpense = await AsyncStorage.getItem('app_auto_expense');
      
      if (galleryPassword) appSettings.galleryPassword = galleryPassword;
      if (selectedSeason) appSettings.selectedSeason = selectedSeason;
      if (sessionCardColor) appSettings.sessionCardColor = sessionCardColor;
      if (yearSeasonColors) appSettings.yearSeasonColors = yearSeasonColors;
      if (autoExpense) appSettings.autoExpense = autoExpense;
      
      console.log('[Backup] App settings loaded:', Object.keys(appSettings));
    } catch (err) {
      console.error('[Backup] Error loading app settings:', err);
    }
    
    const backup: BackupData = {
      daycares: data.daycares || [],
      pricingLists: data.pricingLists || [],
      photoSessions: data.photoSessions || [],
      sales: data.sales || [],
      expenses: data.expenses || [],
      reminders: data.reminders || [],
      emailTemplates: data.emailTemplates || [],
      appSettings,
      timestamp: new Date().toISOString(),
      version: '1.0',
    };

    console.log('[Backup] Uploading to Supabase...');
    const { data: insertData, error } = await supabase
      .from('backups')
      .insert({
        backup_data: backup,
        created_at: backup.timestamp,
      })
      .select()
      .single();

    if (error) {
      console.error('[Backup] Supabase error:', JSON.stringify(error, null, 2));
      let errorMessage = error.message;
      if (error.message?.includes('backup_data')) {
        errorMessage = 'Database schema not set up correctly. Please run the SQL schema in Supabase.';
      }
      throw new Error(`Failed to save backup to cloud: ${errorMessage}`);
    }

    console.log('[Backup] Backup created successfully:', insertData.id);
    return insertData.id;
  } catch (error: any) {
    console.error('[Backup] Error creating backup:', error);
    throw error;
  }
}

export async function restoreBackup(backupId: string): Promise<void> {
  try {
    console.log('[Backup] Fetching backup from Supabase:', backupId);
    const { data: backupRecord, error } = await supabase
      .from('backups')
      .select('*')
      .eq('id', backupId)
      .single();

    if (error) {
      console.error('[Backup] Supabase error:', error);
      throw new Error(`Failed to fetch backup: ${error.message}`);
    }

    if (!backupRecord) {
      throw new Error('Backup not found');
    }

    const backup = backupRecord.backup_data as BackupData;

    if (!backup.version || !backup.timestamp) {
      throw new Error('Invalid backup data format');
    }

    console.log('[Backup] Restoring data...');
    await saveAllData({
      daycares: backup.daycares || [],
      pricingLists: backup.pricingLists || [],
      photoSessions: backup.photoSessions || [],
      sales: backup.sales || [],
      expenses: backup.expenses || [],
      reminders: backup.reminders || [],
      emailTemplates: backup.emailTemplates || [],
    });

    console.log('[Backup] Restoring app settings...');
    if (backup.appSettings) {
      try {
        if (backup.appSettings.galleryPassword) {
          await AsyncStorage.setItem('app_gallery_password', backup.appSettings.galleryPassword);
        } else {
          await AsyncStorage.removeItem('app_gallery_password');
        }
        
        if (backup.appSettings.selectedSeason) {
          await AsyncStorage.setItem('app_selected_season', backup.appSettings.selectedSeason);
        } else {
          await AsyncStorage.removeItem('app_selected_season');
        }
        
        if (backup.appSettings.sessionCardColor) {
          await AsyncStorage.setItem('app_session_card_color', backup.appSettings.sessionCardColor);
        } else {
          await AsyncStorage.removeItem('app_session_card_color');
        }
        
        if (backup.appSettings.yearSeasonColors) {
          await AsyncStorage.setItem('app_year_season_colors', backup.appSettings.yearSeasonColors);
        } else {
          await AsyncStorage.removeItem('app_year_season_colors');
        }
        
        if (backup.appSettings.autoExpense) {
          await AsyncStorage.setItem('app_auto_expense', backup.appSettings.autoExpense);
        } else {
          await AsyncStorage.removeItem('app_auto_expense');
        }
        
        console.log('[Backup] App settings restored successfully');
      } catch (err) {
        console.error('[Backup] Error restoring app settings:', err);
      }
    }

    console.log('[Backup] Data restored successfully from:', backup.timestamp);
  } catch (error: any) {
    console.error('[Backup] Error restoring backup:', error);
    throw error;
  }
}

export async function getBackupsList(): Promise<{ id: string; created_at: string; itemCount: number }[]> {
  try {
    console.log('[Backup] Fetching backups list...');
    console.log('[Backup] Supabase client ready:', !!supabase);
    
    let data, error;
    try {
      const result = await supabase
        .from('backups')
        .select('id, created_at, backup_data')
        .order('created_at', { ascending: false });
      
      data = result.data;
      error = result.error;
    } catch (fetchError: any) {
      console.error('[Backup] Network/fetch error:', fetchError);
      console.error('[Backup] Error name:', fetchError.name);
      console.error('[Backup] Error message:', fetchError.message);
      
      if (fetchError.message?.includes('Network request failed') || fetchError.name === 'TypeError') {
        throw new Error('Network error: Unable to connect to Supabase. Please check:\n\n1. Your internet connection\n2. Supabase URL is correct\n3. Supabase project is accessible\n4. Row Level Security (RLS) policies allow access');
      }
      
      throw new Error(`Connection error: ${fetchError.message}`);
    }

    if (error) {
      console.error('[Backup] Supabase error:', JSON.stringify(error, null, 2));
      console.error('[Backup] Error details - code:', error.code, 'message:', error.message, 'details:', error.details, 'hint:', error.hint);
      
      if (error.message?.includes('relation "public.backups" does not exist')) {
        throw new Error('Database table not found. Please create the backups table in Supabase first.');
      }
      
      if (error.message?.includes('permission denied') || error.code === '42501') {
        throw new Error('Permission denied. Please check Row Level Security (RLS) policies in Supabase.');
      }
      
      throw new Error(`Failed to fetch backups: ${error.message}`);
    }

    console.log('[Backup] Fetched', data?.length || 0, 'backups');
    
    return (data || []).map((backup) => {
      const backupData = backup.backup_data as BackupData;
      const itemCount = 
        (backupData.daycares?.length || 0) +
        (backupData.pricingLists?.length || 0) +
        (backupData.photoSessions?.length || 0) +
        (backupData.sales?.length || 0) +
        (backupData.expenses?.length || 0) +
        (backupData.reminders?.length || 0) +
        (backupData.emailTemplates?.length || 0);

      return {
        id: backup.id,
        created_at: backup.created_at,
        itemCount,
      };
    });
  } catch (error: any) {
    console.error('[Backup] Error getting backups list:', error);
    console.error('[Backup] Error stack:', error.stack);
    throw error;
  }
}

export async function deleteBackup(backupId: string): Promise<void> {
  try {
    console.log('[Backup] Deleting backup:', backupId);
    const { error } = await supabase
      .from('backups')
      .delete()
      .eq('id', backupId);

    if (error) {
      console.error('[Backup] Error deleting backup:', error);
      throw new Error(`Failed to delete backup: ${error.message}`);
    }

    console.log('[Backup] Backup deleted successfully');
  } catch (error: any) {
    console.error('[Backup] Error deleting backup:', error);
    throw error;
  }
}

export async function getBackupInfo(): Promise<{ timestamp: string; itemCount: number } | null> {
  try {
    const data = await loadAllData();
    const itemCount = 
      (data.daycares?.length || 0) +
      (data.pricingLists?.length || 0) +
      (data.photoSessions?.length || 0) +
      (data.sales?.length || 0) +
      (data.expenses?.length || 0) +
      (data.reminders?.length || 0) +
      (data.emailTemplates?.length || 0);

    return {
      timestamp: new Date().toISOString(),
      itemCount,
    };
  } catch (error) {
    console.error('[Backup] Error getting backup info:', error);
    return null;
  }
}

export async function createDeviceBackup(): Promise<void> {
  try {
    console.log('[Device Backup] Loading data...');
    const data = await loadAllData();
    
    console.log('[Device Backup] Loading app settings...');
    const appSettings: AppSettings = {};
    try {
      const galleryPassword = await AsyncStorage.getItem('app_gallery_password');
      const selectedSeason = await AsyncStorage.getItem('app_selected_season');
      const sessionCardColor = await AsyncStorage.getItem('app_session_card_color');
      const yearSeasonColors = await AsyncStorage.getItem('app_year_season_colors');
      const autoExpense = await AsyncStorage.getItem('app_auto_expense');
      
      if (galleryPassword) appSettings.galleryPassword = galleryPassword;
      if (selectedSeason) appSettings.selectedSeason = selectedSeason;
      if (sessionCardColor) appSettings.sessionCardColor = sessionCardColor;
      if (yearSeasonColors) appSettings.yearSeasonColors = yearSeasonColors;
      if (autoExpense) appSettings.autoExpense = autoExpense;
      
      console.log('[Device Backup] App settings loaded:', Object.keys(appSettings));
    } catch (err) {
      console.error('[Device Backup] Error loading app settings:', err);
    }
    
    const backup: BackupData = {
      daycares: data.daycares || [],
      pricingLists: data.pricingLists || [],
      photoSessions: data.photoSessions || [],
      sales: data.sales || [],
      expenses: data.expenses || [],
      reminders: data.reminders || [],
      emailTemplates: data.emailTemplates || [],
      appSettings,
      timestamp: new Date().toISOString(),
      version: '1.0',
    };

    const fileName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const file = new File(Paths.cache, fileName);
    
    console.log('[Device Backup] Writing to file:', fileName);
    file.write(JSON.stringify(backup, null, 2));
    
    console.log('[Device Backup] Sharing file...');
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Save Backup File',
        UTI: 'public.json',
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }
    
    console.log('[Device Backup] Backup saved successfully');
  } catch (error: any) {
    console.error('[Device Backup] Error creating backup:', error);
    throw error;
  }
}

export async function restoreDeviceBackup(): Promise<void> {
  try {
    console.log('[Device Backup] Opening file picker...');
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      throw new Error('File selection cancelled');
    }

    console.log('[Device Backup] Loading backup from file:', result.assets[0].name);
    const file = new File(result.assets[0].uri);
    const fileContent = await file.text();
    const backup = JSON.parse(fileContent) as BackupData;

    if (!backup.version || !backup.timestamp) {
      throw new Error('Invalid backup data format');
    }

    console.log('[Device Backup] Restoring data...');
    await saveAllData({
      daycares: backup.daycares || [],
      pricingLists: backup.pricingLists || [],
      photoSessions: backup.photoSessions || [],
      sales: backup.sales || [],
      expenses: backup.expenses || [],
      reminders: backup.reminders || [],
      emailTemplates: backup.emailTemplates || [],
    });

    console.log('[Device Backup] Restoring app settings...');
    if (backup.appSettings) {
      try {
        if (backup.appSettings.galleryPassword) {
          await AsyncStorage.setItem('app_gallery_password', backup.appSettings.galleryPassword);
        } else {
          await AsyncStorage.removeItem('app_gallery_password');
        }
        
        if (backup.appSettings.selectedSeason) {
          await AsyncStorage.setItem('app_selected_season', backup.appSettings.selectedSeason);
        } else {
          await AsyncStorage.removeItem('app_selected_season');
        }
        
        if (backup.appSettings.sessionCardColor) {
          await AsyncStorage.setItem('app_session_card_color', backup.appSettings.sessionCardColor);
        } else {
          await AsyncStorage.removeItem('app_session_card_color');
        }
        
        if (backup.appSettings.yearSeasonColors) {
          await AsyncStorage.setItem('app_year_season_colors', backup.appSettings.yearSeasonColors);
        } else {
          await AsyncStorage.removeItem('app_year_season_colors');
        }
        
        if (backup.appSettings.autoExpense) {
          await AsyncStorage.setItem('app_auto_expense', backup.appSettings.autoExpense);
        } else {
          await AsyncStorage.removeItem('app_auto_expense');
        }
        
        console.log('[Device Backup] App settings restored successfully');
      } catch (err) {
        console.error('[Device Backup] Error restoring app settings:', err);
      }
    }

    console.log('[Device Backup] Data restored successfully from:', backup.timestamp);
  } catch (error: any) {
    console.error('[Device Backup] Error restoring backup:', error);
    throw error;
  }
}

export async function getDeviceBackupInfo(): Promise<{ timestamp: string; itemCount: number } | null> {
  return null;
}
