import { create } from 'zustand';
import { api } from '../api/client';

export interface Workout {
  id: string;
  type: string;
  duration: number;
  calories?: number;
  date: string;
  notes?: string;
}

interface HealthStore {
  items: Workout[];
  loading: boolean;
  fetch: () => Promise<void>;
  add: (data: Omit<Workout, 'id'>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useHealthStore = create<HealthStore>((set) => ({
  items: [],
  loading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const items = await api.get<Workout[]>('/workouts');
      set({ items: items ?? [] });
    } finally {
      set({ loading: false });
    }
  },

  add: async (data) => {
    const item = await api.post<Workout>('/workouts', data);
    set((s) => ({ items: [item, ...s.items] }));
  },

  remove: async (id) => {
    set((s) => ({ items: s.items.filter((w) => w.id !== id) }));
    await api.delete<unknown>(`/workouts/${id}`);
  },
}));
