import { create } from 'zustand';
import { api } from '../api/client';
import { useToastStore } from './toast.store';

export interface Contact {
  id: string;
  name: string;
  relationship: string;
  lastContact?: string;
  notes?: string;
}

interface RelationshipsStore {
  items: Contact[];
  loading: boolean;
  fetch: () => Promise<void>;
  add: (data: Omit<Contact, 'id'>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useRelationshipsStore = create<RelationshipsStore>((set) => ({
  items: [],
  loading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const items = await api.get<Contact[]>('/contacts');
      set({ items: items ?? [] });
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

  remove: async (id) => {
    set((s) => ({ items: s.items.filter((c) => c.id !== id) }));
    await api.delete<unknown>(`/contacts/${id}`).catch((err) => {
      useToastStore.getState().add(err instanceof Error ? err.message : '삭제에 실패했습니다');
    });
  },
}));
