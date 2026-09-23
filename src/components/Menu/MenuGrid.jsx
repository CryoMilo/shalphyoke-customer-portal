import { useState } from "react";
import { useCartStore } from "../../stores/useCartStore";
import MenuItemCard from "./MenuItemCard";
import CategoryCardGrid from "./CategoryCardGrid";
import { CATEGORY_DEFINITIONS } from "../../utils/categoryDefinitions";
import { ArrowLeft } from "lucide-react";

const MenuGrid = ({ items = [], specials = [] }) => {
	// null means viewing the Category Grid overview (kiosk-style)
	const [selectedCategoryId, setSelectedCategoryId] = useState(null);
	const { addToCart } = useCartStore();

	if (!items || items.length === 0) {
		return (
			<div className="text-center py-12 space-y-2">
				<p className="text-base-content/50 font-medium">No menu items available at the moment</p>
			</div>
		);
	}

	// 1. If no category is selected, show the Category Grid overview
	if (!selectedCategoryId) {
		return (
			<CategoryCardGrid
				items={items}
				specials={specials}
				onSelectCategory={setSelectedCategoryId}
			/>
		);
	}

	// 2. Category Items View (drill-down)
	const activeCat =
		CATEGORY_DEFINITIONS.find((c) => c.id === selectedCategoryId) ||
		CATEGORY_DEFINITIONS[0];

	const categoryItems = items.filter(
		(item) => item.is_active !== false && activeCat.filter(item, items, specials)
	);

	// Visible categories for quick pill switching
	const visibleCategories = CATEGORY_DEFINITIONS.filter((cat) => {
		const count = items.filter(
			(item) => item.is_active !== false && cat.filter(item, items, specials)
		).length;
		return count > 0;
	});

	const Icon = activeCat.icon;

	return (
		<div className="space-y-4 animate-fadeIn pb-12">
			{/* Top Bar: Back to Categories & Title */}
			<div>
				<button
					type="button"
					onClick={() => setSelectedCategoryId(null)}
					className="btn btn-sm btn-ghost gap-1.5 font-extrabold -ml-2 text-base-content/80 hover:text-primary mb-1">
					<ArrowLeft className="w-4 h-4" />
					<span>All Categories</span>
				</button>

				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2.5">
						<div
							className={`w-9 h-9 rounded-2xl ${activeCat.iconBg} flex items-center justify-center shadow-xs shrink-0`}>
							<Icon className="w-5 h-5" />
						</div>
						<div>
							<h2 className="text-lg font-black text-base-content tracking-tight leading-tight">
								{activeCat.title}
							</h2>
							<p className="text-[11px] text-base-content/60 font-medium">
								{activeCat.subtitle}
							</p>
						</div>
					</div>

					<span className="badge badge-sm bg-base-200 border border-base-300 font-extrabold text-[11px] px-2.5 py-2">
						{categoryItems.length} items
					</span>
				</div>
			</div>

			{/* Quick Horizontal Category Switcher */}
			<div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 border-b border-base-200">
				{visibleCategories.map((c) => {
					const isCurrent = c.id === selectedCategoryId;
					return (
						<button
							key={c.id}
							type="button"
							onClick={() => setSelectedCategoryId(c.id)}
							className={`btn btn-xs rounded-full shrink-0 font-extrabold transition-all ${
								isCurrent
									? "btn-primary shadow-xs scale-105"
									: "btn-ghost bg-base-100 border border-base-300/80 text-base-content/70 hover:border-primary/50"
							}`}>
							<span>{c.title}</span>
						</button>
					);
				})}
			</div>

			{/* Category Items 2-Column Grid */}
			{categoryItems.length === 0 ? (
				<div className="text-center py-12 space-y-3 bg-base-100 rounded-3xl border border-base-200 p-6">
					<p className="text-sm font-semibold text-base-content/60">
						No items currently available in {activeCat.title}
					</p>
					<button
						type="button"
						className="btn btn-sm btn-primary rounded-xl font-bold"
						onClick={() => setSelectedCategoryId(null)}>
						Back to Categories
					</button>
				</div>
			) : (
				<div className="grid grid-cols-2 gap-3 sm:gap-4">
					{categoryItems.map((item) => (
						<MenuItemCard
							key={item.id}
							item={item}
							onAdd={() => addToCart(item)}
						/>
					))}
				</div>
			)}
		</div>
	);
};

export default MenuGrid;
