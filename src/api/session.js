import { supabase } from "./supabase";

export const sessionAPI = {
	getTableBills: async (tableNumber) => {
		const { data, error } = await supabase
			.from("orders")
			.select("*")
			.eq("table_number", tableNumber)
			.eq("order_source", "qr")
			.in("pos_order_status", ["pending", "preparing", "ready"]) // Only show active orders
			.order("created_at", { ascending: true });

		if (error) throw error;
		return data;
	},
};
