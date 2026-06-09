import { create } from 'zustand';

const useUiStore = create((set) => ({
  sidebarOpen: false,
  toasts: [],

  // Number of open modal/bottom-sheet surfaces. When > 0 the bottom tab bar
  // and floating SOS hide so the modal owns the screen (otherwise the tab bar,
  // which is a sibling of the page in AppLayout, paints over the sheet — see
  // CBTabBar). A counter (not a boolean) safely handles stacked sheets.
  modalCount: 0,
  openModal: () => set((state) => ({ modalCount: state.modalCount + 1 })),
  closeModal: () => set((state) => ({ modalCount: Math.max(0, state.modalCount - 1) })),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  addToast: (toast) => set((state) => ({
    toasts: [...state.toasts, { id: Date.now(), ...toast }],
  })),

  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  })),
}));

export default useUiStore;
