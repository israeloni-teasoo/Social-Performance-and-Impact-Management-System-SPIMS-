import { useEffect, useState } from 'react';
import { api } from './api';
import { isApiAvailable, loadLocal, saveLocal } from './apiMode';
import { TASKS } from './data/seed';
import type { FieldTask, NewTaskInput } from './types';
import type { ToastTone } from './useToastQueue';

const KEY = 'spims_tasks_v2';

export function useTasksStore(onNotify: (message: string, tone?: ToastTone) => void) {
  const [tasks, setTasks] = useState<FieldTask[]>([]);

  useEffect(() => {
    isApiAvailable()
      .then((live) => (live ? api.get<FieldTask[]>('/api/tasks') : loadLocal<FieldTask[]>(KEY, TASKS)))
      .then(setTasks)
      .catch(() => setTasks(loadLocal<FieldTask[]>(KEY, TASKS)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const assignTask = async (input: NewTaskInput) => {
    const draft: FieldTask = {
      id: `task-${Date.now()}`,
      title: input.title.trim() || 'Untitled task',
      project: input.project.trim() || '—',
      due: input.due.trim() || 'No due date',
      dueColor: '#8A8DA6',
      assigneeId: input.assigneeId,
      status: 'Not started',
      createdBy: 'Tunde Bello · Project Manager',
    };
    try {
      const created = (await isApiAvailable()) ? await api.post<FieldTask>('/api/tasks', input) : draft;
      setTasks((list) => {
        const next = [created, ...list];
        saveLocal(KEY, next);
        return next;
      });
      onNotify('Task assigned.', 'success');
    } catch {
      onNotify('Could not assign that task — try again.', 'warning');
    }
  };

  const setTaskStatus = async (id: string, status: NonNullable<FieldTask['status']>) => {
    try {
      if (await isApiAvailable()) await api.post('/api/tasks/status', { id, status });
      setTasks((list) => {
        const next = list.map((t) => (t.id === id ? { ...t, status } : t));
        saveLocal(KEY, next);
        return next;
      });
      onNotify(`Task marked "${status}".`, 'success');
    } catch {
      onNotify('Could not update that task — try again.', 'warning');
    }
  };

  return { tasks, assignTask, setTaskStatus };
}
