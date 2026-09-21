import { supabase } from "./supabase";

export const orderAPI = {
	/**
	 * Create a new delivery order
	 */
	createDeliveryOrder: async (orderData) => {
		const orderNumber = `DEL-${Date.now().toString(36).toUpperCase()}-${Math.random()
			.toString(36)
			.substring(2, 6)
			.toUpperCase()}`;

		// Format session token for security / device continuity
		let sessionToken = localStorage.getItem("delivery_session_token");
		if (!sessionToken) {
			sessionToken = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
			localStorage.setItem("delivery_session_token", sessionToken);
		}

		const payload = {
			order_number: orderNumber,
			order_type: "delivery",
			order_source: "qr", // Adheres to DB check constraint ['pos', 'qr']
			table_number: null,
			customer_name: orderData.customerName || null,
			customer_phone: orderData.customerPhone || null,
			delivery_address: orderData.deliveryAddress,
			delivery_fee: orderData.deliveryFee || 0,
			order_items: orderData.items,
			subtotal: orderData.subtotal,
			discount_amount: 0,
			total_amount: orderData.totalAmount,
			payment_method: orderData.paymentMethod || "unpaid",
			payment_status: "unpaid",
			pos_order_status: "pending",
			notes: orderData.notes || null,
			item_notes: orderData.itemNotes || {},
			selected_extras: orderData.selectedExtras || [],
			item_extra_prices: orderData.itemExtraPrices || {},
			session_token: sessionToken,
		};

		// Attempt insertion
		const { data, error } = await supabase
			.from("orders")
			.insert(payload)
			.select()
			.single();

		if (error) {
			console.error("Supabase order creation error:", error);
			throw error;
		}

		return data;
	},

	/**
	 * Upload payment slip image to Supabase Storage and update order record
	 */
	uploadPaymentSlip: async (orderId, file) => {
		if (!file) throw new Error("No file provided");

		const fileExt = file.name.split(".").pop();
		const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
		const filePath = `${orderId}/${cleanFileName}`;

		// 1. Upload to Supabase Storage 'payment-slips'
		const { error: uploadError } = await supabase.storage
			.from("payment-slips")
			.upload(filePath, file, {
				cacheControl: "3600",
				upsert: true,
			});

		if (uploadError) {
			console.error("Storage upload error:", uploadError);
			throw uploadError;
		}

		// 2. Get Public URL
		const {
			data: { publicUrl },
		} = supabase.storage.from("payment-slips").getPublicUrl(filePath);

		// 3. Update orders table with payment_slip_url
		const { data, error: updateError } = await supabase
			.from("orders")
			.update({
				payment_slip_url: publicUrl,
				updated_at: new Date().toISOString(),
			})
			.eq("id", orderId)
			.select()
			.single();

		if (updateError) {
			console.error("Failed to update order with slip URL:", updateError);
			// Fallback: If column does not exist yet, log warning and return url
			return { payment_slip_url: publicUrl, warning: updateError.message };
		}

		return data;
	},

	/**
	 * Get order details by ID
	 */
	getStatus: async (orderId) => {
		const { data, error } = await supabase
			.from("orders")
			.select("*")
			.eq("id", orderId)
			.single();

		if (error) throw error;
		return data;
	},

	/**
	 * Realtime subscription to order changes
	 */
	subscribe: (orderId, callback) => {
		return supabase
			.channel(`delivery-order-${orderId}`)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "orders",
					filter: `id=eq.${orderId}`,
				},
				(payload) => callback(payload.new)
			)
			.subscribe();
	},
};
