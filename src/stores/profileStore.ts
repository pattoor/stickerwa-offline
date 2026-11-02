import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Metrics {
  stickersCreated: number;
  packsCreated: number;
  packsExported: number;
  packsShared: number;
}

interface ProfileState {
  name: string;
  metrics: Metrics;
  setName: (name: string) => void;
  inc: (key: keyof Metrics) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      name: "Anónimo",
      metrics: {
        stickersCreated: 0,
        packsCreated: 0,
        packsExported: 0,
        packsShared: 0,
      },
      setName: (name) => set({ name }),
      inc: (key) =>
        set((s) => ({ metrics: { ...s.metrics, [key]: s.metrics[key] + 1 } })),
    }),
    { name: "stickers-profile" },
  ),
);