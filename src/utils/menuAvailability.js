/**
 * Time and tag-based menu item availability rules for Shal Phyoke
 *
 * Tags enum values (public.menu_tags):
 * - 'day': Available before 6:00 PM (18:00). Disabled after 6:00 PM.
 * - 'night': Available after 6:00 PM (18:00). Disabled before 6:00 PM.
 * - Both 'day' and 'night': Available throughout the day.
 * - Neither 'day' nor 'night': Available throughout the day.
 * - 'recommend' / 'best-seller': Used for hybrid Recommended category card.
 */

/**
 * Gets Bangkok current hour (0 - 23)
 */
export const getBangkokHour = (date = new Date()) => {
	try {
		const bangkokStr = date.toLocaleString("en-US", {
			timeZone: "Asia/Bangkok",
			hour12: false,
			hour: "numeric",
		});
		return parseInt(bangkokStr, 10);
	} catch {
		return date.getHours();
	}
};

/**
 * Checks if a menu item is currently available based on its tags and the 6:00 PM rule.
 *
 * @param {Object} item - Menu item with tags array
 * @param {Date} [currentTime] - Optional Date object (defaults to current time)
 * @returns {{
 *   isAvailable: boolean,
 *   reason: string | null,
 *   badgeText: string | null,
 *   tagType: 'day_only' | 'night_only' | 'all_day' | null
 * }}
 */
export const getItemTimeAvailability = (item, currentTime = new Date()) => {
	if (!item) {
		return {
			isAvailable: true,
			reason: null,
			badgeText: null,
			tagType: null,
		};
	}

	const tags = Array.isArray(item.tags) ? item.tags : [];
	const hasDay = tags.includes("day");
	const hasNight = tags.includes("night");

	// Items tagged with BOTH "day" and "night" are available throughout the day
	if (hasDay && hasNight) {
		return {
			isAvailable: true,
			reason: null,
			badgeText: "All Day",
			tagType: "all_day",
		};
	}

	const currentHour = getBangkokHour(currentTime);
	const isAfter6PM = currentHour >= 18;

	// Tagged with "day" only: disabled after 6 PM (18:00+)
	if (hasDay && !hasNight) {
		if (isAfter6PM) {
			return {
				isAvailable: false,
				reason: "Available before 6:00 PM only",
				badgeText: "Day Only (Before 6 PM)",
				tagType: "day_only",
			};
		}
		return {
			isAvailable: true,
			reason: null,
			badgeText: "Day Menu",
			tagType: "day_only",
		};
	}

	// Tagged with "night" only: disabled before 6 PM (< 18:00)
	if (hasNight && !hasDay) {
		if (!isAfter6PM) {
			return {
				isAvailable: false,
				reason: "Available after 6:00 PM only",
				badgeText: "Night Only (After 6 PM)",
				tagType: "night_only",
			};
		}
		return {
			isAvailable: true,
			reason: null,
			badgeText: "Night Menu",
			tagType: "night_only",
		};
	}

	// No day/night restrictions
	return {
		isAvailable: true,
		reason: null,
		badgeText: null,
		tagType: null,
	};
};
