/**
 * Payment details for Bank Transfer and TrueMoney Wallet
 * Can be overridden via environment variables or Supabase app_settings.
 */
export const PAYMENT_CONFIG = {
	bank: {
		name: import.meta.env.VITE_BANK_NAME || "Kasikorn Bank (KBank)",
		accountName: import.meta.env.VITE_BANK_ACCOUNT_NAME || "Shalphyoke",
		accountNumber: import.meta.env.VITE_BANK_ACCOUNT_NO || "123-4-56789-0",
		qrImage: import.meta.env.VITE_BANK_QR_IMAGE || "/bank-qr.png",
	},
	trueMoney: {
		name: "TrueMoney Wallet",
		accountName: import.meta.env.VITE_TRUEMONEY_NAME || "Shalphyoke",
		phoneNumber: import.meta.env.VITE_TRUEMONEY_NO || "081-234-5678",
		qrImage: import.meta.env.VITE_TRUEMONEY_QR_IMAGE || "/truemoney-qr.png",
	},
};
