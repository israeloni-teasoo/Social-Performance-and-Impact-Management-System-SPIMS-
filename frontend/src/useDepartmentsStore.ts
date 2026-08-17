import { useEffect, useState } from 'react';
import { DEPARTMENTS } from './data/seed';
import type { Department, NewDepartmentInput } from './types';
import type { ToastTone } from './useToastQueue';

const STORAGE_KEY = 'spims_departments_v1';

function load(): Department[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Department[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore corrupt storage
  }
  return DEPARTMENTS;
}

function save(list: Department[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // storage unavailable — proceed without persistence
  }
}

let idCounter = 0;

export function useDepartmentsStore(onNotify: (message: string, tone?: ToastTone) => void) {
  const [departments, setDepartments] = useState<Department[]>(() => load());

  useEffect(() => {
    save(departments);
  }, [departments]);

  const addDepartment = (input: NewDepartmentInput) => {
    idCounter += 1;
    const created: Department = {
      id: `dept-new-${Date.now()}-${idCounter}`,
      name: input.name.trim() || 'Unnamed department',
      function: input.function.trim() || 'Other',
      lead: input.lead.trim() || 'Unassigned',
      status: 'Active',
      createdAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
    setDepartments((list) => [created, ...list]);
    onNotify(`${created.name} added to the department register.`);
  };

  const toggleStatus = (id: string) => {
    setDepartments((list) =>
      list.map((d) => (d.id === id ? { ...d, status: d.status === 'Active' ? 'Inactive' : 'Active' } : d)),
    );
    const dept = departments.find((d) => d.id === id);
    if (dept) onNotify(`${dept.name} marked ${dept.status === 'Active' ? 'inactive' : 'active'}.`);
  };

  return { departments, addDepartment, toggleStatus };
}
