import { create } from 'zustand';
import { api } from '../api/client';
import { useToastStore } from './toast.store';

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
    } catch (err) {
      useToastStore.getState().add(err instanceof Error ? err.message : '할 일 목록을 불러오지 못했습니다');
    } finally {
      set({ loading: false });
    }
  },

  add: async (data) => {
    try {
      const item = await api.post<Task>('/tasks', { ...data, done: false });
      set((s) => ({ items: [item, ...s.items] }));
    } catch (err) {
      useToastStore.getState().add(err instanceof Error ? err.message : '할 일 추가에 실패했습니다');
      throw err;
    }
  },

  toggle: async (id, done) => {
    set((s) => ({ items: s.items.map((t) => (t.id === id ? { ...t, done } : t)) }));
    await api.put<Task>(`/tasks/${id}`, { done }).catch((err) => {
      set((s) => ({ items: s.items.map((t) => (t.id === id ? { ...t, done: !done } : t)) }));
      useToastStore.getState().add(err instanceof Error ? err.message : '업데이트에 실패했습니다');
    });
  },

  remove: async (id) => {
    set((s) => ({ items: s.items.filter((t) => t.id !== id) }));
    await api.delete<unknown>(`/tasks/${id}`).catch((err) => {
      useToastStore.getState().add(err instanceof Error ? err.message : '삭제에 실패했습니다');
    });
  },
}));
