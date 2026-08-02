import { create } from 'zustand';
import { menuAPI } from '../api/menu';
export const useMenuStore = create((set) => ({
  menuItems: [],
  specials: [],
  regulars: [],
  combos: [],
  isLoading: false,
  error: null,
  fetchMenu: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await menuAPI.getActiveMenu();
      set({
        menuItems: data.allItems,
        specials: data.specials,
        regulars: data.regulars,
        combos: data.combos,
        isLoading: false
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  }
}));
