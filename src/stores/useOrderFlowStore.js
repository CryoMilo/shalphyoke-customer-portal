import { create } from "zustand";
import { persist } from "zustand/middleware";
import { FIXED_APARTMENTS } from "../utils/deliveryLocations";

export const useOrderFlowStore = create(
	persist(
		(set) => ({
			// Steps: 'location' | 'menu' | 'checkout' | 'waiting'
			step: "location",

			// Location chosen in Step 1
			selectedLocation: {
				apartmentId: FIXED_APARTMENTS[0].id,
				apartmentName: FIXED_APARTMENTS[0].name,
				building: FIXED_APARTMENTS[0].buildings[0] || "",
				fee: FIXED_APARTMENTS[0].fee,
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

			// Active order when created
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
					currentOrder: null,
				})),
		}),
		{
			name: "shalphyoke_order_flow",
			partialize: (state) => ({
				selectedLocation: state.selectedLocation,
				customerInfo: state.customerInfo,
			}),
		}
	)
);
