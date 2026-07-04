import { create } from 'zustand';
import { api } from '../api/client';

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
    } finally {
      set({ loading: false });
    }
  },

  add: async (data) => {
    const item = await api.post<CalendarEvent>('/events', data);
    set((s) => ({ items: [item, ...s.items] }));
  },

  remove: async (id) => {
    set((s) => ({ items: s.items.filter((e) => e.id !== id) }));
    await api.delete<unknown>(`/events/${id}`);
  },
}));
