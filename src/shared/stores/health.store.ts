import { create } from 'zustand';
import { api } from '../api/client';
import { useToastStore } from './toast.store';

export interface Workout {
  id: string;
  type: string;
  duration: number;
  calories?: number;
  date: string;
  notes?: string;
}

export interface SleepLog {
  id: string;
  date: string;
  bedTime: string;
  wakeTime: string;
  duration: number; // minutes
  quality: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

interface HealthStore {
  items: Workout[];
  sleepLogs: SleepLog[];
  loading: boolean;
  fetch: () => Promise<void>;
  add: (data: Omit<Workout, 'id'>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  addSleepLog: (data: Omit<SleepLog, 'id'>) => Promise<void>;
  removeSleepLog: (id: string) => Promise<void>;
}

export const useHealthStore = create<HealthStore>((set) => ({
  items: [],
  sleepLogs: [],
  loading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const [items, sleepLogs] = await Promise.all([
        api.get<Workout[]>('/workouts'),
        api.get<SleepLog[]>('/sleep').catch(() => []),
      ]);
      set({ items: items ?? [], sleepLogs: sleepLogs ?? [] });
    } catch (err) {
      useToastStore.getState().add(err instanceof Error ? err.message : '건강 데이터를 불러오지 못했습니다');
    } finally {
      set({ loading: false });
    }
  },

  add: async (data) => {
    try {
      const item = await api.post<Workout>('/workouts', data);
      set((s) => ({ items: [item, ...s.items] }));
    } catch (err) {
      useToastStore.getState().add(err instanceof Error ? err.message : '운동 기록 추가에 실패했습니다');
      throw err;
    }
  },

  remove: async (id) => {
    set((s) => ({ items: s.items.filter((w) => w.id !== id) }));
    await api.delete<unknown>(`/workouts/${id}`).catch((err) => {
      useToastStore.getState().add(err instanceof Error ? err.message : '삭제에 실패했습니다');
    });
  },

  addSleepLog: async (data) => {
    try {
      const item = await api.post<SleepLog>('/sleep', data);
      set((s) => ({ sleepLogs: [item, ...s.sleepLogs] }));
    } catch (err) {
      useToastStore.getState().add(err instanceof Error ? err.message : '수면 기록 추가에 실패했습니다');
      throw err;
    }
  },

  removeSleepLog: async (id) => {
    set((s) => ({ sleepLogs: s.sleepLogs.filter((l) => l.id !== id) }));
    await api.delete<unknown>(`/sleep/${id}`).catch((err) => {
      useToastStore.getState().add(err instanceof Error ? err.message : '삭제에 실패했습니다');
    });
  },
}));
