import { create } from 'zustand';
export const useCartStore = create((set, get) => ({
  cart: [],
  addToCart: (item) => {
    set((state) => {
      const existing = state.cart.find(i => i.id === item.id);
      if (existing) {
        return {
          cart: state.cart.map(i =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          )
        };
      }
      return {
        cart: [...state.cart, { ...item, quantity: 1, cart_id: crypto.randomUUID() }]
      };
    });
  },
  removeFromCart: (cartId) => {
    set((state) => ({ cart: state.cart.filter(i => i.cart_id !== cartId) }));
  },
  updateQuantity: (cartId, delta) => {
    set((state) => {
      const item = state.cart.find(i => i.cart_id === cartId);
      if (!item) return state;
      const newQuantity = item.quantity + delta;
      if (newQuantity <= 0) {
        return { cart: state.cart.filter(i => i.cart_id !== cartId) };
      }
      return {
        cart: state.cart.map(i =>
          i.cart_id === cartId ? { ...i, quantity: newQuantity } : i
        )
      };
    });
  },
  clearCart: () => set({ cart: [] }),
  get total() {
    return get().cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }
}));
