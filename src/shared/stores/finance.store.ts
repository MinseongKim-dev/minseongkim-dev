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

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  notes?: string;
}

interface FinanceStore {
  items: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  loading: boolean;
  aiLoading: boolean;
  fetch: () => Promise<void>;
  add: (data: Omit<Transaction, 'id'>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  fetchBudgets: () => Promise<void>;
  setBudget: (data: Omit<Budget, 'id'>) => Promise<void>;
  removeBudget: (id: string) => Promise<void>;
  fetchSavingsGoals: () => Promise<void>;
  addSavingsGoal: (data: Omit<SavingsGoal, 'id'>) => Promise<void>;
  updateSavingsGoal: (id: string, data: Partial<SavingsGoal>) => Promise<void>;
  removeSavingsGoal: (id: string) => Promise<void>;
  analyzeFinance: (summary: { income: number; expense: number; byCategory: Record<string, number>; month: string }) => Promise<string>;
}

export const useFinanceStore = create<FinanceStore>((set) => ({
  items: [],
  budgets: [],
  savingsGoals: [],
  loading: false,
  aiLoading: false,

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

  fetchSavingsGoals: async () => {
    try {
      const savingsGoals = await api.get<SavingsGoal[]>('/savings-goals');
      set({ savingsGoals: savingsGoals ?? [] });
    } catch {
      // non-critical
    }
  },

  addSavingsGoal: async (data) => {
    try {
      const item = await api.post<SavingsGoal>('/savings-goals', data);
      set((s) => ({ savingsGoals: [item, ...s.savingsGoals] }));
    } catch (err) {
      useToastStore.getState().add(err instanceof Error ? err.message : '저축 목표 추가에 실패했습니다');
      throw err;
    }
  },

  updateSavingsGoal: async (id, data) => {
    set((s) => ({ savingsGoals: s.savingsGoals.map((g) => (g.id === id ? { ...g, ...data } : g)) }));
    await api.put<SavingsGoal>(`/savings-goals/${id}`, data).catch((err) => {
      useToastStore.getState().add(err instanceof Error ? err.message : '업데이트에 실패했습니다');
    });
  },

  removeSavingsGoal: async (id) => {
    set((s) => ({ savingsGoals: s.savingsGoals.filter((g) => g.id !== id) }));
    await api.delete<unknown>(`/savings-goals/${id}`).catch((err) => {
      useToastStore.getState().add(err instanceof Error ? err.message : '삭제에 실패했습니다');
    });
  },

  analyzeFinance: async (summary) => {
    set({ aiLoading: true });
    try {
      const result = await api.post<{ analysis: string }>('/ai/finance-analysis', summary);
      return result.analysis ?? '';
    } catch {
      useToastStore.getState().add('AI 분석에 실패했습니다. 잠시 후 다시 시도해주세요.');
      return '';
    } finally {
      set({ aiLoading: false });
    }
  },
}));
