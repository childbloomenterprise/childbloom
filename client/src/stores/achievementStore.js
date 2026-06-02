import { create } from 'zustand';

const useAchievementStore = create((set) => ({
  celebration: null,
  showCelebration: (achievement) => set({ celebration: achievement }),
  dismissCelebration: () => set({ celebration: null }),
}));

export default useAchievementStore;
