import { create } from 'zustand';
import { api } from '../api/client';

export type TxType = 'income' | 'expense';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TxType;
  category: string;
  date: string;
}

interface FinanceStore {
  items: Transaction[];
  loading: boolean;
  fetch: () => Promise<void>;
  add: (data: Omit<Transaction, 'id'>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useFinanceStore = create<FinanceStore>((set) => ({
  items: [],
  loading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const items = await api.get<Transaction[]>('/transactions');
      set({ items: items ?? [] });
    } finally {
      set({ loading: false });
    }
  },

  add: async (data) => {
    const item = await api.post<Transaction>('/transactions', data);
    set((s) => ({ items: [item, ...s.items] }));
  },

  remove: async (id) => {
    set((s) => ({ items: s.items.filter((t) => t.id !== id) }));
    await api.delete<unknown>(`/transactions/${id}`);
  },
}));
