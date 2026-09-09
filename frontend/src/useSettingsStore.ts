import { useEffect, useState } from 'react';
import { api } from './api';
import { isApiAvailable } from './apiMode';
import type { IntegrationStatus, OrgSettings } from './types';
import type { ToastTone } from './useToastQueue';

/** Used when no server is present, and as the shape the interface renders before load. */
export const DEFAULT_SETTINGS: OrgSettings = {
  orgName: 'Seplat Energy Plc',
  financialYear: 'FY 2026',
  currencyLabel: '₦ Naira',
  targetYear: 2030,
  dataStatusNote: 'Illustrative data — replace with verified Seplat figures before external reporting.',
};

/**
 * Organisation settings are read by every signed-in user because the shell needs the
 * organisation name and financial year to render. Only an Executive can save them,
 * which the API enforces regardless of what the interface offers.
 */
export function useSettingsStore(onNotify?: (message: string, tone?: ToastTone) => void) {
  const [settings, setSettings] = useState<OrgSettings>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    isApiAvailable()
      .then(async (available) => {
        if (!available) return;
        const [s, st] = await Promise.all([
          api.get<OrgSettings>('/api/settings'),
          api.get<IntegrationStatus>('/api/settings/status').catch(() => null),
        ]);
        if (!cancelled) {
          setSettings(s);
          setStatus(st);
          setLive(true);
        }
      })
      .catch(() => {
        // Fall back to the defaults already in state.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async (next: OrgSettings) => {
    try {
      const saved = await api.post<OrgSettings>('/api/settings', next);
      setSettings(saved);
      onNotify?.('Settings saved.', 'success');
      return true;
    } catch (err) {
      onNotify?.(err instanceof Error && err.message ? err.message : 'Could not save settings.', 'warning');
      return false;
    }
  };

  return { settings, status, live, save };
}
