/**
 * Telegram Bot Notification Service
 * Sends instant alerts to the restaurant staff Telegram group.
 * Free, fast, reliable, zero maintenance.
 */

const getTelegramConfig = () => {
	const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
	const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;
	return { botToken, chatId };
};

/**
 * Send a message via Telegram Bot API
 */
export const sendTelegramMessage = async (htmlText, extraParams = {}) => {
	const { botToken, chatId } = getTelegramConfig();

	if (!botToken || !chatId) {
		console.warn(
			"[Telegram Service] VITE_TELEGRAM_BOT_TOKEN or VITE_TELEGRAM_CHAT_ID not configured in .env. Skipping notification."
		);
		return null;
	}

	try {
		const response = await fetch(
			`https://api.telegram.org/bot${botToken}/sendMessage`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					chat_id: chatId,
					text: htmlText,
					parse_mode: "HTML",
					disable_web_page_preview: false,
					...extraParams,
				}),
			}
		);

		const result = await response.json();
		if (!result.ok) {
			console.error("[Telegram Service] API error:", result.description);
		}
		return result;
	} catch (error) {
		console.error("[Telegram Service] Network error sending notification:", error);
		return null;
	}
};

/**
 * Send a photo with caption via Telegram Bot API
 */
export const sendTelegramPhoto = async (photoUrl, captionHtml) => {
	const { botToken, chatId } = getTelegramConfig();

	if (!botToken || !chatId) {
		console.warn("[Telegram Service] Telegram credentials not configured.");
		return null;
	}

	try {
		const response = await fetch(
			`https://api.telegram.org/bot${botToken}/sendPhoto`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					chat_id: chatId,
					photo: photoUrl,
					caption: captionHtml,
					parse_mode: "HTML",
				}),
			}
		);

		const result = await response.json();
		if (!result.ok) {
			console.error("[Telegram Service] Photo error:", result.description);
			// Fallback to text message with URL
			return sendTelegramMessage(`${captionHtml}\n\n<a href="${photoUrl}">View Slip Image</a>`);
		}
		return result;
	} catch (error) {
		console.error("[Telegram Service] Error sending photo:", error);
		return sendTelegramMessage(`${captionHtml}\n\n<a href="${photoUrl}">View Slip Image</a>`);
	}
};

/**
 * Event 1: Notify Staff that kitchen stock check is urgently needed (Phase 1)
 */
export const notifyStockCheckRequired = async (orderRequest) => {
	const uncertainItems = (orderRequest.items || []).filter(
		(item) => item.requires_stock_check === true
	);

	const itemsList = uncertainItems
		.map(
			(i) =>
				`• <b>${i.quantity || 1}x ${i.name_english || i.name_burmese}</b>${
					i.notes ? ` <i>(${i.notes})</i>` : ""
				}`
		)
		.join("\n");

	const allItemsSummary = (orderRequest.items || [])
		.map(
			(i) =>
				`• ${i.quantity || 1}x ${i.name_english || i.name_burmese}${
					i.notes ? ` (${i.notes})` : ""
				}`
		)
		.join("\n");

	const message = `
⚠️ <b>URGENT: KITCHEN STOCK CHECK REQUIRED</b> ⚠️
<b>Request #:</b> <code>${orderRequest.request_number}</code>
<b>Customer:</b> ${orderRequest.customer_name}
<b>Phone:</b> <a href="tel:${orderRequest.customer_phone}">${orderRequest.customer_phone}</a>
<b>Destination:</b> ${orderRequest.delivery_address}

<b>🚨 Items needing verification:</b>
${itemsList || "• Daily limited dishes"}

<b>All Request Items:</b>
${allItemsSummary}

<b>Subtotal:</b> ฿${Number(orderRequest.subtotal || 0).toFixed(2)}
<b>Total:</b> ฿${Number(orderRequest.total_amount || 0).toFixed(2)}

⏳ <i>Customer is waiting on the 2-minute availability screen. Please check kitchen stock in POS!</i>
`.trim();

	return sendTelegramMessage(message);
};

/**
 * Event 2: Notify Staff that payment has been submitted (Phase 2)
 */
export const notifyPaymentSubmitted = async (orderRequest) => {
	const paymentLabel =
		orderRequest.payment_type === "cod"
			? "💵 Cash on Delivery (COD)"
			: orderRequest.payment_type === "truemoney"
			? "📱 TrueMoney Wallet"
			: "🏦 PromptPay / Bank QR";

	const itemsList = (orderRequest.items || [])
		.map((i) => {
			const extra = Number(i.extra_price || 0);
			const unit = (Number(i.price || 0) + extra) * (i.quantity || 1);
			return `• <b>${i.quantity || 1}x ${i.name_english || i.name_burmese}</b> - ฿${unit.toFixed(2)}${
				i.notes ? `\n  ↳ <i>${i.notes}</i>` : ""
			}`;
		})
		.join("\n");

	const caption = `
🎉 <b>NEW ORDER READY FOR APPROVAL!</b> 🎉
<b>Request #:</b> <code>${orderRequest.request_number}</code>
<b>Customer:</b> ${orderRequest.customer_name}
<b>Phone:</b> <a href="tel:${orderRequest.customer_phone}">${orderRequest.customer_phone}</a>
<b>Destination:</b> ${orderRequest.delivery_address}
<b>Payment Method:</b> ${paymentLabel}

<b>Order Items:</b>
${itemsList}

<b>Food Subtotal:</b> ฿${Number(orderRequest.subtotal || 0).toFixed(2)}
<b>Delivery Fee:</b> ฿${Number(orderRequest.delivery_fee || 0).toFixed(2)}
<b>Grand Total:</b> <b>฿${Number(orderRequest.total_amount || 0).toFixed(2)}</b>
${orderRequest.notes ? `\n<b>Customer Note:</b> <i>${orderRequest.notes}</i>` : ""}

✅ <i>Please check POS to Approve and print to Kitchen Printer!</i>
`.trim();

	if (orderRequest.payment_slip_url) {
		return sendTelegramPhoto(orderRequest.payment_slip_url, caption);
	}

	return sendTelegramMessage(caption);
};
