import { useCallback, useRef, useState } from 'react';

export type ToastTone = 'success' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  message: string;
  tone: ToastTone;
}

let idCounter = 0;

export function useToastQueue() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const push = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      idCounter += 1;
      const id = `toast-${idCounter}`;
      setToasts((t) => [...t, { id, message, tone }]);
      timers.current[id] = setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  return { toasts, push, dismiss };
}
