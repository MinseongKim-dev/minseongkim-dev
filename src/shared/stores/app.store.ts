import { create } from 'zustand';

export type ViewId =
  | 'dashboard'
  | 'schedule'
  | 'tasks'
  | 'finance'
  | 'health'
  | 'learning'
  | 'career'
  | 'relations';

interface AppStore {
  view: ViewId;
  chatOpen: boolean;
  setView: (v: ViewId) => void;
  toggleChat: () => void;
  setChatOpen: (open: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  view: 'dashboard',
  chatOpen: false,
  setView: (view) => set({ view }),
  toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
  setChatOpen: (chatOpen) => set({ chatOpen }),
}));
