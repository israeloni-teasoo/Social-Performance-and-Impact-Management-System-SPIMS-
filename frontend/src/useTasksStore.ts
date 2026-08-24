import { useEffect, useState } from 'react';
import { TASKS } from './data/seed';
import type { FieldTask, NewTaskInput } from './types';
import type { ToastTone } from './useToastQueue';

const STORAGE_KEY = 'spims_tasks_v1';

function load(): FieldTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FieldTask[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore corrupt storage
  }
  return TASKS;
}

function save(list: FieldTask[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // storage unavailable — proceed without persistence
  }
}

let idCounter = 0;

export function useTasksStore(onNotify: (message: string, tone?: ToastTone) => void) {
  const [tasks, setTasks] = useState<FieldTask[]>(() => load());

  useEffect(() => {
    save(tasks);
  }, [tasks]);

  const assignTask = (input: NewTaskInput) => {
    idCounter += 1;
    const created: FieldTask = {
      id: `task-new-${Date.now()}-${idCounter}`,
      title: input.title.trim() || 'Untitled task',
      project: input.project.trim() || '—',
      due: input.due.trim() || 'No due date',
      dueColor: '#8A8DA6',
      assigneeId: input.assigneeId,
      status: 'Not started',
      createdBy: 'Tunde Bello · Project Manager',
    };
    setTasks((list) => [created, ...list]);
    onNotify(`Task assigned.`, 'success');
  };

  const setTaskStatus = (id: string, status: NonNullable<FieldTask['status']>) => {
    setTasks((list) => list.map((t) => (t.id === id ? { ...t, status } : t)));
    onNotify(`Task marked "${status}".`, 'success');
  };

  return { tasks, assignTask, setTaskStatus };
}
