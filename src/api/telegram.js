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
 * GenZ Chill Young Guy Persona in Burmese prioritizing items to check first
 */
export const notifyStockCheckRequired = async (orderRequest) => {
	const uncertainItems = (orderRequest.items || []).filter(
		(item) => item.requires_stock_check === true
	);

	// Top priority: Items to verify first
	const itemsToCheckList = (uncertainItems.length > 0 ? uncertainItems : orderRequest.items || [])
		.map(
			(i) =>
				`👉 <b>${i.quantity || 1}x ${i.name_english || i.name_burmese}</b>${
					i.notes ? ` <i>(${i.notes})</i>` : ""
				}`
		)
		.join("\n");

	// All items for context
	const allItemsSummary = (orderRequest.items || [])
		.map(
			(i) =>
				`• ${i.quantity || 1}x ${i.name_english || i.name_burmese}${
					i.notes ? ` <i>(${i.notes})</i>` : ""
				}`
		)
		.join("\n");

	const message = `
🚨 <b>BRO တို့ရေ... မီးဖိုချောင် အမြန် CHECK ပေးပါဦး!</b> ⚡

🔍 <b>ဒီပစ္စည်းတွေ အရင်စစ်ပေးနော် (Check First!):</b>
${itemsToCheckList}

━━━━━━━━━━━━━━━━━━━
📋 <b>အော်ဒါ အသေးစိတ် (Order Details):</b>
• <b>Request #:</b> <code>${orderRequest.request_number}</code>
• <b>Customer:</b> ${orderRequest.customer_name}
• <b>Phone:</b> <a href="tel:${orderRequest.customer_phone}">${orderRequest.customer_phone}</a>
• <b>ပို့ရမယ့်နေရာ:</b> ${orderRequest.delivery_address || "Delivery"}
• <b>စုစုပေါင်း:</b> ฿${Number(orderRequest.total_amount || 0).toFixed(2)}

📦 <b>မှာထားသမျှ အကုန် (All Items):</b>
${allItemsSummary}
━━━━━━━━━━━━━━━━━━━

⏳ <i>Customer က 2 မိနစ် screen မှာ စောင့်နေတာမို့ POS ကနေ အမြန်စစ်ပြီး Confirm/Change လုပ်ပေးလိုက်ပါဦး bro!</i>
`.trim();

	return sendTelegramMessage(message);
};

/**
 * Event 2: Notify Staff when customer cancels while waiting for stock check
 */
export const notifyStockCheckCancelled = async (orderRequest, reason) => {
	const message = `
🙅‍♂️ <b>ORDER CANCEL သွားပြီ BRO တို့ရေ!</b>

Customer က stock စစ်တာစောင့်ရင်း cancel လုပ်လိုက်လို့ <code>#${orderRequest.request_number}</code> အတွက် ပစ္စည်းမစစ်တော့လဲ ရပါပြီနော်!

• <b>Customer:</b> ${orderRequest.customer_name} (<a href="tel:${orderRequest.customer_phone}">${orderRequest.customer_phone}</a>)
• <b>အကြောင်းပြချက်:</b> <i>${reason || "Customer cancelled while waiting"}</i>

👌 <i>မီးဖိုချောင်မှာ ဆက်စစ်စရာ မလိုတော့ပါဘူး bro!</i>
`.trim();

	return sendTelegramMessage(message);
};

/**
 * Event 3: Notify Staff that payment has been submitted (Phase 2)
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
🎉 <b>ငွေရှင်းပြီး အော်ဒါအသစ် ရောက်လာပြီ BRO တို့ရေ!</b> 💸

• <b>Request #:</b> <code>${orderRequest.request_number}</code>
• <b>Customer:</b> ${orderRequest.customer_name}
• <b>Phone:</b> <a href="tel:${orderRequest.customer_phone}">${orderRequest.customer_phone}</a>
• <b>ပို့ရမယ့်နေရာ:</b> ${orderRequest.delivery_address || "Delivery"}
• <b>Payment:</b> ${paymentLabel}

🍱 <b>မှာယူထားသော ဟင်းများ:</b>
${itemsList}

💰 <b>အစားအသောက်:</b> ฿${Number(orderRequest.subtotal || 0).toFixed(2)}
🛵 <b>ပို့ဆောင်ခ:</b> ฿${Number(orderRequest.delivery_fee || 0).toFixed(2)}
💵 <b>ကျသင့်ငွေ စုစုပေါင်း:</b> <b>฿${Number(orderRequest.total_amount || 0).toFixed(2)}</b>
${orderRequest.notes ? `\n📝 <b>Customer Note:</b> <i>${orderRequest.notes}</i>` : ""}

⚡ <i>POS မှာ စလစ်စစ်ပြီး Approve လုပ်ကာ Kitchen Printer ထုတ်ပေးလိုက်တော့နော် bro!</i>
`.trim();

	if (orderRequest.payment_slip_url) {
		return sendTelegramPhoto(orderRequest.payment_slip_url, caption);
	}

	return sendTelegramMessage(caption);
};
