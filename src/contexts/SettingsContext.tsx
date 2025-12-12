/**
 * Settings Context
 * Manages app-wide user preferences including auto-translate feature
 *
 * Settings are persisted to AsyncStorage and loaded on app launch.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SETTINGS_STORAGE_KEY = "@cuistudio_settings";

export interface AppSettings {
  /**
   * When enabled, recipes are automatically translated to the user's current locale.
   * When disabled, recipes are displayed in their original language.
   * Default: true (for convenience)
   */
  autoTranslateRecipes: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  autoTranslateRecipes: true,
};

interface SettingsContextType {
  settings: AppSettings;
  isLoading: boolean;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
  resetSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load settings from AsyncStorage on mount
   */
  const loadSettings = useCallback(async () => {
    try {
      const storedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings) as Partial<AppSettings>;
        // Merge with defaults to handle new settings added in future versions
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
      // Keep default settings on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Save settings to AsyncStorage
   */
  const saveSettings = useCallback(async (newSettings: AppSettings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error("Failed to save settings:", error);
      throw error;
    }
  }, []);

  /**
   * Update a single setting
   */
  const updateSetting = useCallback(
    async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await saveSettings(newSettings);
    },
    [settings, saveSettings]
  );

  /**
   * Reset all settings to defaults
   */
  const resetSettings = useCallback(async () => {
    setSettings(DEFAULT_SETTINGS);
    await saveSettings(DEFAULT_SETTINGS);
  }, [saveSettings]);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const value: SettingsContextType = useMemo(
    () => ({
      settings,
      isLoading,
      updateSetting,
      resetSettings,
    }),
    [settings, isLoading, updateSetting, resetSettings]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

/**
 * Hook to use settings context
 */
export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
