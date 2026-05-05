import { create } from 'zustand';
import { createSharedValue, periodEventBus, regionEventBus, userIdEventBus } from './event-bus'
import QueryClientProvider from './QueryClient'

type PeriodStore = {
  period: string;
  setPeriod: (period: string) => void;
};

export const usePeriodStore = create<PeriodStore>()((set) => ({
  period: '7d',
  setPeriod: (period) => set(() => ({ period })),
}));

type RegionStore = {
  region: string;
  setRegion: (region: string) => void;
};

export const useRegionStore = create<RegionStore>()((set) => ({
  region: 'seoul',
  setRegion: (region) => set(() => ({ region })),
}));

type UserStore = {
  userId: string;
  setUserId: (userId: string) => void;
}

export const useUserStore = create<UserStore>()((set) => ({
  userId: '',
  setUserId: (userId) => set(() => ({ userId })),
}))

export { createSharedValue, periodEventBus, regionEventBus, userIdEventBus, QueryClientProvider }