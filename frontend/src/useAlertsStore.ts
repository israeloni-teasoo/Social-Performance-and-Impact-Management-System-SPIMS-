import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import { isApiAvailable } from './apiMode';
import type { AlertChannel, AlertChannelKind, AlertConfig, AlertRule } from './types';
import type { ToastTone } from './useToastQueue';

const EMPTY: AlertConfig = { rules: [], channels: [], appUrlConfigured: false };

/**
 * Alert rules and delivery channels.
 *
 * Unlike every other store here this one has **no demo mode**. Rules and channels only
 * mean anything to a server that collects and delivers, and a demo that let someone add
 * a webhook which would never fire would be worse than one that says so plainly. With
 * no API the panel reports that instead of offering controls that do nothing.
 */
export function useAlertsStore(onNotify: (message: string, tone?: ToastTone) => void) {
  const [config, setConfig] = useState<AlertConfig>(EMPTY);
  const [live, setLive] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  const load = useCallback(async () => {
    const isLive = await isApiAvailable();
    setLive(isLive);
    if (!isLive) {
      setConfig(EMPTY);
      return;
    }
    setConfig(await api.get<AlertConfig>('/api/alerts'));
  }, []);

  useEffect(() => {
    load().catch(() => setConfig(EMPTY));
  }, [load]);

  const addRule = async (name: string, terms: string) => {
    try {
      const rule = await api.post<AlertRule>('/api/alerts/rules', { name, terms });
      setConfig((c) => ({ ...c, rules: [...c.rules, rule] }));
      onNotify(`Watching for ${rule.name}.`, 'success');
    } catch (error) {
      onNotify(error instanceof Error && error.message ? error.message : 'Could not add that rule.', 'warning');
    }
  };

  const setRuleActive = async (id: string, active: boolean) => {
    try {
      await api.post('/api/alerts/rules/active', { id, active });
      setConfig((c) => ({ ...c, rules: c.rules.map((r) => (r.id === id ? { ...r, active } : r)) }));
    } catch {
      onNotify('Could not change that rule — try again.', 'warning');
    }
  };

  const removeRule = async (id: string) => {
    try {
      await api.post('/api/alerts/rules/delete', { id });
      setConfig((c) => ({ ...c, rules: c.rules.filter((r) => r.id !== id) }));
      onNotify('Rule removed.', 'success');
    } catch {
      onNotify('Could not remove that rule — try again.', 'warning');
    }
  };

  const addChannel = async (name: string, kind: AlertChannelKind, url: string) => {
    try {
      const channel = await api.post<AlertChannel>('/api/alerts/channels', { name, kind, url });
      setConfig((c) => ({ ...c, channels: [...c.channels, channel] }));
      onNotify(`Added ${channel.name}. Send a test to confirm it arrives.`, 'success');
    } catch (error) {
      onNotify(error instanceof Error && error.message ? error.message : 'Could not add that channel.', 'warning');
    }
  };

  const removeChannel = async (id: string) => {
    try {
      await api.post('/api/alerts/channels/delete', { id });
      setConfig((c) => ({ ...c, channels: c.channels.filter((ch) => ch.id !== id) }));
      onNotify('Channel removed.', 'success');
    } catch {
      onNotify('Could not remove that channel — try again.', 'warning');
    }
  };

  /**
   * Sends one example alert.
   *
   * The outcome is written back onto the channel whether it worked or not, because a
   * webhook that rejects the message is exactly what a test is for — reporting only
   * success would leave the operator no better off than before.
   */
  const testChannel = async (id: string) => {
    setTesting(id);
    try {
      const result = await api.post<{ ok: boolean; error: string | null; channel: AlertChannel }>(
        '/api/alerts/channels/test',
        { id },
      );
      setConfig((c) => ({ ...c, channels: c.channels.map((ch) => (ch.id === id ? result.channel : ch)) }));
      onNotify('Test alert sent. Check the channel.', 'success');
    } catch (error) {
      // A refused webhook answers 502, which lands here. Reload so the recorded error
      // appears on the channel rather than only in a toast that disappears.
      await load().catch(() => {});
      onNotify(
        error instanceof Error && error.message ? `Test failed: ${error.message}` : 'The test alert was not accepted.',
        'warning',
      );
    } finally {
      setTesting(null);
    }
  };

  return { config, live, testing, addRule, setRuleActive, removeRule, addChannel, removeChannel, testChannel, reload: load };
}
