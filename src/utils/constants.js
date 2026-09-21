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

export const PAYMENT_METHODS = {
	BANK_TRANSFER: "bank_transfer",
	TRUEMONEY: "truemoney",
	PROMPTPAY: "promptpay",
};

export const LANGUAGES = {
	EN: { code: "en", label: "English", flag: "🇬🇧" },
	MM: { code: "mm", label: "မြန်မာ", flag: "🇲🇲" },
	TH: { code: "th", label: "ไทย", flag: "🇹🇭" },
};

export const SESSION_TIMEOUT = 3600;
export const MAX_ITEMS_PER_ORDER = 50;

