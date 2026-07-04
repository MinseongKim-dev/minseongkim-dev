import { create } from 'zustand';
import { api } from '../api/client';
import { useToastStore } from './toast.store';

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
    } catch (err) {
      useToastStore.getState().add(err instanceof Error ? err.message : '재정 데이터를 불러오지 못했습니다');
    } finally {
      set({ loading: false });
    }
  },

  add: async (data) => {
    try {
      const item = await api.post<Transaction>('/transactions', data);
      set((s) => ({ items: [item, ...s.items] }));
    } catch (err) {
      useToastStore.getState().add(err instanceof Error ? err.message : '거래 추가에 실패했습니다');
      throw err;
    }
  },

  remove: async (id) => {
    set((s) => ({ items: s.items.filter((t) => t.id !== id) }));
    await api.delete<unknown>(`/transactions/${id}`).catch((err) => {
      useToastStore.getState().add(err instanceof Error ? err.message : '삭제에 실패했습니다');
    });
  },
}));
