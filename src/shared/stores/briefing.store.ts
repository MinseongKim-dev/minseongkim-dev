import { create } from 'zustand';
import { api } from '../api/client';

export interface BriefingHighlight {
  type: 'schedule' | 'task' | 'finance' | 'health' | 'career';
  message: string;
  priority: 'high' | 'medium' | 'low';
}

export interface DailyBriefing {
  greeting?: string;
  summary?: string;
  highlights?: BriefingHighlight[];
  suggestions?: string[];
  motivationalNote?: string;
}

export interface BriefingRecord {
  id: string;
  date: string;
  type: string;
  briefing: DailyBriefing;
}

interface BriefingStore {
  item: BriefingRecord | null;
  loading: boolean;
  fetch: () => Promise<void>;
}

export const useBriefingStore = create<BriefingStore>((set) => ({
  item: null,
  loading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const items = await api.get<BriefingRecord[]>('/coaching');
      const briefings = (items ?? [])
        .filter((i) => i.type === 'daily_briefing')
        .sort((a, b) => b.date.localeCompare(a.date));
      set({ item: briefings[0] ?? null });
    } catch {
      // silently fail — dashboard falls back to local computed text
    } finally {
      set({ loading: false });
    }
  },
}));
