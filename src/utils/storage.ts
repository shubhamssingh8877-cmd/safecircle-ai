import { Contact, Journey, SafetyReport, UserPreferences, UserProfile, SafetyAlert } from '../types';

export const STORAGE_KEYS = {
  JOURNEY: 'safecircle_v1_journey',
  JOURNEY_HISTORY: 'safecircle_v1_journey_history',
  CONTACTS: 'safecircle_v1_contacts',
  REPORTS: 'safecircle_v1_reports',
  UPVOTES: 'safecircle_v1_upvotes',
  PREFERENCES: 'safecircle_v1_preferences',
  USER_PROFILE: 'safecircle_v1_user_profile',
  ALERTS: 'safecircle_v1_alerts',
  AI_ASSESSMENT: 'safecircle_v1_ai_assessment',
  CUSTOM_API_KEY: 'safecircle_v1_custom_gemini_key',
  ACTIVE_SOS: 'safecircle_v1_active_sos',
  SOS_HISTORY: 'safecircle_v1_sos_history',
} as const;

export function getStorageItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined' || !window.localStorage) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null || raw === undefined) {
      return fallback;
    }
    const parsed = JSON.parse(raw);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (error) {
    console.warn(`[SafeCircle Storage] Failed parsing key "${key}". Reverting to fallback default.`, error);
    return fallback;
  }
}

export function setStorageItem<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`[SafeCircle Storage] Failed writing key "${key}" to localStorage.`, error);
    return false;
  }
}

export function removeStorageItem(key: string): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.warn(`[SafeCircle Storage] Failed removing key "${key}" from localStorage.`, error);
  }
}

export const storageService = {
  getContacts: (fallback: Contact[]): Contact[] =>
    getStorageItem<Contact[]>(STORAGE_KEYS.CONTACTS, fallback),
  saveContacts: (contacts: Contact[]): boolean =>
    setStorageItem<Contact[]>(STORAGE_KEYS.CONTACTS, contacts),

  getActiveJourney: (fallback: Journey | null): Journey | null =>
    getStorageItem<Journey | null>(STORAGE_KEYS.JOURNEY, fallback),
  saveActiveJourney: (journey: Journey | null): boolean =>
    setStorageItem<Journey | null>(STORAGE_KEYS.JOURNEY, journey),

  getJourneyHistory: (fallback: Journey[]): Journey[] =>
    getStorageItem<Journey[]>(STORAGE_KEYS.JOURNEY_HISTORY, fallback),
  saveJourneyHistory: (history: Journey[]): boolean =>
    setStorageItem<Journey[]>(STORAGE_KEYS.JOURNEY_HISTORY, history),

  getReports: (fallback: SafetyReport[]): SafetyReport[] =>
    getStorageItem<SafetyReport[]>(STORAGE_KEYS.REPORTS, fallback),
  saveReports: (reports: SafetyReport[]): boolean =>
    setStorageItem<SafetyReport[]>(STORAGE_KEYS.REPORTS, reports),

  getUpvotes: (fallback: string[]): string[] =>
    getStorageItem<string[]>(STORAGE_KEYS.UPVOTES, fallback),
  saveUpvotes: (upvotes: string[]): boolean =>
    setStorageItem<string[]>(STORAGE_KEYS.UPVOTES, upvotes),

  getPreferences: (fallback: UserPreferences): UserPreferences =>
    getStorageItem<UserPreferences>(STORAGE_KEYS.PREFERENCES, fallback),
  savePreferences: (preferences: UserPreferences): boolean =>
    setStorageItem<UserPreferences>(STORAGE_KEYS.PREFERENCES, preferences),

  getUserProfile: (fallback: UserProfile): UserProfile =>
    getStorageItem<UserProfile>(STORAGE_KEYS.USER_PROFILE, fallback),
  saveUserProfile: (profile: UserProfile): boolean =>
    setStorageItem<UserProfile>(STORAGE_KEYS.USER_PROFILE, profile),

  getAlerts: (fallback: SafetyAlert[]): SafetyAlert[] =>
    getStorageItem<SafetyAlert[]>(STORAGE_KEYS.ALERTS, fallback),
  saveAlerts: (alerts: SafetyAlert[]): boolean =>
    setStorageItem<SafetyAlert[]>(STORAGE_KEYS.ALERTS, alerts),

  getAiAssessment: <T>(fallback: T): T =>
    getStorageItem<T>(STORAGE_KEYS.AI_ASSESSMENT, fallback),
  saveAiAssessment: <T>(assessment: T): boolean =>
    setStorageItem<T>(STORAGE_KEYS.AI_ASSESSMENT, assessment),

  getCustomApiKey: (): string => {
    if (typeof window === 'undefined' || !window.localStorage) return '';
    try {
      return window.localStorage.getItem(STORAGE_KEYS.CUSTOM_API_KEY) || '';
    } catch {
      return '';
    }
  },
  saveCustomApiKey: (key: string): void => {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      if (!key) {
        window.localStorage.removeItem(STORAGE_KEYS.CUSTOM_API_KEY);
      } else {
        window.localStorage.setItem(STORAGE_KEYS.CUSTOM_API_KEY, key.trim());
      }
    } catch {}
  },

  getActiveSos: <T>(fallback: T): T =>
    getStorageItem<T>(STORAGE_KEYS.ACTIVE_SOS, fallback),
  saveActiveSos: <T>(sosEvent: T): boolean =>
    setStorageItem<T>(STORAGE_KEYS.ACTIVE_SOS, sosEvent),
  clearActiveSos: (): void =>
    removeStorageItem(STORAGE_KEYS.ACTIVE_SOS),

  getSosHistory: <T>(fallback: T): T =>
    getStorageItem<T>(STORAGE_KEYS.SOS_HISTORY, fallback),
  saveSosHistory: <T>(history: T): boolean =>
    setStorageItem<T>(STORAGE_KEYS.SOS_HISTORY, history),
};
