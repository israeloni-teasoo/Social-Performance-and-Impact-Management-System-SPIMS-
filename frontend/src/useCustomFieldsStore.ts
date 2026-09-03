import { useEffect, useState } from 'react';
import { api } from './api';
import { isApiAvailable, loadLocal, saveLocal } from './apiMode';
import { CUSTOM_FIELDS } from './data/seed';
import type { CustomField, NewCustomFieldInput } from './types';
import type { ToastTone } from './useToastQueue';

const KEY = 'spims_custom_fields_v1';

function today(): string {
  return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function useCustomFieldsStore(onNotify: (message: string, tone?: ToastTone) => void, authorName: string) {
  const [fields, setFields] = useState<CustomField[]>([]);

  useEffect(() => {
    isApiAvailable()
      .then((live) => (live ? api.get<CustomField[]>('/api/custom-fields') : loadLocal<CustomField[]>(KEY, CUSTOM_FIELDS)))
      .then(setFields)
      .catch(() => setFields(loadLocal<CustomField[]>(KEY, CUSTOM_FIELDS)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addField = async (input: NewCustomFieldInput) => {
    const draft: CustomField = {
      id: `cf-${Date.now()}`,
      projectCode: input.projectCode,
      question: input.question.trim(),
      answer: input.answer.trim(),
      format: input.format,
      source: input.source.trim(),
      updatedAt: today(),
      updatedBy: authorName,
    };
    try {
      const created = (await isApiAvailable()) ? await api.post<CustomField>('/api/custom-fields', input) : draft;
      setFields((list) => {
        const next = [...list, created];
        saveLocal(KEY, next);
        return next;
      });
      onNotify('Field added to this programme.', 'success');
    } catch {
      onNotify('Could not save that field — try again.', 'warning');
    }
  };

  const updateField = async (id: string, answer: string, source: string) => {
    try {
      const patch = { answer: answer.trim(), source: source.trim(), updatedAt: today(), updatedBy: authorName };
      if (await isApiAvailable()) await api.post('/api/custom-fields/update', { id, answer: patch.answer, source: patch.source });
      setFields((list) => {
        const next = list.map((f) => (f.id === id ? { ...f, ...patch } : f));
        saveLocal(KEY, next);
        return next;
      });
      onNotify('Field updated.', 'success');
    } catch {
      onNotify('Could not update that field — try again.', 'warning');
    }
  };

  const removeField = async (id: string) => {
    try {
      if (await isApiAvailable()) await api.post('/api/custom-fields/delete', { id });
      setFields((list) => {
        const next = list.filter((f) => f.id !== id);
        saveLocal(KEY, next);
        return next;
      });
      onNotify('Field removed.', 'info');
    } catch {
      onNotify('Could not remove that field — try again.', 'warning');
    }
  };

  return { fields, addField, updateField, removeField };
}
