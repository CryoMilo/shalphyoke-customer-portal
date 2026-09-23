import {
	Sparkles,
	UtensilsCrossed,
	Soup,
	Cookie,
	Coffee,
	Salad,
	PackageCheck,
	PlusCircle,
} from "lucide-react";

export const CATEGORY_DEFINITIONS = [
	{
		id: "recommended",
		title: "Recommended",
		subtitle: "Chef's Specials & Must-Try Dishes",
		icon: Sparkles,
		isHero: true,
		badge: "🔥 Best Sellers",
		accentColor: "from-amber-500/15 via-primary/10 to-base-100",
		borderColor: "border-primary/40 hover:border-primary",
		iconBg: "bg-primary text-primary-content",
		// Hybrid approach: items tagged with "recommend" or "best-seller" take priority
		filter: (item, allItems = [], specials = []) => {
			const tags = Array.isArray(item?.tags) ? item.tags : [];
			const isTaggedRecommend =
				tags.includes("recommend") || tags.includes("best-seller");

			const hasExplicitlyTagged = allItems.some((i) => {
				const t = Array.isArray(i?.tags) ? i.tags : [];
				return t.includes("recommend") || t.includes("best-seller");
			});

			if (hasExplicitlyTagged) {
				return isTaggedRecommend;
			}

			// Fallback when admin hasn't tagged any items yet
			return (
				specials.some((s) => s.id === item.id) ||
				item.is_combo ||
				item.name_english?.toLowerCase().includes("shan") ||
				item.name_english?.toLowerCase().includes("garlic") ||
				item.name_english?.toLowerCase().includes("fatty")
			);
		},
	},
	{
		id: "noodles",
		title: "Noodles",
		subtitle: "Shan & Garlic Noodles",
		icon: UtensilsCrossed,
		isHero: false,
		accentColor: "from-orange-500/10 to-base-100",
		borderColor: "border-base-300 hover:border-primary/60",
		iconBg: "bg-orange-500/10 text-orange-600",
		filter: (item) => item.category === "Noodles",
	},
	{
		id: "comfort",
		title: "Comfort",
		subtitle: "Rice & Curry Bowls",
		icon: Soup,
		isHero: false,
		accentColor: "from-emerald-500/10 to-base-100",
		borderColor: "border-base-300 hover:border-primary/60",
		iconBg: "bg-emerald-500/10 text-emerald-600",
		filter: (item) => item.category === "Rice" || item.category === "Comfort",
	},
	{
		id: "snacks",
		title: "Snacks",
		subtitle: "Crispy Fritters & Sides",
		icon: Cookie,
		isHero: false,
		accentColor: "from-yellow-500/10 to-base-100",
		borderColor: "border-base-300 hover:border-primary/60",
		iconBg: "bg-yellow-500/10 text-yellow-600",
		filter: (item) => item.category === "Snack",
	},
	{
		id: "drinks",
		title: "Drinks",
		subtitle: "Burmese Tea & Cold Drinks",
		icon: Coffee,
		isHero: false,
		accentColor: "from-sky-500/10 to-base-100",
		borderColor: "border-base-300 hover:border-primary/60",
		iconBg: "bg-sky-500/10 text-sky-600",
		filter: (item) => item.category === "Drink",
	},
	{
		id: "salads",
		title: "Salads",
		subtitle: "Burmese Style Thoke",
		icon: Salad,
		isHero: false,
		accentColor: "from-lime-500/10 to-base-100",
		borderColor: "border-base-300 hover:border-primary/60",
		iconBg: "bg-lime-500/10 text-lime-600",
		filter: (item) => item.category === "Salad",
	},
	{
		id: "combos",
		title: "Combos",
		subtitle: "Value Meal Sets",
		icon: PackageCheck,
		isHero: false,
		accentColor: "from-indigo-500/10 to-base-100",
		borderColor: "border-base-300 hover:border-primary/60",
		iconBg: "bg-indigo-500/10 text-indigo-600",
		filter: (item) => item.category === "Combo" || item.is_combo,
	},
	{
		id: "extras",
		title: "Extras",
		subtitle: "Add-ons & Soups",
		icon: PlusCircle,
		isHero: false,
		accentColor: "from-purple-500/10 to-base-100",
		borderColor: "border-base-300 hover:border-primary/60",
		iconBg: "bg-purple-500/10 text-purple-600",
		filter: (item) => item.category === "Extra",
	},
];
