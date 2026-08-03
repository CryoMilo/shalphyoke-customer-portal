import { create } from 'zustand';

export const useBillsStore = create((set) => ({
  bills: [],
  setBills: (bills) => set({ bills }),
}));
