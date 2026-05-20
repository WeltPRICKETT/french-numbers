import { useState, useEffect, useCallback } from 'react';

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: number;       // 80–150, percentage scale (100 = default)
  lineHeight: number;     // 1.2–2.0
  fontWeight: 'normal' | 'medium' | 'bold';
  contentWidth: 'compact' | 'normal' | 'wide';
}

const STORAGE_KEY = 'app-settings';

const DEFAULTS: AppSettings = {
  theme: 'system',
  fontSize: 100,
  lineHeight: 1.5,
  fontWeight: 'normal',
  contentWidth: 'normal',
};

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Migrate from old theme key
      const oldTheme = localStorage.getItem('theme');
      if (oldTheme === 'dark') return { ...DEFAULTS, theme: 'dark' };
      if (oldTheme === 'light') return { ...DEFAULTS, theme: 'light' };
      return DEFAULTS;
    }
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

function resolveTheme(theme: AppSettings['theme']): boolean {
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(loadSettings);

  const setSettings = useCallback((updater: Partial<AppSettings> | ((prev: AppSettings) => Partial<AppSettings>)) => {
    setSettingsState(prev => {
      const updates = typeof updater === 'function' ? updater(prev) : updater;
      const next = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Apply settings to DOM
  useEffect(() => {
    const root = document.documentElement;

    // Theme
    const isDark = resolveTheme(settings.theme);
    root.classList.toggle('dark', isDark);

    // Font size
    root.style.setProperty('--app-font-scale', String(settings.fontSize / 100));
    root.style.fontSize = `${settings.fontSize}%`;

    // Line height
    root.style.setProperty('--app-line-height', String(settings.lineHeight));
    document.body.style.lineHeight = String(settings.lineHeight);

    // Font weight
    const weightMap = { normal: '400', medium: '500', bold: '600' };
    root.style.setProperty('--app-font-weight', weightMap[settings.fontWeight]);

    // Content width
    const widthMap = { compact: '28rem', normal: '32rem', wide: '40rem' };
    root.style.setProperty('--app-content-width', widthMap[settings.contentWidth]);

    // Listen for system theme changes
    if (settings.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        root.classList.toggle('dark', e.matches);
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [settings]);

  const toggleTheme = useCallback(() => {
    setSettings(prev => {
      const isDark = resolveTheme(prev.theme);
      return { theme: isDark ? 'light' : 'dark' };
    });
  }, [setSettings]);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULTS);
  }, [setSettings]);

  return { settings, setSettings, toggleTheme, resetSettings };
}
