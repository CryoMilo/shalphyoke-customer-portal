import { useState } from "react";
import { useCartStore } from "../../stores/useCartStore";
import MenuItemCard from "./MenuItemCard";
import CategoryFilter from "./CategoryFilter";

const MenuGrid = ({ items, categories }) => {
	const [activeCategory, setActiveCategory] = useState("All");
	const { addToCart } = useCartStore();

	if (!items || items.length === 0) {
		return (
			<div className="text-center py-12">
				<p className="text-base-content/50">No menu items available</p>
			</div>
		);
	}

	const filteredItems =
		activeCategory === "All"
			? items
			: items.filter((item) => item?.category === activeCategory);

	return (
		<div>
			<CategoryFilter
				categories={categories || ["All"]}
				activeCategory={activeCategory}
				onCategoryChange={setActiveCategory}
			/>

			{filteredItems.length === 0 ? (
				<div className="text-center py-8">
					<p className="text-base-content/50">No items in this category</p>
				</div>
			) : (
				<div className="grid grid-cols-2 gap-3">
					{filteredItems.map((item) => (
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
