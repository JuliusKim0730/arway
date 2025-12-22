import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TargetLocation {
  lat: number;
  lng: number;
}

interface NavigationState {
  currentSessionId: string | null;
  targetLocation: TargetLocation | null;
  setSessionId: (id: string) => void;
  setTargetLocation: (location: TargetLocation) => void;
  clearNavigation: () => void;
}

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set) => ({
      currentSessionId: null,
      targetLocation: null,
      setSessionId: (id) => set({ currentSessionId: id }),
      setTargetLocation: (location) => set({ targetLocation: location }),
      clearNavigation: () => set({ currentSessionId: null, targetLocation: null }),
    }),
    {
      name: 'navigation-storage',
    }
  )
);

