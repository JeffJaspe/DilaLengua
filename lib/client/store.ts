"use client";
import { create } from "zustand";
import { api, today } from "./api";
import { emptyProgress, type ProgressData } from "../progression";

export type Me = { name: string | null; xp: number; xpToday: number; dailyGoal: number; streak: number; longestStreak: number; reviewDue: number };

type State = {
  me: Me | null;
  progress: ProgressData;
  loaded: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setMe: (me: Me) => void;
};

export const useProgress = create<State>((set) => ({
  me: null,
  progress: emptyProgress(),
  loaded: false,
  error: null,
  refresh: async () => {
    try {
      const r = await api<{ me: Me; progress: ProgressData }>(`/api/progress?today=${today()}`);
      set({ me: r.me, progress: r.progress, loaded: true, error: null });
    } catch (e) {
      set({ loaded: true, error: (e as Error).message });
    }
  },
  setMe: (me) => set({ me }),
}));
