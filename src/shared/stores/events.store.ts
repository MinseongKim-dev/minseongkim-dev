import { create } from 'zustand';
import { api } from '../api/client';
import { useToastStore } from './toast.store';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  category?: string;
}

interface EventsStore {
  items: CalendarEvent[];
  loading: boolean;
  fetch: () => Promise<void>;
  add: (data: Omit<CalendarEvent, 'id'>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useEventsStore = create<EventsStore>((set) => ({
  items: [],
  loading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const items = await api.get<CalendarEvent[]>('/events');
      set({ items: items ?? [] });
    } catch (err) {
      useToastStore.getState().add(err instanceof Error ? err.message : '일정을 불러오지 못했습니다');
    } finally {
      set({ loading: false });
    }
  },

  add: async (data) => {
    try {
      const item = await api.post<CalendarEvent>('/events', data);
      set((s) => ({ items: [item, ...s.items] }));
    } catch (err) {
      useToastStore.getState().add(err instanceof Error ? err.message : '일정 추가에 실패했습니다');
      throw err;
    }
  },

  remove: async (id) => {
    set((s) => ({ items: s.items.filter((e) => e.id !== id) }));
    await api.delete<unknown>(`/events/${id}`).catch((err) => {
      useToastStore.getState().add(err instanceof Error ? err.message : '삭제에 실패했습니다');
    });
  },
}));
