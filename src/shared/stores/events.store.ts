import { create } from 'zustand';
import { api } from '../api/client';
import { useToastStore } from './toast.store';

export type RecurrenceType = 'none' | 'weekly' | 'monthly';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  category?: string;
  recurrence?: RecurrenceType;
  recurrenceGroupId?: string;
}

interface EventsStore {
  items: CalendarEvent[];
  loading: boolean;
  fetch: () => Promise<void>;
  add: (data: Omit<CalendarEvent, 'id'>) => Promise<void>;
  addRecurring: (base: Omit<CalendarEvent, 'id'>, recurrence: 'weekly' | 'monthly', count: number) => Promise<void>;
  remove: (id: string) => Promise<void>;
  removeGroup: (groupId: string) => Promise<void>;
}

export const useEventsStore = create<EventsStore>((set, get) => ({
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

  addRecurring: async (base, recurrence, count) => {
    const groupId = crypto.randomUUID();
    const dates: string[] = [];
    const start = new Date(base.date + 'T12:00:00');
    for (let i = 0; i < count; i++) {
      const d = new Date(start);
      if (recurrence === 'weekly') d.setDate(start.getDate() + i * 7);
      else d.setMonth(start.getMonth() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    try {
      const created = await Promise.all(
        dates.map((date) =>
          api.post<CalendarEvent>('/events', { ...base, date, recurrence, recurrenceGroupId: groupId }),
        ),
      );
      set((s) => ({ items: [...created, ...s.items] }));
    } catch (err) {
      useToastStore.getState().add(err instanceof Error ? err.message : '반복 일정 추가에 실패했습니다');
      throw err;
    }
  },

  remove: async (id) => {
    set((s) => ({ items: s.items.filter((e) => e.id !== id) }));
    await api.delete<unknown>(`/events/${id}`).catch((err) => {
      useToastStore.getState().add(err instanceof Error ? err.message : '삭제에 실패했습니다');
    });
  },

  removeGroup: async (groupId) => {
    const toRemove = get().items.filter((e) => e.recurrenceGroupId === groupId);
    set((s) => ({ items: s.items.filter((e) => e.recurrenceGroupId !== groupId) }));
    await Promise.all(toRemove.map((e) => api.delete<unknown>(`/events/${e.id}`))).catch((err) => {
      useToastStore.getState().add(err instanceof Error ? err.message : '삭제에 실패했습니다');
    });
  },
}));
