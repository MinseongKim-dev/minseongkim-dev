import { create } from 'zustand';
import { api } from '../api/client';
import { useToastStore } from './toast.store';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  category?: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: string;
  createdAt: string;
}

function sm2(card: Flashcard, quality: number): Pick<Flashcard, 'easeFactor' | 'interval' | 'repetitions' | 'nextReview'> {
  let { easeFactor, interval, repetitions } = card;
  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    repetitions += 1;
  }
  const next = new Date();
  next.setDate(next.getDate() + interval);
  return { easeFactor, interval, repetitions, nextReview: next.toISOString().split('T')[0] };
}

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
  flashcards: Flashcard[];
  loading: boolean;
  fetch: () => Promise<void>;
  addGoal: (data: Omit<LearningGoal, 'id'>) => Promise<void>;
  updateGoal: (id: string, data: Partial<LearningGoal>) => Promise<void>;
  removeGoal: (id: string) => Promise<void>;
  addBook: (data: Omit<Book, 'id'>) => Promise<void>;
  removeBook: (id: string) => Promise<void>;
  addStudyLog: (data: Omit<StudyLog, 'id'>) => Promise<void>;
  removeStudyLog: (id: string) => Promise<void>;
  addFlashcard: (data: { front: string; back: string; category?: string }) => Promise<void>;
  reviewFlashcard: (id: string, quality: number) => Promise<void>;
  removeFlashcard: (id: string) => Promise<void>;
}

export const useLearningStore = create<LearningStore>((set, get) => ({
  goals: [],
  books: [],
  studyLogs: [],
  flashcards: [],
  loading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const [goals, books, studyLogs, flashcards] = await Promise.all([
        api.get<LearningGoal[]>('/learning'),
        api.get<Book[]>('/books'),
        api.get<StudyLog[]>('/study'),
        api.get<Flashcard[]>('/flashcards').catch(() => [] as Flashcard[]),
      ]);
      set({ goals: goals ?? [], books: books ?? [], studyLogs: studyLogs ?? [], flashcards: flashcards ?? [] });
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

  addFlashcard: async ({ front, back, category }) => {
    const today = new Date().toISOString().split('T')[0];
    const payload: Omit<Flashcard, 'id'> = {
      front, back, category,
      easeFactor: 2.5, interval: 0, repetitions: 0,
      nextReview: today, createdAt: today,
    };
    try {
      const item = await api.post<Flashcard>('/flashcards', payload);
      set((s) => ({ flashcards: [item, ...s.flashcards] }));
    } catch (err) {
      useToastStore.getState().add(err instanceof Error ? err.message : '플래시카드 추가에 실패했습니다');
      throw err;
    }
  },

  reviewFlashcard: async (id, quality) => {
    const card = get().flashcards.find((c) => c.id === id);
    if (!card) return;
    const updates = sm2(card, quality);
    set((s) => ({ flashcards: s.flashcards.map((c) => (c.id === id ? { ...c, ...updates } : c)) }));
    await api.put<Flashcard>(`/flashcards/${id}`, updates).catch((err) => {
      useToastStore.getState().add(err instanceof Error ? err.message : '업데이트에 실패했습니다');
    });
  },

  removeFlashcard: async (id) => {
    set((s) => ({ flashcards: s.flashcards.filter((c) => c.id !== id) }));
    await api.delete<unknown>(`/flashcards/${id}`).catch((err) => {
      useToastStore.getState().add(err instanceof Error ? err.message : '삭제에 실패했습니다');
    });
  },
}));
