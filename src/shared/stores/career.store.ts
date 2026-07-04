import { create } from 'zustand';
import { api } from '../api/client';

export interface Assessment {
  dimension: string;
  score: number;
  currentState: string;
  targetState: string;
  gaps: { id: string; name: string; currentLevel: number; requiredLevel: number; priority: string }[];
  aiDiagnosis: string;
}

export interface CareerPath {
  id: string;
  targetId: string;
  name: string;
  description: string;
  estimatedMonths: number;
  riskLevel: 'low' | 'medium' | 'high';
  salaryImpact: string;
  stability: string;
  isSelected: boolean;
  phases: {
    order: number;
    name: string;
    durationMonths: number;
    urgency: string;
    actions: { title: string; description: string; order: number }[];
  }[];
}

export interface CareerTarget {
  id: string;
  title: string;
  description?: string;
  status: 'exploring' | 'active' | 'completed';
  overallReadiness: number;
  estimatedMonths?: number;
  selectedPathId?: string;
  lastAssessedAt?: string;
  currentAssessment?: Assessment[];
}

export interface CoachLog {
  id: string;
  targetId: string;
  type: 'checkin' | 'deviation_alert' | 'opportunity' | 'milestone';
  message: string;
  createdAt?: string;
}

interface CareerStore {
  target: CareerTarget | null;
  paths: CareerPath[];
  coachLogs: CoachLog[];
  loading: boolean;
  aiLoading: boolean;
  fetch: () => Promise<void>;
  profileTarget: (title: string, context?: string) => Promise<void>;
  assessState: (answers: Record<string, string>) => Promise<void>;
  generatePaths: () => Promise<void>;
  selectPath: (pathId: string) => Promise<void>;
  runCoaching: () => Promise<void>;
}

export const useCareerStore = create<CareerStore>((set, get) => ({
  target: null,
  paths: [],
  coachLogs: [],
  loading: false,
  aiLoading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const targets = await api.get<CareerTarget[]>('/targets');
      const active = (targets ?? []).find((t) => t.status !== 'completed') ?? (targets ?? [])[0] ?? null;
      set({ target: active ?? null });
      if (active) {
        const [paths, logs] = await Promise.all([
          api.get<CareerPath[]>('/cpaths').catch(() => []),
          api.get<CoachLog[]>('/coachlogs').catch(() => []),
        ]);
        set({
          paths: (paths ?? []).filter((p) => p.targetId === active.id),
          coachLogs: (logs ?? []).filter((l) => l.targetId === active.id).slice(0, 10),
        });
      }
    } catch {
      // no target yet
    } finally {
      set({ loading: false });
    }
  },

  profileTarget: async (title, context) => {
    set({ aiLoading: true });
    try {
      const target = await api.post<CareerTarget>('/career/coach/profile', { title, context });
      set({ target });
    } finally {
      set({ aiLoading: false });
    }
  },

  assessState: async (answers) => {
    const { target } = get();
    if (!target) return;
    set({ aiLoading: true });
    try {
      const result = await api.post<{ assessments: Assessment[]; overallReadiness: number }>(
        '/career/coach/assess',
        { targetId: target.id, answers },
      );
      set((s) => ({
        target: s.target
          ? { ...s.target, currentAssessment: result.assessments, overallReadiness: result.overallReadiness, status: 'active' }
          : null,
      }));
    } finally {
      set({ aiLoading: false });
    }
  },

  generatePaths: async () => {
    const { target } = get();
    if (!target) return;
    set({ aiLoading: true });
    try {
      const paths = await api.post<CareerPath[]>('/career/coach/paths', { targetId: target.id });
      set({ paths: paths ?? [] });
    } finally {
      set({ aiLoading: false });
    }
  },

  selectPath: async (pathId) => {
    const { target } = get();
    if (!target) return;
    set({ aiLoading: true });
    try {
      await api.post(`/career/coach/paths/${pathId}/select`, {});
      set((s) => ({
        target: s.target ? { ...s.target, selectedPathId: pathId } : null,
        paths: s.paths.map((p) => ({ ...p, isSelected: p.id === pathId })),
      }));
    } finally {
      set({ aiLoading: false });
    }
  },

  runCoaching: async () => {
    const { target } = get();
    if (!target) return;
    set({ aiLoading: true });
    try {
      const logs = await api.post<CoachLog[]>(`/career/coach/coaching/${target.id}`, {});
      set((s) => ({ coachLogs: [...(logs ?? []), ...s.coachLogs].slice(0, 10) }));
    } finally {
      set({ aiLoading: false });
    }
  },
}));
