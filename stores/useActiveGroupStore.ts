import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

type ActiveGroupStore = {
  activeGroupId: string | null;
  hasHydrated: boolean;
  hydrate: () => Promise<void>;
  setActiveGroupId: (nextGroupId: string | null) => Promise<void>;
};

const ACTIVE_GROUP_STORAGE_KEY = 'memoir.active-group-id';

let hydrationPromise: Promise<void> | null = null;

export const useActiveGroupStore = create<ActiveGroupStore>()((set, get) => ({
  activeGroupId: null,
  hasHydrated: false,
  hydrate: async () => {
    if (get().hasHydrated) {
      return;
    }

    if (hydrationPromise) {
      return hydrationPromise;
    }

    hydrationPromise = AsyncStorage.getItem(ACTIVE_GROUP_STORAGE_KEY)
      .then((storedGroupId) => {
        set({
          activeGroupId: storedGroupId,
          hasHydrated: true,
        });
      })
      .catch(() => {
        set({
          activeGroupId: null,
          hasHydrated: true,
        });
      })
      .finally(() => {
        hydrationPromise = null;
      });

    return hydrationPromise;
  },
  setActiveGroupId: async (nextGroupId) => {
    set({ activeGroupId: nextGroupId });

    if (nextGroupId) {
      await AsyncStorage.setItem(ACTIVE_GROUP_STORAGE_KEY, nextGroupId);
      return;
    }

    await AsyncStorage.removeItem(ACTIVE_GROUP_STORAGE_KEY);
  },
}));
