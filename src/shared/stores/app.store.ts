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
  pendingMessage: string | null;
  setView: (v: ViewId) => void;
  toggleChat: () => void;
  setChatOpen: (open: boolean) => void;
  sendToChatOpen: (msg: string) => void;
  clearPendingMessage: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  view: 'dashboard',
  chatOpen: false,
  pendingMessage: null,
  setView: (view) => set({ view }),
  toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
  setChatOpen: (chatOpen) => set({ chatOpen }),
  sendToChatOpen: (msg) => set({ chatOpen: true, pendingMessage: msg }),
  clearPendingMessage: () => set({ pendingMessage: null }),
}));
