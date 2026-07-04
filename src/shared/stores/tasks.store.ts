import { create } from 'zustand';
import { api } from '../api/client';

export type Priority = 'urgent' | 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  due?: string;
  done: boolean;
}

interface TasksStore {
  items: Task[];
  loading: boolean;
  fetch: () => Promise<void>;
  add: (data: { title: string; priority: Priority; due?: string }) => Promise<void>;
  toggle: (id: string, done: boolean) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useTasksStore = create<TasksStore>((set) => ({
  items: [],
  loading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const items = await api.get<Task[]>('/tasks');
      set({ items: items ?? [] });
    } finally {
      set({ loading: false });
    }
  },

  add: async (data) => {
    const item = await api.post<Task>('/tasks', { ...data, done: false });
    set((s) => ({ items: [item, ...s.items] }));
  },

  toggle: async (id, done) => {
    set((s) => ({ items: s.items.map((t) => (t.id === id ? { ...t, done } : t)) }));
    await api.put<Task>(`/tasks/${id}`, { done }).catch(() => {
      set((s) => ({ items: s.items.map((t) => (t.id === id ? { ...t, done: !done } : t)) }));
    });
  },

  remove: async (id) => {
    set((s) => ({ items: s.items.filter((t) => t.id !== id) }));
    await api.delete<unknown>(`/tasks/${id}`);
  },
}));
