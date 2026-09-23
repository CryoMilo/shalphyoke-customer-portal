import { supabase } from "./supabase";

export const customerAPI = {
	/**
	 * Search customers by name or phone
	 * Tries search_customers RPC first, then falls back to ILIKE query
	 */
	search: async (searchTerm) => {
		if (!searchTerm || searchTerm.trim().length < 1) return [];
		const term = searchTerm.trim();

		// 1. Try search_customers RPC first
		try {
			const { data, error } = await supabase.rpc("search_customers", {
				p_query: term,
				p_limit: 8,
			});
			if (!error && Array.isArray(data)) return data;
		} catch (err) {
			console.warn("RPC search_customers fallback:", err);
		}

		// 2. Fallback query
		try {
			const { data, error } = await supabase
				.from("customers")
				.select("id, name, phone, delivery_address, building_info, default_notes")
				.or(`name.ilike.%${term}%,phone.ilike.%${term}%`)
				.limit(8);

			if (!error && Array.isArray(data)) return data;
		} catch (err) {
			console.error("Customer search fallback error:", err);
		}

		return [];
	},

	/**
	 * Update customer delivery_address and building_info to clean up legacy inconsistent entries
	 */
	updateCustomerAddressAndBuilding: async (customerId, deliveryAddress, buildingInfo, phone = null) => {
		if (!customerId) return;
		try {
			const updatePayload = {
				updated_at: new Date().toISOString(),
			};
			if (deliveryAddress) updatePayload.delivery_address = deliveryAddress.trim();
			if (buildingInfo !== undefined) updatePayload.building_info = buildingInfo?.trim() || null;
			if (phone) updatePayload.phone = phone.trim();

			await supabase
				.from("customers")
				.update(updatePayload)
				.eq("id", customerId);
		} catch (err) {
			console.error("Failed to update and clean up customer address/building:", err);
		}
	},
};
