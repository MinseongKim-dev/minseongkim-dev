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

export interface WeightLog {
  id: string;
  date: string;
  weight: number; // kg
  notes?: string;
}

export interface WaterLog {
  id: string;
  date: string;
  amount: number; // ml
}

export interface StepsLog {
  id: string;
  date: string;
  steps: number;
}

export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export interface MoodLog {
  id: string;
  date: string;
  mood: MoodLevel;
  notes?: string;
}

interface HealthStore {
  items: Workout[];
  sleepLogs: SleepLog[];
  weightLogs: WeightLog[];
  waterLogs: WaterLog[];
  stepsLogs: StepsLog[];
  moodLogs: MoodLog[];
  loading: boolean;
  fetch: () => Promise<void>;
  add: (data: Omit<Workout, 'id'>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  addSleepLog: (data: Omit<SleepLog, 'id'>) => Promise<void>;
  removeSleepLog: (id: string) => Promise<void>;
  addWeightLog: (data: Omit<WeightLog, 'id'>) => Promise<void>;
  removeWeightLog: (id: string) => Promise<void>;
  addWaterLog: (data: Omit<WaterLog, 'id'>) => Promise<void>;
  removeWaterLog: (id: string) => Promise<void>;
  addStepsLog: (data: Omit<StepsLog, 'id'>) => Promise<void>;
  removeStepsLog: (id: string) => Promise<void>;
  addMoodLog: (data: Omit<MoodLog, 'id'>) => Promise<void>;
  removeMoodLog: (id: string) => Promise<void>;
}

export const useHealthStore = create<HealthStore>((set) => ({
  items: [],
  sleepLogs: [],
  weightLogs: [],
  waterLogs: [],
  stepsLogs: [],
  moodLogs: [],
  loading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const [items, sleepLogs, weightLogs, waterLogs, stepsLogs, moodLogs] = await Promise.all([
        api.get<Workout[]>('/workouts'),
        api.get<SleepLog[]>('/sleep').catch(() => []),
        api.get<WeightLog[]>('/weight').catch(() => []),
        api.get<WaterLog[]>('/water').catch(() => []),
        api.get<StepsLog[]>('/steps').catch(() => []),
        api.get<MoodLog[]>('/mood').catch(() => []),
      ]);
      set({
        items: items ?? [],
        sleepLogs: sleepLogs ?? [],
        weightLogs: (weightLogs ?? []).sort((a, b) => a.date.localeCompare(b.date)),
        waterLogs: waterLogs ?? [],
        stepsLogs: stepsLogs ?? [],
        moodLogs: (moodLogs ?? []).sort((a, b) => a.date.localeCompare(b.date)),
      });
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

  addWeightLog: async (data) => {
    try {
      const item = await api.post<WeightLog>('/weight', data);
      set((s) => ({ weightLogs: [...s.weightLogs, item].sort((a, b) => a.date.localeCompare(b.date)) }));
    } catch (err) {
      useToastStore.getState().add(err instanceof Error ? err.message : '체중 기록 추가에 실패했습니다');
      throw err;
    }
  },

  removeWeightLog: async (id) => {
    set((s) => ({ weightLogs: s.weightLogs.filter((w) => w.id !== id) }));
    await api.delete<unknown>(`/weight/${id}`).catch((err) => {
      useToastStore.getState().add(err instanceof Error ? err.message : '삭제에 실패했습니다');
    });
  },

  addWaterLog: async (data) => {
    try {
      const item = await api.post<WaterLog>('/water', data);
      set((s) => ({ waterLogs: [item, ...s.waterLogs] }));
    } catch (err) {
      useToastStore.getState().add(err instanceof Error ? err.message : '수분 기록 추가에 실패했습니다');
      throw err;
    }
  },

  removeWaterLog: async (id) => {
    set((s) => ({ waterLogs: s.waterLogs.filter((w) => w.id !== id) }));
    await api.delete<unknown>(`/water/${id}`).catch((err) => {
      useToastStore.getState().add(err instanceof Error ? err.message : '삭제에 실패했습니다');
    });
  },

  addStepsLog: async (data) => {
    try {
      const item = await api.post<StepsLog>('/steps', data);
      set((s) => ({ stepsLogs: [item, ...s.stepsLogs] }));
    } catch (err) {
      useToastStore.getState().add(err instanceof Error ? err.message : '걸음 기록 추가에 실패했습니다');
      throw err;
    }
  },

  removeStepsLog: async (id) => {
    set((s) => ({ stepsLogs: s.stepsLogs.filter((s2) => s2.id !== id) }));
    await api.delete<unknown>(`/steps/${id}`).catch((err) => {
      useToastStore.getState().add(err instanceof Error ? err.message : '삭제에 실패했습니다');
    });
  },

  addMoodLog: async (data) => {
    try {
      const item = await api.post<MoodLog>('/mood', data);
      set((s) => ({
        moodLogs: [...s.moodLogs, item].sort((a, b) => a.date.localeCompare(b.date)),
      }));
    } catch (err) {
      useToastStore.getState().add(err instanceof Error ? err.message : '기분 기록 추가에 실패했습니다');
      throw err;
    }
  },

  removeMoodLog: async (id) => {
    set((s) => ({ moodLogs: s.moodLogs.filter((m) => m.id !== id) }));
    await api.delete<unknown>(`/mood/${id}`).catch((err) => {
      useToastStore.getState().add(err instanceof Error ? err.message : '삭제에 실패했습니다');
    });
  },
}));
