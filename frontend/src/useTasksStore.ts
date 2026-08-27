import { useEffect, useState } from 'react';
import { api } from './api';
import type { FieldTask, NewTaskInput } from './types';
import type { ToastTone } from './useToastQueue';

export function useTasksStore(onNotify: (message: string, tone?: ToastTone) => void) {
  const [tasks, setTasks] = useState<FieldTask[]>([]);

  useEffect(() => {
    api
      .get<FieldTask[]>('/api/tasks')
      .then(setTasks)
      .catch(() => onNotify('Could not load tasks.', 'warning'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const assignTask = async (input: NewTaskInput) => {
    try {
      const created = await api.post<FieldTask>('/api/tasks', input);
      setTasks((list) => [created, ...list]);
      onNotify(`Task assigned.`, 'success');
    } catch {
      onNotify('Could not assign that task — try again.', 'warning');
    }
  };

  const setTaskStatus = async (id: string, status: NonNullable<FieldTask['status']>) => {
    try {
      await api.post('/api/tasks/status', { id, status });
      setTasks((list) => list.map((t) => (t.id === id ? { ...t, status } : t)));
      onNotify(`Task marked "${status}".`, 'success');
    } catch {
      onNotify('Could not update that task — try again.', 'warning');
    }
  };

  return { tasks, assignTask, setTaskStatus };
}
