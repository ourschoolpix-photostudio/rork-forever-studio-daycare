import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadAllData, saveAllData, generateId, clearAllData } from '@/utils/localStorage';

interface Daycare {
  id: string;
  user_id: string;
  daycare_id_number: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  enrollment_number?: string;
  age_range?: string;
  director_name?: string;
  assistant_director_name?: string;
  classes_memo?: string;
  photo_uri?: string;
  email?: string;
  created_at: string;
}

interface PricingList {
  id: string;
  user_id: string;
  price_code: string;
  name: string;
  packages?: PricingItem[];
  digital_packages?: PricingItem[];
  wall_portraits?: PricingItem[];
  ala_carte?: PricingItem[];
  specialty_items?: PricingItem[];
  build_your_own?: PricingItem[];
  created_at: string;
}

interface PricingItem {
  id: string;
  name: string;
  price: number;
  cost?: number;
  description?: string;
}

interface PhotoSession {
  id: string;
  daycare_id: string;
  pricing_list_id?: string;
  scheduled_date: string;
  end_date?: string;
  scheduled_time?: string;
  arrival_time?: string;
  notes?: string;
  gallery_password?: string;
  account_number?: string;
  status: string;
  early_bird_discount?: number;
  regular_discount?: number;
  number_photographed?: number;
  number_of_sales?: number;
  shipping?: number;
  class_gross_sales?: Record<string, number>;
  created_at: string;
}

interface Sale {
  id: string;
  session_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  cost?: number;
  type?: 'early-bird' | 'regular';
  item_name?: string;
  order_index?: number;
  created_at: string;
}

interface Reminder {
  id: string;
  session_id: string;
  reminder_date: string;
  reminder_time: string;
  is_sent: boolean;
  created_at: string;
}

interface Expense {
  id: string;
  daycare_id: string;
  amount: number;
  description: string;
  date: string;
  created_at: string;
}

interface EmailTemplate {
  id: string;
  user_id: string;
  category: string;
  name: string;
  subject: string;
  body: string;
  created_at: string;
}

interface DataContextType {
  daycares: Daycare[];
  pricingLists: PricingList[];
  sessions: PhotoSession[];
  sales: Sale[];
  reminders: Reminder[];
  expenses: Expense[];
  emailTemplates: EmailTemplate[];
  loading: boolean;
  refresh: () => Promise<void>;
  resetAllData: () => Promise<void>;
  addDaycare: (daycare: Omit<Daycare, 'id' | 'created_at'>) => Promise<Daycare>;
  updateDaycare: (id: string, daycare: Omit<Daycare, 'id' | 'created_at'>) => Promise<void>;
  deleteDaycare: (id: string) => Promise<void>;
  addPricingList: (list: Omit<PricingList, 'id' | 'created_at'>) => Promise<PricingList>;
  updatePricingList: (id: string, list: Omit<PricingList, 'id' | 'created_at'>) => Promise<void>;
  deletePricingList: (id: string) => Promise<void>;
  addSession: (session: Omit<PhotoSession, 'id' | 'created_at'>) => Promise<PhotoSession>;
  updateSession: (id: string, updates: Partial<PhotoSession>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  addSale: (sale: Omit<Sale, 'id' | 'created_at'>) => Promise<Sale>;
  addSessionSale: (sessionId: string, sale: Omit<Sale, 'id' | 'session_id' | 'created_at'>) => Promise<Sale>;
  updateSale: (id: string, sale: Partial<Omit<Sale, 'id' | 'created_at'>>) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  addReminder: (reminder: Omit<Reminder, 'id' | 'created_at'>) => Promise<Reminder>;
  deleteReminder: (id: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'created_at'>) => Promise<Expense>;
  deleteExpense: (id: string) => Promise<void>;
  addEmailTemplate: (template: Omit<EmailTemplate, 'id' | 'created_at'>) => Promise<EmailTemplate>;
  updateEmailTemplate: (id: string, template: Omit<EmailTemplate, 'id' | 'created_at'>) => Promise<void>;
  deleteEmailTemplate: (id: string) => Promise<void>;
  saveSessionDiscount: (sessionId: string, type: 'early-bird' | 'regular' | 'number_photographed' | 'number_of_sales' | 'shipping', amount: number) => Promise<void>;
  saveClassGrossSales: (sessionId: string, className: string, amount: number) => Promise<void>;
  reorderSessionSales: (sessionId: string, saleIds: string[]) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [daycares, setDaycares] = useState<Daycare[]>([]);
  const [pricingLists, setPricingLists] = useState<PricingList[]>([]);
  const [sessions, setSessions] = useState<PhotoSession[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      console.log('[DataContext] Starting data refresh...');
      const data = await loadAllData();
      console.log('[DataContext] Data loaded, setting state...');
      setDaycares(Array.isArray(data.daycares) ? data.daycares : []);
      setPricingLists(Array.isArray(data.pricingLists) ? data.pricingLists : []);
      setSessions(Array.isArray(data.photoSessions) ? data.photoSessions : []);
      setSales(Array.isArray(data.sales) ? data.sales : []);
      setReminders(Array.isArray(data.reminders) ? data.reminders : []);
      setExpenses(Array.isArray(data.expenses) ? data.expenses : []);
      setEmailTemplates(Array.isArray(data.emailTemplates) ? data.emailTemplates : []);
      console.log('[DataContext] Data refresh complete');
    } catch (err) {
      console.error('[DataContext] Error refreshing data:', err);
    } finally {
      console.log('[DataContext] Setting loading to false');
      setLoading(false);
    }
  };

  const resetAllData = async () => {
    try {
      await clearAllData();
      setDaycares([]);
      setPricingLists([]);
      setSessions([]);
      setSales([]);
      setReminders([]);
      setExpenses([]);
      setEmailTemplates([]);
      console.log('[DataContext] All data reset');
    } catch (err) {
      console.error('[DataContext] Error resetting data:', err);
      throw err;
    }
  };

  useEffect(() => {
    console.log('[DataContext] Initializing...');
    const timer = setTimeout(() => {
      refresh().catch(err => {
        console.error('[DataContext] Fatal refresh error:', err);
        setLoading(false);
      });
    }, 0);
    
    return () => clearTimeout(timer);
  }, []);

  const addDaycare = async (daycare: Omit<Daycare, 'id' | 'created_at'>) => {
    const newDaycare: Daycare = {
      ...daycare,
      id: generateId(),
      created_at: new Date().toISOString(),
    };
    console.log('[DataContext] Adding daycare:', newDaycare);
    
    return new Promise<Daycare>((resolve) => {
      setDaycares((prevDaycares) => {
        const updated = [newDaycare, ...prevDaycares];
        console.log('[DataContext] Updated daycares, total count:', updated.length);
        saveAllData({
          daycares: updated,
          pricingLists,
          photoSessions: sessions,
          sales,
          reminders,
          expenses,
          emailTemplates,
        }).catch(err => console.error('[DataContext] Save error:', err));
        resolve(newDaycare);
        return updated;
      });
    });
  };

  const updateDaycare = async (id: string, daycare: Omit<Daycare, 'id' | 'created_at'>) => {
    const updated = daycares.map((d) => (d.id === id ? { ...d, ...daycare } : d));
    setDaycares(updated);
    await saveAllData({
      daycares: updated,
      pricingLists,
      photoSessions: sessions,
      sales,
      reminders,
      expenses,
      emailTemplates,
    });
  };

  const deleteDaycare = async (id: string) => {
    const updated = daycares.filter((d) => d.id !== id);
    setDaycares(updated);
    await saveAllData({
      daycares: updated,
      pricingLists,
      photoSessions: sessions,
      sales,
      reminders,
      expenses,
      emailTemplates,
    });
  };

  const addPricingList = async (list: Omit<PricingList, 'id' | 'created_at'>) => {
    const newList: PricingList = {
      ...list,
      id: generateId(),
      created_at: new Date().toISOString(),
    };
    const updated = [newList, ...pricingLists];
    console.log('[DataContext] Adding pricing list:', newList);
    setPricingLists(updated);
    await saveAllData({
      daycares,
      pricingLists: updated,
      photoSessions: sessions,
      sales,
      reminders,
      expenses,
      emailTemplates,
    });
    return newList;
  };

  const updatePricingList = async (id: string, list: Omit<PricingList, 'id' | 'created_at'>) => {
    const updated = pricingLists.map((p) => (p.id === id ? { ...p, ...list} : p));
    console.log('[DataContext] Updating pricing list:', id);
    setPricingLists(updated);
    await saveAllData({
      daycares,
      pricingLists: updated,
      photoSessions: sessions,
      sales,
      reminders,
      expenses,
      emailTemplates,
    });
  };

  const deletePricingList = async (id: string) => {
    const sessionsUsing = sessions.filter((s) => s.pricing_list_id === id);
    if (sessionsUsing.length > 0) {
      throw new Error(`Cannot delete this pricing list - it's being used by ${sessionsUsing.length} session(s). Delete those sessions first.`);
    }
    
    const updated = pricingLists.filter((p) => p.id !== id);
    setPricingLists(updated);
    await saveAllData({
      daycares,
      pricingLists: updated,
      photoSessions: sessions,
      sales,
      reminders,
      expenses,
      emailTemplates,
    });
  };

  const addSession = async (session: Omit<PhotoSession, 'id' | 'created_at'>) => {
    console.log('[DataContext] Adding session:', session);
    const newSession: PhotoSession = {
      ...session,
      id: generateId(),
      created_at: new Date().toISOString(),
    };
    return new Promise<PhotoSession>((resolve, reject) => {
      setSessions((prevSessions) => {
        const updated = [...prevSessions, newSession];
        console.log('[DataContext] Updated sessions, total count:', updated.length);
        saveAllData({
          daycares,
          pricingLists,
          photoSessions: updated,
          sales,
          reminders,
          expenses,
          emailTemplates,
        }).then(() => {
          console.log('[DataContext] Session saved successfully');
          resolve(newSession);
        }).catch(err => {
          console.error('[DataContext] Save error:', err);
          reject(err);
        });
        return updated;
      });
    });
  };

  const updateSession = async (id: string, updates: Partial<PhotoSession>) => {
    console.log('[DataContext] Updating session:', id, updates);
    const updated = sessions.map((s) => (s.id === id ? { ...s, ...updates } : s));
    setSessions(updated);
    await saveAllData({
      daycares,
      pricingLists,
      photoSessions: updated,
      sales,
      reminders,
      expenses,
      emailTemplates,
    });
  };

  const deleteSession = async (id: string) => {
    console.log('[DataContext] Deleting session:', id);
    const updated = sessions.filter((s) => s.id !== id);
    const updatedSales = sales.filter((s) => s.session_id !== id);
    const updatedReminders = reminders.filter((r) => r.session_id !== id);
    setSessions(updated);
    setSales(updatedSales);
    setReminders(updatedReminders);
    await saveAllData({
      daycares,
      pricingLists,
      photoSessions: updated,
      sales: updatedSales,
      reminders: updatedReminders,
      expenses,
      emailTemplates,
    });
  };

  const addSale = async (sale: Omit<Sale, 'id' | 'created_at'>) => {
    console.log('[DataContext] addSale called with:', sale);
    const newSale: Sale = {
      ...sale,
      id: generateId(),
      created_at: new Date().toISOString(),
    };
    return new Promise<Sale>((resolve) => {
      setSales((prevSales) => {
        const updated = [...prevSales, newSale];
        console.log('[DataContext] Updated sales:', updated);
        saveAllData({
          daycares,
          pricingLists,
          photoSessions: sessions,
          sales: updated,
          reminders,
          expenses,
          emailTemplates,
        }).catch(err => console.error('[DataContext] Save error:', err));
        resolve(newSale);
        return updated;
      });
    });
  };

  const addSessionSale = async (sessionId: string, sale: Omit<Sale, 'id' | 'session_id' | 'created_at'>) => {
    console.log('[DataContext] addSessionSale called with:', { sessionId, sale });
    const result = await addSale({
      ...sale,
      session_id: sessionId,
      total_price: sale.quantity * sale.unit_price,
    });
    console.log('[DataContext] Sale added:', result);
    return result;
  };

  const updateSale = async (id: string, updates: Partial<Omit<Sale, 'id' | 'created_at'>>) => {
    const updated = sales.map((s) => (s.id === id ? { ...s, ...updates } : s));
    setSales(updated);
    await saveAllData({
      daycares,
      pricingLists,
      photoSessions: sessions,
      sales: updated,
      reminders,
      expenses,
      emailTemplates,
    });
  };

  const deleteSale = async (id: string) => {
    const updated = sales.filter((s) => s.id !== id);
    setSales(updated);
    await saveAllData({
      daycares,
      pricingLists,
      photoSessions: sessions,
      sales: updated,
      reminders,
      expenses,
      emailTemplates,
    });
  };

  const addReminder = async (reminder: Omit<Reminder, 'id' | 'created_at'>) => {
    const newReminder: Reminder = {
      ...reminder,
      id: generateId(),
      created_at: new Date().toISOString(),
    };
    const updated = [...reminders, newReminder];
    setReminders(updated);
    await saveAllData({
      daycares,
      pricingLists,
      photoSessions: sessions,
      sales,
      reminders: updated,
      expenses,
      emailTemplates,
    });
    return newReminder;
  };

  const deleteReminder = async (id: string) => {
    const updated = reminders.filter((r) => r.id !== id);
    setReminders(updated);
    await saveAllData({
      daycares,
      pricingLists,
      photoSessions: sessions,
      sales,
      reminders: updated,
      expenses,
      emailTemplates,
    });
  };

  const addExpense = async (expense: Omit<Expense, 'id' | 'created_at'>) => {
    const newExpense: Expense = {
      ...expense,
      id: generateId(),
      created_at: new Date().toISOString(),
    };
    const updated = [...expenses, newExpense];
    setExpenses(updated);
    await saveAllData({
      daycares,
      pricingLists,
      photoSessions: sessions,
      sales,
      reminders,
      expenses: updated,
      emailTemplates,
    });
    return newExpense;
  };

  const deleteExpense = async (id: string) => {
    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);
    await saveAllData({
      daycares,
      pricingLists,
      photoSessions: sessions,
      sales,
      reminders,
      expenses: updated,
      emailTemplates,
    });
  };

  const addEmailTemplate = async (template: Omit<EmailTemplate, 'id' | 'created_at'>) => {
    const newTemplate: EmailTemplate = {
      ...template,
      id: generateId(),
      created_at: new Date().toISOString(),
    };
    const updated = [...emailTemplates, newTemplate];
    console.log('[DataContext] Adding email template:', newTemplate);
    setEmailTemplates(updated);
    await saveAllData({
      daycares,
      pricingLists,
      photoSessions: sessions,
      sales,
      reminders,
      expenses,
      emailTemplates: updated,
    });
    return newTemplate;
  };

  const updateEmailTemplate = async (id: string, template: Omit<EmailTemplate, 'id' | 'created_at'>) => {
    const updated = emailTemplates.map((t) => (t.id === id ? { ...t, ...template } : t));
    console.log('[DataContext] Updating email template:', id);
    setEmailTemplates(updated);
    await saveAllData({
      daycares,
      pricingLists,
      photoSessions: sessions,
      sales,
      reminders,
      expenses,
      emailTemplates: updated,
    });
  };

  const deleteEmailTemplate = async (id: string) => {
    const updated = emailTemplates.filter((t) => t.id !== id);
    console.log('[DataContext] Deleting email template:', id);
    setEmailTemplates(updated);
    await saveAllData({
      daycares,
      pricingLists,
      photoSessions: sessions,
      sales,
      reminders,
      expenses,
      emailTemplates: updated,
    });
  };

  const saveSessionDiscount = async (sessionId: string, type: 'early-bird' | 'regular' | 'number_photographed' | 'number_of_sales' | 'shipping', amount: number) => {
    const updated = sessions.map((s) => {
      if (s.id === sessionId) {
        if (type === 'early-bird') {
          return { ...s, early_bird_discount: amount };
        } else if (type === 'regular') {
          return { ...s, regular_discount: amount };
        } else if (type === 'number_photographed') {
          return { ...s, number_photographed: amount };
        } else if (type === 'number_of_sales') {
          return { ...s, number_of_sales: amount };
        } else if (type === 'shipping') {
          return { ...s, shipping: amount };
        }
      }
      return s;
    });
    setSessions(updated);
    await saveAllData({
      daycares,
      pricingLists,
      photoSessions: updated,
      sales,
      reminders,
      expenses,
      emailTemplates,
    });
  };

  const saveClassGrossSales = async (sessionId: string, className: string, amount: number) => {
    const updated = sessions.map((s) => {
      if (s.id === sessionId) {
        const currentClassSales = s.class_gross_sales || {};
        return { ...s, class_gross_sales: { ...currentClassSales, [className]: amount } };
      }
      return s;
    });
    setSessions(updated);
    await saveAllData({
      daycares,
      pricingLists,
      photoSessions: updated,
      sales,
      reminders,
      expenses,
      emailTemplates,
    });
  };

  const reorderSessionSales = async (sessionId: string, saleIds: string[]) => {
    const updated = sales.map((sale) => {
      const newIndex = saleIds.indexOf(sale.id);
      if (sale.session_id === sessionId && newIndex !== -1) {
        return { ...sale, order_index: newIndex };
      }
      return sale;
    });
    console.log('[DataContext] Reordering sales for session:', sessionId);
    setSales(updated);
    await saveAllData({
      daycares,
      pricingLists,
      photoSessions: sessions,
      sales: updated,
      reminders,
      expenses,
      emailTemplates,
    });
  };

  return (
    <DataContext.Provider value={{
      daycares,
      pricingLists,
      sessions,
      sales,
      reminders,
      expenses,
      emailTemplates,
      loading,
      refresh,
      resetAllData,
      addDaycare,
      updateDaycare,
      deleteDaycare,
      addSession,
      updateSession,
      deleteSession,
      addPricingList,
      updatePricingList,
      deletePricingList,
      addSale,
      addSessionSale,
      updateSale,
      deleteSale,
      addReminder,
      deleteReminder,
      addExpense,
      deleteExpense,
      addEmailTemplate,
      updateEmailTemplate,
      deleteEmailTemplate,
      saveSessionDiscount,
      saveClassGrossSales,
      reorderSessionSales,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
}

export type { PhotoSession, Sale, Daycare, PricingList, Reminder, Expense, EmailTemplate };
