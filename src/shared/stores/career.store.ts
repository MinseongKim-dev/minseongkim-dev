import { create } from 'zustand';
import { api } from '../api/client';
import { useToastStore } from './toast.store';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface Skill {
  id: string;
  name: string;
  category: string;
  level: SkillLevel;
  yearsExp?: number;
  notes?: string;
}

export interface Achievement {
  id: string;
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  date: string;
  impact?: string;
  tags?: string[];
}

export type GoalHorizon = 'short' | 'mid' | 'long';

export interface CareerGoal {
  id: string;
  title: string;
  horizon: GoalHorizon;
  targetDate?: string;
  status: 'active' | 'completed' | 'paused';
  notes?: string;
}

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

export type JobStage = 'research' | 'applied' | 'screening' | 'interview' | 'offer' | 'accepted' | 'rejected';

export interface JobApplication {
  id: string;
  company: string;
  position: string;
  stage: JobStage;
  appliedDate?: string;
  notes?: string;
  nextAction?: string;
  salary?: { min?: number; max?: number; offered?: number };
  url?: string;
}

export interface GrowthJournal {
  id: string;
  date: string;
  lessonsLearned: string;
  challenges: string;
  wins?: string;
  goalsNextWeek?: string;
  mood: 1 | 2 | 3 | 4 | 5;
}

export type CertStatus = 'planned' | 'studying' | 'obtained' | 'expired';

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  status: CertStatus;
  obtainedDate?: string;
  expiryDate?: string;
  linkedLearningGoalId?: string;
}

interface CareerStore {
  target: CareerTarget | null;
  paths: CareerPath[];
  coachLogs: CoachLog[];
  skills: Skill[];
  achievements: Achievement[];
  careerGoals: CareerGoal[];
  jobApplications: JobApplication[];
  growthJournals: GrowthJournal[];
  certifications: Certification[];
  loading: boolean;
  aiLoading: boolean;
  fetch: () => Promise<void>;
  profileTarget: (title: string, context?: string) => Promise<void>;
  assessState: (answers: Record<string, string>) => Promise<void>;
  generatePaths: () => Promise<void>;
  selectPath: (pathId: string) => Promise<void>;
  runCoaching: () => Promise<void>;
  addSkill: (data: Omit<Skill, 'id'>) => Promise<void>;
  removeSkill: (id: string) => Promise<void>;
  addAchievement: (data: Omit<Achievement, 'id'>) => Promise<void>;
  removeAchievement: (id: string) => Promise<void>;
  addCareerGoal: (data: Omit<CareerGoal, 'id'>) => Promise<void>;
  updateCareerGoal: (id: string, data: Partial<CareerGoal>) => Promise<void>;
  removeCareerGoal: (id: string) => Promise<void>;
  addJobApplication: (data: Omit<JobApplication, 'id'>) => Promise<void>;
  updateJobApplication: (id: string, data: Partial<JobApplication>) => Promise<void>;
  removeJobApplication: (id: string) => Promise<void>;
  addGrowthJournal: (data: Omit<GrowthJournal, 'id'>) => Promise<void>;
  removeGrowthJournal: (id: string) => Promise<void>;
  addCertification: (data: Omit<Certification, 'id'>) => Promise<void>;
  updateCertification: (id: string, data: Partial<Certification>) => Promise<void>;
  removeCertification: (id: string) => Promise<void>;
}

export const useCareerStore = create<CareerStore>((set, get) => ({
  target: null,
  paths: [],
  coachLogs: [],
  skills: [],
  achievements: [],
  careerGoals: [],
  jobApplications: [],
  growthJournals: [],
  certifications: [],
  loading: false,
  aiLoading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const [targets, skills, achievements, careerGoals, jobApplications, growthJournals, certifications] = await Promise.all([
        api.get<CareerTarget[]>('/targets'),
        api.get<Skill[]>('/skills').catch(() => []),
        api.get<Achievement[]>('/achievements').catch(() => []),
        api.get<CareerGoal[]>('/career-goals').catch(() => []),
        api.get<JobApplication[]>('/job-apps').catch(() => []),
        api.get<GrowthJournal[]>('/journals').catch(() => []),
        api.get<Certification[]>('/certs').catch(() => []),
      ]);
      const active = (targets ?? []).find((t) => t.status !== 'completed') ?? (targets ?? [])[0] ?? null;
      set({
        target: active ?? null,
        skills: skills ?? [],
        achievements: achievements ?? [],
        careerGoals: careerGoals ?? [],
        jobApplications: jobApplications ?? [],
        growthJournals: growthJournals ?? [],
        certifications: certifications ?? [],
      });
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
      // no target yet — expected on first visit
    } finally {
      set({ loading: false });
    }
  },

  profileTarget: async (title, context) => {
    set({ aiLoading: true });
    try {
      const target = await api.post<CareerTarget>('/career/coach/profile', { title, context });
      set({ target });
    } catch (err) {
      useToastStore.getState().add(err instanceof Error ? err.message : 'AI 분석에 실패했습니다');
      throw err;
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
    } catch (err) {
      useToastStore.getState().add(err instanceof Error ? err.message : '역량 평가에 실패했습니다');
      throw err;
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
    } catch (err) {
      useToastStore.getState().add(err instanceof Error ? err.message : '커리어 경로 생성에 실패했습니다');
      throw err;
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
    } catch (err) {
      useToastStore.getState().add(err instanceof Error ? err.message : '경로 선택에 실패했습니다');
      throw err;
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
    } catch (err) {
      useToastStore.getState().add(err instanceof Error ? err.message : '코칭 실행에 실패했습니다');
      throw err;
    } finally {
      set({ aiLoading: false });
    }
  },

  addSkill: async (data) => {
    try {
      const item = await api.post<Skill>('/skills', data);
      set((s) => ({ skills: [item, ...s.skills] }));
    } catch (err) {
      useToastStore.getState().add(err instanceof Error ? err.message : '스킬 추가에 실패했습니다');
      throw err;
    }
  },

  removeSkill: async (id) => {
    set((s) => ({ skills: s.skills.filter((sk) => sk.id !== id) }));
    await api.delete<unknown>(`/skills/${id}`).catch((err) => {
      useToastStore.getState().add(err instanceof Error ? err.message : '삭제에 실패했습니다');
    });
  },

  addAchievement: async (data) => {
    try {
      const item = await api.post<Achievement>('/achievements', data);
      set((s) => ({ achievements: [item, ...s.achievements] }));
    } catch (err) {
      useToastStore.getState().add(err instanceof Error ? err.message : '성과 추가에 실패했습니다');
      throw err;
    }
  },

  removeAchievement: async (id) => {
    set((s) => ({ achievements: s.achievements.filter((a) => a.id !== id) }));
    await api.delete<unknown>(`/achievements/${id}`).catch((err) => {
      useToastStore.getState().add(err instanceof Error ? err.message : '삭제에 실패했습니다');
    });
  },

  addCareerGoal: async (data) => {
    try {
      const item = await api.post<CareerGoal>('/career-goals', data);
      set((s) => ({ careerGoals: [item, ...s.careerGoals] }));
    } catch (err) {
      useToastStore.getState().add(err instanceof Error ? err.message : '목표 추가에 실패했습니다');
      throw err;
    }
  },

  updateCareerGoal: async (id, data) => {
    set((s) => ({ careerGoals: s.careerGoals.map((g) => (g.id === id ? { ...g, ...data } : g)) }));
    await api.put<CareerGoal>(`/career-goals/${id}`, data).catch((err) => {
      useToastStore.getState().add(err instanceof Error ? err.message : '업데이트에 실패했습니다');
    });
  },

  removeCareerGoal: async (id) => {
    set((s) => ({ careerGoals: s.careerGoals.filter((g) => g.id !== id) }));
    await api.delete<unknown>(`/career-goals/${id}`).catch((err) => {
      useToastStore.getState().add(err instanceof Error ? err.message : '삭제에 실패했습니다');
    });
  },

  addJobApplication: async (data) => {
    try {
      const item = await api.post<JobApplication>('/job-apps', data);
      set((s) => ({ jobApplications: [item, ...s.jobApplications] }));
    } catch (err) {
      useToastStore.getState().add(err instanceof Error ? err.message : '지원 추가에 실패했습니다');
      throw err;
    }
  },

  updateJobApplication: async (id, data) => {
    set((s) => ({ jobApplications: s.jobApplications.map((j) => (j.id === id ? { ...j, ...data } : j)) }));
    await api.put<JobApplication>(`/job-apps/${id}`, data).catch((err) => {
      useToastStore.getState().add(err instanceof Error ? err.message : '업데이트에 실패했습니다');
    });
  },

  removeJobApplication: async (id) => {
    set((s) => ({ jobApplications: s.jobApplications.filter((j) => j.id !== id) }));
    await api.delete<unknown>(`/job-apps/${id}`).catch((err) => {
      useToastStore.getState().add(err instanceof Error ? err.message : '삭제에 실패했습니다');
    });
  },

  addGrowthJournal: async (data) => {
    try {
      const item = await api.post<GrowthJournal>('/journals', data);
      set((s) => ({ growthJournals: [item, ...s.growthJournals] }));
    } catch (err) {
      useToastStore.getState().add(err instanceof Error ? err.message : '저널 추가에 실패했습니다');
      throw err;
    }
  },

  removeGrowthJournal: async (id) => {
    set((s) => ({ growthJournals: s.growthJournals.filter((j) => j.id !== id) }));
    await api.delete<unknown>(`/journals/${id}`).catch((err) => {
      useToastStore.getState().add(err instanceof Error ? err.message : '삭제에 실패했습니다');
    });
  },

  addCertification: async (data) => {
    try {
      const item = await api.post<Certification>('/certs', data);
      set((s) => ({ certifications: [item, ...s.certifications] }));
    } catch (err) {
      useToastStore.getState().add(err instanceof Error ? err.message : '자격증 추가에 실패했습니다');
      throw err;
    }
  },

  updateCertification: async (id, data) => {
    set((s) => ({ certifications: s.certifications.map((c) => (c.id === id ? { ...c, ...data } : c)) }));
    await api.put<Certification>(`/certs/${id}`, data).catch((err) => {
      useToastStore.getState().add(err instanceof Error ? err.message : '업데이트에 실패했습니다');
    });
  },

  removeCertification: async (id) => {
    set((s) => ({ certifications: s.certifications.filter((c) => c.id !== id) }));
    await api.delete<unknown>(`/certs/${id}`).catch((err) => {
      useToastStore.getState().add(err instanceof Error ? err.message : '삭제에 실패했습니다');
    });
  },
}));
