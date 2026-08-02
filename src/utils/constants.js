export const ORDER_STATUSES = {
	PENDING: "pending",
	PREPARING: "preparing",
	READY: "ready",
	COMPLETED: "completed",
	CANCELLED: "cancelled",
	REFUNDED: "refunded",
};

export const PAYMENT_STATUSES = {
	UNPAID: "unpaid",
	PAID: "paid",
	REFUNDED: "refunded",
};

export const ORDER_TYPES = {
	DINE_IN: "dine_in",
	TAKEAWAY: "takeaway",
	DELIVERY: "delivery",
};

export const SESSION_TIMEOUT = 3600; // 1 hour in seconds
export const MAX_ITEMS_PER_ORDER = 50;
