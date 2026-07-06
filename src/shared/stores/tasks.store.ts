import { create } from 'zustand';
import { api } from '../api/client';
import { useToastStore } from './toast.store';

export type Priority = 'urgent' | 'high' | 'medium' | 'low';

export interface Project {
  id: string;
  name: string;
  color?: string;
  status: 'active' | 'completed' | 'archived';
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  due?: string;
  done: boolean;
  status?: TaskStatus;
  tags?: string[];
  parentTaskId?: string;
  projectId?: string;
}

interface TasksStore {
  items: Task[];
  projects: Project[];
  loading: boolean;
  fetch: () => Promise<void>;
  add: (data: { title: string; priority: Priority; due?: string; tags?: string[]; parentTaskId?: string; projectId?: string }) => Promise<void>;
  toggle: (id: string, done: boolean) => Promise<void>;
  setStatus: (id: string, status: TaskStatus) => Promise<void>;
  updateTask: (id: string, data: Partial<Omit<Task, 'id'>>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  addProject: (data: Omit<Project, 'id'>) => Promise<void>;
  removeProject: (id: string) => Promise<void>;
}

export const useTasksStore = create<TasksStore>((set) => ({
  items: [],
  projects: [],
  loading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const [items, projects] = await Promise.all([
        api.get<Task[]>('/tasks'),
        api.get<Project[]>('/projects').catch(() => []),
      ]);
      set({ items: items ?? [], projects: projects ?? [] });
    } catch (err) {
      useToastStore.getState().add(err instanceof Error ? err.message : '할 일 목록을 불러오지 못했습니다');
    } finally {
      set({ loading: false });
    }
  },

  add: async (data) => {
    try {
      const item = await api.post<Task>('/tasks', { ...data, done: false });
      set((s) => ({ items: [item, ...s.items] }));
    } catch (err) {
      useToastStore.getState().add(err instanceof Error ? err.message : '할 일 추가에 실패했습니다');
      throw err;
    }
  },

  toggle: async (id, done) => {
    const status: TaskStatus = done ? 'done' : 'todo';
    set((s) => ({ items: s.items.map((t) => (t.id === id ? { ...t, done, status } : t)) }));
    await api.put<Task>(`/tasks/${id}`, { done, status }).catch((err) => {
      set((s) => ({ items: s.items.map((t) => (t.id === id ? { ...t, done: !done, status: done ? 'todo' : 'done' } : t)) }));
      useToastStore.getState().add(err instanceof Error ? err.message : '업데이트에 실패했습니다');
    });
  },

  setStatus: async (id, status) => {
    const done = status === 'done';
    set((s) => ({ items: s.items.map((t) => (t.id === id ? { ...t, status, done } : t)) }));
    await api.put<Task>(`/tasks/${id}`, { status, done }).catch((err) => {
      useToastStore.getState().add(err instanceof Error ? err.message : '업데이트에 실패했습니다');
    });
  },

  updateTask: async (id, data) => {
    set((s) => ({ items: s.items.map((t) => (t.id === id ? { ...t, ...data } : t)) }));
    await api.put<Task>(`/tasks/${id}`, data).catch((err) => {
      useToastStore.getState().add(err instanceof Error ? err.message : '업데이트에 실패했습니다');
    });
  },

  remove: async (id) => {
    set((s) => ({ items: s.items.filter((t) => t.id !== id) }));
    await api.delete<unknown>(`/tasks/${id}`).catch((err) => {
      useToastStore.getState().add(err instanceof Error ? err.message : '삭제에 실패했습니다');
    });
  },

  addProject: async (data) => {
    try {
      const item = await api.post<Project>('/projects', { ...data, status: 'active' });
      set((s) => ({ projects: [item, ...s.projects] }));
    } catch (err) {
      useToastStore.getState().add(err instanceof Error ? err.message : '프로젝트 추가에 실패했습니다');
      throw err;
    }
  },

  removeProject: async (id) => {
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
    await api.delete<unknown>(`/projects/${id}`).catch((err) => {
      useToastStore.getState().add(err instanceof Error ? err.message : '삭제에 실패했습니다');
    });
  },
}));
