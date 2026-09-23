import { create } from "zustand";
import { persist } from "zustand/middleware";

const generateCartId = () =>
	`cart_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export const useCartStore = create(
	persist(
		(set, get) => ({
			cart: [],
			itemNotes: {},
			itemExtraPrices: {},

			/**
			 * Add item to cart with optional add-on note, extra unit price, and quantity
			 */
			addToCart: (item, note = "", extraPrice = 0, quantity = 1) => {
				const trimmedNote = (note || "").trim();
				const numExtraPrice = Number(extraPrice) || 0;
				const numQuantity = Math.max(1, Number(quantity) || 1);

				set((state) => {
					// If item has NO note and NO extra price, de-duplicate if a plain version exists
					if (!trimmedNote && numExtraPrice === 0) {
						const existingIndex = state.cart.findIndex(
							(i) => i.id === item.id && !state.itemNotes[i.cart_id]
						);

						if (existingIndex > -1) {
							const updatedCart = [...state.cart];
							updatedCart[existingIndex] = {
								...updatedCart[existingIndex],
								quantity: updatedCart[existingIndex].quantity + numQuantity,
							};
							return { cart: updatedCart };
						}
					}

					// Otherwise, generate a dedicated cart_id
					const cart_id = generateCartId();
					const final_price = (Number(item.price) || 0) + numExtraPrice;

					const newItem = {
						...item,
						cart_id,
						quantity: numQuantity,
						extra_price: numExtraPrice,
						final_price,
						notes: trimmedNote,
					};

					const nextNotes = { ...state.itemNotes };
					const nextExtraPrices = { ...state.itemExtraPrices };

					if (trimmedNote) {
						nextNotes[cart_id] = trimmedNote;
					}
					if (numExtraPrice > 0) {
						nextExtraPrices[cart_id] = numExtraPrice;
					}

					return {
						cart: [...state.cart, newItem],
						itemNotes: nextNotes,
						itemExtraPrices: nextExtraPrices,
					};
				});
			},

			/**
			 * Update item note and extra price for an existing line item
			 */
			updateItemNote: (cartId, newNote = "", newExtraPrice = 0) => {
				const trimmedNote = (newNote || "").trim();
				const numExtraPrice = Number(newExtraPrice) || 0;

				set((state) => {
					const nextNotes = { ...state.itemNotes };
					const nextExtraPrices = { ...state.itemExtraPrices };

					if (trimmedNote) {
						nextNotes[cartId] = trimmedNote;
					} else {
						delete nextNotes[cartId];
					}

					if (numExtraPrice > 0) {
						nextExtraPrices[cartId] = numExtraPrice;
					} else {
						delete nextExtraPrices[cartId];
					}

					const updatedCart = state.cart.map((item) => {
						if (item.cart_id !== cartId) return item;
						return {
							...item,
							notes: trimmedNote,
							extra_price: numExtraPrice,
							final_price: (Number(item.price) || 0) + numExtraPrice,
						};
					});

					return {
						cart: updatedCart,
						itemNotes: nextNotes,
						itemExtraPrices: nextExtraPrices,
					};
				});
			},

			/**
			 * Update quantity of a line item by delta (+1 or -1)
			 */
			updateQuantity: (cartId, delta) => {
				set((state) => {
					const item = state.cart.find((i) => i.cart_id === cartId);
					if (!item) return state;

					const newQuantity = item.quantity + delta;

					// If quantity hits 0, remove and clean up associated notes & prices
					if (newQuantity <= 0) {
						const nextNotes = { ...state.itemNotes };
						const nextExtraPrices = { ...state.itemExtraPrices };
						delete nextNotes[cartId];
						delete nextExtraPrices[cartId];

						return {
							cart: state.cart.filter((i) => i.cart_id !== cartId),
							itemNotes: nextNotes,
							itemExtraPrices: nextExtraPrices,
						};
					}

					return {
						cart: state.cart.map((i) =>
							i.cart_id === cartId ? { ...i, quantity: newQuantity } : i
						),
					};
				});
			},

			/**
			 * Remove a line item and garbage collect associated notes and extra prices
			 */
			removeFromCart: (cartId) => {
				set((state) => {
					const nextNotes = { ...state.itemNotes };
					const nextExtraPrices = { ...state.itemExtraPrices };
					delete nextNotes[cartId];
					delete nextExtraPrices[cartId];

					return {
						cart: state.cart.filter((i) => i.cart_id !== cartId),
						itemNotes: nextNotes,
						itemExtraPrices: nextExtraPrices,
					};
				});
			},

			/**
			 * Clear the entire cart and mappings
			 */
			clearCart: () =>
				set({
					cart: [],
					itemNotes: {},
					itemExtraPrices: {},
				}),

			/**
			 * Calculate total price including unit extras
			 */
			getCartTotal: () => {
				const { cart, itemExtraPrices } = get();
				return cart.reduce((sum, item) => {
					const extraPrice =
						item.extra_price !== undefined
							? Number(item.extra_price)
							: Number(itemExtraPrices[item.cart_id] || 0);
					const unitFinalPrice = (Number(item.price) || 0) + extraPrice;
					return sum + unitFinalPrice * (Number(item.quantity) || 1);
				}, 0);
			},
		}),
		{
			name: "shalphyoke_customer_cart",
		}
	)
);
