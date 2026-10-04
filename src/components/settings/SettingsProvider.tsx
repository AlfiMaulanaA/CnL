'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { DeviceSettings, GuestProfile, RuleDefaults } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/lib/game/engine';
import {
  DEFAULT_DEVICE_SETTINGS,
  loadDeviceSettings,
  loadGuest,
  loadRuleDefaults,
  saveDeviceSettings,
  saveGuest,
  saveRuleDefaults
} from '@/lib/storage';
import { attachAudioUnlock, setSoundConfig, startMusic, stopMusic } from '@/lib/sound';

type SettingsContextValue = {
  settings: DeviceSettings;
  updateSettings: (patch: Partial<DeviceSettings>) => void;
  rules: RuleDefaults;
  updateRules: (patch: Partial<RuleDefaults>) => void;
  guest: GuestProfile;
  updateGuest: (patch: Partial<GuestProfile>) => void;
};

const FALLBACK_GUEST: GuestProfile = { id: 'Guest', name: 'Guest', avatar: '🐼' };

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  // Defaults first so server and client render identically, then hydrate from
  // localStorage after mount (avoids hydration mismatches).
  const [settings, setSettings] = useState<DeviceSettings>(DEFAULT_DEVICE_SETTINGS);
  const [rules, setRules] = useState<RuleDefaults>(DEFAULT_SETTINGS);
  const [guest, setGuest] = useState<GuestProfile>(FALLBACK_GUEST);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSettings(loadDeviceSettings());
    setRules(loadRuleDefaults());
    setGuest(loadGuest());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveDeviceSettings(settings);
    setSoundConfig({ enabled: settings.sound, music: settings.music, volume: settings.volume });
    attachAudioUnlock();
    const root = document.documentElement;
    root.classList.toggle('reduce-motion', settings.reducedMotion || !settings.animations);
    if (settings.music) startMusic();
    else stopMusic();
  }, [settings, hydrated]);

  useEffect(() => {
    if (hydrated) saveRuleDefaults(rules);
  }, [rules, hydrated]);

  useEffect(() => {
    if (hydrated) saveGuest(guest);
  }, [guest, hydrated]);

  const updateSettings = useCallback((patch: Partial<DeviceSettings>) => {
    setSettings(prev => ({ ...prev, ...patch }));
  }, []);

  const updateRules = useCallback((patch: Partial<RuleDefaults>) => {
    setRules(prev => ({ ...prev, ...patch }));
  }, []);

  const updateGuest = useCallback((patch: Partial<GuestProfile>) => {
    setGuest(prev => ({ ...prev, ...patch }));
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({ settings, updateSettings, rules, updateRules, guest, updateGuest }),
    [settings, updateSettings, rules, updateRules, guest, updateGuest]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
}
