import { supabase } from "./supabase";
import { customerAPI } from "./customers";
import { compressPaymentSlip } from "../utils/imageCompressor";

export const orderRequestAPI = {
	/**
	 * Create a new order request (Phase 1)
	 */
	createOrderRequest: async (requestData) => {
		const requestNumber = `REQ-${Date.now().toString(36).toUpperCase()}-${Math.random()
			.toString(36)
			.substring(2, 6)
			.toUpperCase()}`;

		// Persistent session token for device/session continuity
		let sessionToken = localStorage.getItem("delivery_session_token");
		if (!sessionToken) {
			sessionToken = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
			localStorage.setItem("delivery_session_token", sessionToken);
		}

		const hasUncertainItems = Boolean(requestData.hasUncertainItems);
		const initialStockStatus = hasUncertainItems ? "pending_check" : "stock_confirmed";
		const initialStatus = hasUncertainItems ? "stock_checking" : "awaiting_payment";

		const payload = {
			request_number: requestNumber,
			session_token: sessionToken,
			customer_id: requestData.customerId || null,
			customer_name: requestData.customerName,
			customer_phone: requestData.customerPhone,
			delivery_address: requestData.deliveryAddress,
			clean_address: requestData.cleanAddress || null,
			clean_building_info: requestData.cleanBuildingInfo || null,
			items: requestData.items,
			item_notes: requestData.itemNotes || {},
			item_extra_prices: requestData.itemExtraPrices || {},
			subtotal: requestData.subtotal,
			delivery_fee: requestData.deliveryFee || 0,
			total_amount: requestData.totalAmount,
			notes: requestData.notes || null,
			has_uncertain_items: hasUncertainItems,
			stock_status: initialStockStatus,
			status: initialStatus,
		};

		const { data, error } = await supabase
			.from("order_requests")
			.insert(payload)
			.select()
			.single();

		if (error) {
			console.error("Failed to create order request:", error);
			throw error;
		}

		// Update or link customer's normalized address in customer database
		const resolvedCustomerId = data?.customer_id || requestData.customerId;
		if (resolvedCustomerId && (requestData.cleanAddress || requestData.cleanBuildingInfo)) {
			customerAPI.updateCustomerAddressAndBuilding(
				resolvedCustomerId,
				requestData.cleanAddress,
				requestData.cleanBuildingInfo,
				requestData.customerPhone
			);
		}

		return data;
	},

	/**
	 * Get an order request by ID
	 */
	getOrderRequest: async (requestId) => {
		const { data, error } = await supabase
			.from("order_requests")
			.select("*")
			.eq("id", requestId)
			.single();

		if (error) {
			console.error("Failed to fetch order request:", error);
			throw error;
		}

		return data;
	},

	/**
	 * Update an order request (e.g. submit payment details, items adjust, or cancel)
	 */
	updateOrderRequest: async (requestId, updates) => {
		const { data, error } = await supabase
			.from("order_requests")
			.update(updates)
			.eq("id", requestId)
			.select()
			.single();

		if (error) {
			console.error("Failed to update order request:", error);
			throw error;
		}

		return data;
	},

	/**
	 * Submit payment for order request (Phase 2)
	 */
	submitPayment: async (requestId, { paymentType, paymentSlipUrl }) => {
		const updates = {
			payment_type: paymentType,
			payment_slip_url: paymentSlipUrl || null,
			payment_submitted_at: new Date().toISOString(),
			status: "paid_pending_approval",
		};

		return orderRequestAPI.updateOrderRequest(requestId, updates);
	},

	/**
	 * Upload payment slip image to Supabase Storage
	 */
	uploadPaymentSlip: async (requestIdOrTemp, file) => {
		if (!file) throw new Error("No file provided");

		// Automatically compress file on client to ~100-150KB
		const readyFile = await compressPaymentSlip(file);

		const fileExt = (readyFile.name || file.name).split(".").pop();
		const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
		const filePath = `${requestIdOrTemp}/${cleanFileName}`;

		const { error: uploadError } = await supabase.storage
			.from("payment-slips")
			.upload(filePath, readyFile, {
				cacheControl: "3600",
				upsert: true,
			});

		if (uploadError) {
			console.error("Storage upload error:", uploadError);
			throw uploadError;
		}

		const {
			data: { publicUrl },
		} = supabase.storage.from("payment-slips").getPublicUrl(filePath);

		return publicUrl;
	},

	/**
	 * Subscribe to lightweight realtime changes for an order request
	 * Keeps egress down by listening only to the specific record id
	 */
	subscribeToOrderRequest: (requestId, onUpdate) => {
		return supabase
			.channel(`order-request-${requestId}`)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "order_requests",
					filter: `id=eq.${requestId}`,
				},
				(payload) => onUpdate(payload.new)
			)
			.subscribe();
	},
};
