import { create } from 'zustand';
import { api } from '../api/client';
import { useToastStore } from './toast.store';

export interface LearningGoal {
  id: string;
  title: string;
  category: string;
  progress: number;
  targetDate?: string;
}

export type BookStatus = 'reading' | 'completed' | 'wishlist';

export interface Book {
  id: string;
  title: string;
  author?: string;
  status: BookStatus;
  progress?: number;
}

export interface StudyLog {
  id: string;
  subject: string;
  duration: number; // minutes
  date: string;
  notes?: string;
}

interface LearningStore {
  goals: LearningGoal[];
  books: Book[];
  studyLogs: StudyLog[];
  loading: boolean;
  fetch: () => Promise<void>;
  addGoal: (data: Omit<LearningGoal, 'id'>) => Promise<void>;
  updateGoal: (id: string, data: Partial<LearningGoal>) => Promise<void>;
  removeGoal: (id: string) => Promise<void>;
  addBook: (data: Omit<Book, 'id'>) => Promise<void>;
  removeBook: (id: string) => Promise<void>;
  addStudyLog: (data: Omit<StudyLog, 'id'>) => Promise<void>;
  removeStudyLog: (id: string) => Promise<void>;
}

export const useLearningStore = create<LearningStore>((set) => ({
  goals: [],
  books: [],
  studyLogs: [],
  loading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const [goals, books, studyLogs] = await Promise.all([
        api.get<LearningGoal[]>('/learning'),
        api.get<Book[]>('/books'),
        api.get<StudyLog[]>('/study'),
      ]);
      set({ goals: goals ?? [], books: books ?? [], studyLogs: studyLogs ?? [] });
    } catch (err) {
      useToastStore.getState().add(err instanceof Error ? err.message : '학습 데이터를 불러오지 못했습니다');
    } finally {
      set({ loading: false });
    }
  },

  addGoal: async (data) => {
    try {
      const item = await api.post<LearningGoal>('/learning', data);
      set((s) => ({ goals: [item, ...s.goals] }));
    } catch (err) {
      useToastStore.getState().add(err instanceof Error ? err.message : '목표 추가에 실패했습니다');
      throw err;
    }
  },

  updateGoal: async (id, data) => {
    set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...data } : g)) }));
    await api.put<LearningGoal>(`/learning/${id}`, data).catch((err) => {
      useToastStore.getState().add(err instanceof Error ? err.message : '업데이트에 실패했습니다');
    });
  },

  removeGoal: async (id) => {
    set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }));
    await api.delete<unknown>(`/learning/${id}`).catch((err) => {
      useToastStore.getState().add(err instanceof Error ? err.message : '삭제에 실패했습니다');
    });
  },

  addBook: async (data) => {
    try {
      const item = await api.post<Book>('/books', data);
      set((s) => ({ books: [item, ...s.books] }));
    } catch (err) {
      useToastStore.getState().add(err instanceof Error ? err.message : '도서 추가에 실패했습니다');
      throw err;
    }
  },

  removeBook: async (id) => {
    set((s) => ({ books: s.books.filter((b) => b.id !== id) }));
    await api.delete<unknown>(`/books/${id}`).catch((err) => {
      useToastStore.getState().add(err instanceof Error ? err.message : '삭제에 실패했습니다');
    });
  },

  addStudyLog: async (data) => {
    try {
      const item = await api.post<StudyLog>('/study', data);
      set((s) => ({ studyLogs: [item, ...s.studyLogs] }));
    } catch (err) {
      useToastStore.getState().add(err instanceof Error ? err.message : '학습 기록 추가에 실패했습니다');
      throw err;
    }
  },

  removeStudyLog: async (id) => {
    set((s) => ({ studyLogs: s.studyLogs.filter((l) => l.id !== id) }));
    await api.delete<unknown>(`/study/${id}`).catch((err) => {
      useToastStore.getState().add(err instanceof Error ? err.message : '삭제에 실패했습니다');
    });
  },
}));
