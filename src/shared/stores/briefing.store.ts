import { create } from 'zustand';
import { api } from '../api/client';
import type { ViewId } from './app.store';

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

interface SpecialistBriefRecord {
  id: string;
  date: string;
  domain: string;
  insight: string;
}

interface BriefingStore {
  item: BriefingRecord | null;
  specialistInsights: Partial<Record<ViewId, string>>;
  loading: boolean;
  fetch: () => Promise<void>;
}

const VIEW_TO_DOMAIN: Partial<Record<ViewId, string>> = {
  schedule: 'schedule', tasks: 'tasks', finance: 'finance',
  health: 'health', learning: 'learning', career: 'career', relations: 'relationships',
};

export const useBriefingStore = create<BriefingStore>((set) => ({
  item: null,
  specialistInsights: {},
  loading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const items = await api.get<(BriefingRecord & SpecialistBriefRecord)[]>('/coaching');
      const all = items ?? [];

      const briefings = all
        .filter((i) => i.type === 'daily_briefing')
        .sort((a, b) => b.date.localeCompare(a.date));

      const today = new Date().toISOString().split('T')[0];
      const specialistInsights: Partial<Record<ViewId, string>> = {};

      for (const [view, domain] of Object.entries(VIEW_TO_DOMAIN) as [ViewId, string][]) {
        const match = all
          .filter((i) => i.type === 'specialist_brief' && (i as unknown as SpecialistBriefRecord).domain === domain && i.date === today)
          .sort((a, b) => b.date.localeCompare(a.date))[0] as unknown as SpecialistBriefRecord | undefined;
        if (match?.insight) specialistInsights[view] = match.insight;
      }

      set({ item: briefings[0] ?? null, specialistInsights });
    } catch {
      // silently fail
    } finally {
      set({ loading: false });
    }
  },
}));
