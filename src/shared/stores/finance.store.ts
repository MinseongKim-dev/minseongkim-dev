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

export interface Budget {
  id: string;
  category: string;
  amount: number;
  period: 'monthly';
}

interface FinanceStore {
  items: Transaction[];
  budgets: Budget[];
  loading: boolean;
  fetch: () => Promise<void>;
  add: (data: Omit<Transaction, 'id'>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  fetchBudgets: () => Promise<void>;
  setBudget: (data: Omit<Budget, 'id'>) => Promise<void>;
  removeBudget: (id: string) => Promise<void>;
}

export const useFinanceStore = create<FinanceStore>((set) => ({
  items: [],
  budgets: [],
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

  fetchBudgets: async () => {
    try {
      const budgets = await api.get<Budget[]>('/budgets');
      set({ budgets: budgets ?? [] });
    } catch {
      // non-critical
    }
  },

  setBudget: async (data) => {
    try {
      const item = await api.post<Budget>('/budgets', { ...data, period: 'monthly' });
      set((s) => ({
        budgets: [item, ...s.budgets.filter((b) => b.category !== data.category)],
      }));
    } catch (err) {
      useToastStore.getState().add(err instanceof Error ? err.message : '예산 설정에 실패했습니다');
      throw err;
    }
  },

  removeBudget: async (id) => {
    set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) }));
    await api.delete<unknown>(`/budgets/${id}`).catch((err) => {
      useToastStore.getState().add(err instanceof Error ? err.message : '예산 삭제에 실패했습니다');
    });
  },
}));
