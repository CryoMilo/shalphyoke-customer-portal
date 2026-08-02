import { create } from 'zustand';
export const useOrderStore = create((set) => ({
  currentOrder: null,
  orderStatus: null,
  isPlacingOrder: false,
  setCurrentOrder: (order) => set({ currentOrder: order }),
  setOrderStatus: (status) => set({ orderStatus: status }),
  setPlacingOrder: (isPlacing) => set({ isPlacingOrder: isPlacing }),
  resetOrder: () => set({ currentOrder: null, orderStatus: null, isPlacingOrder: false })
}));
