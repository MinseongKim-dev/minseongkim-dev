import { create } from 'zustand';
import { api } from '../api/client';
import { useToastStore } from './toast.store';

export interface Contact {
  id: string;
  name: string;
  relationship: string;
  lastContact?: string;
  notes?: string;
  phone?: string;
  email?: string;
  birthday?: string;
  tags?: string[];
}

export type MeetingType = 'call' | 'message' | 'meeting' | 'email' | 'other';
export type MeetingMood = 'positive' | 'neutral' | 'negative';

export interface MeetingLog {
  id: string;
  contactId: string;
  date: string;
  type: MeetingType;
  notes?: string;
  mood?: MeetingMood;
}

interface RelationshipsStore {
  items: Contact[];
  meetings: MeetingLog[];
  loading: boolean;
  fetch: () => Promise<void>;
  add: (data: Omit<Contact, 'id'>) => Promise<void>;
  update: (id: string, data: Partial<Contact>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  addMeeting: (data: Omit<MeetingLog, 'id'>) => Promise<void>;
  removeMeeting: (id: string) => Promise<void>;
}

export const useRelationshipsStore = create<RelationshipsStore>((set) => ({
  items: [],
  meetings: [],
  loading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const [items, meetings] = await Promise.all([
        api.get<Contact[]>('/contacts'),
        api.get<MeetingLog[]>('/meetings').catch(() => []),
      ]);
      set({ items: items ?? [], meetings: meetings ?? [] });
    } catch (err) {
      useToastStore.getState().add(err instanceof Error ? err.message : '인간관계 데이터를 불러오지 못했습니다');
    } finally {
      set({ loading: false });
    }
  },

  add: async (data) => {
    try {
      const item = await api.post<Contact>('/contacts', data);
      set((s) => ({ items: [item, ...s.items] }));
    } catch (err) {
      useToastStore.getState().add(err instanceof Error ? err.message : '연락처 추가에 실패했습니다');
      throw err;
    }
  },

  update: async (id, data) => {
    set((s) => ({ items: s.items.map((c) => (c.id === id ? { ...c, ...data } : c)) }));
    await api.put<Contact>(`/contacts/${id}`, data).catch((err) => {
      useToastStore.getState().add(err instanceof Error ? err.message : '업데이트에 실패했습니다');
    });
  },

  remove: async (id) => {
    set((s) => ({ items: s.items.filter((c) => c.id !== id) }));
    await api.delete<unknown>(`/contacts/${id}`).catch((err) => {
      useToastStore.getState().add(err instanceof Error ? err.message : '삭제에 실패했습니다');
    });
  },

  addMeeting: async (data) => {
    try {
      const item = await api.post<MeetingLog>('/meetings', data);
      set((s) => ({ meetings: [item, ...s.meetings] }));
      // Update lastContact on the linked contact
      set((s) => ({
        items: s.items.map((c) =>
          c.id === data.contactId && (!c.lastContact || data.date > c.lastContact)
            ? { ...c, lastContact: data.date }
            : c,
        ),
      }));
    } catch (err) {
      useToastStore.getState().add(err instanceof Error ? err.message : '만남 기록 추가에 실패했습니다');
      throw err;
    }
  },

  removeMeeting: async (id) => {
    set((s) => ({ meetings: s.meetings.filter((m) => m.id !== id) }));
    await api.delete<unknown>(`/meetings/${id}`).catch((err) => {
      useToastStore.getState().add(err instanceof Error ? err.message : '삭제에 실패했습니다');
    });
  },
}));
