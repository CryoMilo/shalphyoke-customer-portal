import { create } from 'zustand';
export const useSessionStore = create((set) => ({
  session: null,
  bills: [],
  isLoading: false,
  setSession: (session) => set({ session }),
  setBills: (bills) => set({ bills }),
  setLoading: (isLoading) => set({ isLoading }),
  addBill: (bill) => set((state) => ({ bills: [...state.bills, bill] })),
  updateBill: (updatedBill) => set((state) => ({
    bills: state.bills.map(bill => bill.id === updatedBill.id ? updatedBill : bill)
  })),
  removeBill: (billId) => set((state) => ({
    bills: state.bills.filter(bill => bill.id !== billId)
  }))
}));
