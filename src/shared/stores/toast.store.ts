import { create } from 'zustand';

export type ToastLevel = 'error' | 'success' | 'info';

interface Toast {
  id: string;
  level: ToastLevel;
  message: string;
}

interface ToastStore {
  toasts: Toast[];
  add: (message: string, level?: ToastLevel) => void;
  dismiss: (id: string) => void;
}

let _seq = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (message, level = 'error') => {
    const id = `t${++_seq}`;
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, level, message }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
