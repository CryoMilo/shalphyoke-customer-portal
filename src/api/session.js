import { supabase } from "./supabase";

export const sessionAPI = {
	validate: async (tableNumber, token) => {
		const { data, error } = await supabase
			.from("table_sessions")
			.select("*")
			.eq("table_number", tableNumber)
			.eq("session_token", token)
			.eq("status", "active")
			.gte("expires_at", new Date().toISOString())
			.single();

		if (error && error.code === "PGRST116") {
			return await sessionAPI.create(tableNumber);
		}

		if (error) throw error;

		await supabase
			.from("table_sessions")
			.update({ last_activity: new Date().toISOString() })
			.eq("id", data.id);

		return { session: data, isNew: false };
	},

	create: async (tableNumber) => {
		const token = crypto.randomUUID();
		const expiresAt = new Date();
		expiresAt.setHours(22, 0, 0, 0);

		const { data, error } = await supabase
			.from("table_sessions")
			.insert({
				table_number: tableNumber,
				session_token: token,
				expires_at: expiresAt.toISOString(),
				status: "active",
			})
			.select()
			.single();

		if (error) throw error;
		return { session: data, isNew: true };
	},

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
