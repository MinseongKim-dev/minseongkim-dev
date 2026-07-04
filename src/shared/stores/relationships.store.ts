import { create } from 'zustand';
import { api } from '../api/client';

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
    } finally {
      set({ loading: false });
    }
  },

  add: async (data) => {
    const item = await api.post<Contact>('/contacts', data);
    set((s) => ({ items: [item, ...s.items] }));
  },

  remove: async (id) => {
    set((s) => ({ items: s.items.filter((c) => c.id !== id) }));
    await api.delete<unknown>(`/contacts/${id}`);
  },
}));
