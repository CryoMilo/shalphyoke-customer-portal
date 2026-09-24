import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useOrderFlowStore = create(
	persist(
		(set) => ({
			// Steps: 'location' | 'menu' | 'checkout' | 'waiting'
			// Defaults to 'menu'. If location is not confirmed, QROrder renders LocationPromptPage.
			step: "menu",

			// Location chosen in Step 1 (no default location chosen by system)
			selectedLocation: {
				apartmentId: null,
				apartmentName: null,
				building: "",
				fee: 0,
				isConfirmed: false,
			},

			// Customer detail info
			customerInfo: {
				customerId: null,
				name: "",
				phone: "",
				notes: "",
			},

			// Payment details
			paymentInfo: {
				type: "promptpay", // 'promptpay' | 'truemoney' | 'cod'
				slipFile: null,
				slipPreviewUrl: null,
				slipUrl: null,
			},

			// Active order request (Phase 1 & 2 staging)
			activeOrderRequest: null,

			// Active order when created (Final POS order)
			currentOrder: null,

			// Actions
			setStep: (step) => set({ step }),

			setLocation: (locationUpdate) =>
				set((state) => ({
					selectedLocation: {
						...state.selectedLocation,
						...locationUpdate,
						isConfirmed: true,
					},
				})),

			setCustomerInfo: (infoUpdate) =>
				set((state) => ({
					customerInfo: {
						...state.customerInfo,
						...infoUpdate,
					},
				})),

			setPaymentInfo: (paymentUpdate) =>
				set((state) => ({
					paymentInfo: {
						...state.paymentInfo,
						...paymentUpdate,
					},
				})),

			setActiveOrderRequest: (orderRequest) =>
				set({ activeOrderRequest: orderRequest }),

			updateActiveOrderRequest: (updates) =>
				set((state) => ({
					activeOrderRequest: state.activeOrderRequest
						? { ...state.activeOrderRequest, ...updates }
						: null,
				})),

			setCurrentOrder: (order) => set({ currentOrder: order }),

			resetOrderFlow: () =>
				set(() => ({
					step: "menu",
					paymentInfo: {
						type: "promptpay",
						slipFile: null,
						slipPreviewUrl: null,
						slipUrl: null,
					},
					activeOrderRequest: null,
					currentOrder: null,
				})),
		}),
		{
			name: "shalphyoke_order_flow",
			partialize: (state) => ({
				selectedLocation: state.selectedLocation,
				customerInfo: state.customerInfo,
				activeOrderRequest: state.activeOrderRequest,
			}),
		}
	)
);
