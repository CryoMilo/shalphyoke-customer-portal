import { useState } from "react";
import MenuItemCard from "./MenuItemCard";
import CategoryFilter from "./CategoryFilter";
const MenuGrid = ({ items, onAddItem, categories }) => {
	const [activeCategory, setActiveCategory] = useState(
		categories?.[0] || "All"
	);
	const filteredItems =
		activeCategory === "All"
			? items
			: items.filter((item) => item.category === activeCategory);
	return (
		<div>
			{categories && categories.length > 0 && (
				<CategoryFilter
					categories={categories}
					activeCategory={activeCategory}
					onCategoryChange={setActiveCategory}
				/>
			)}
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
				{filteredItems.map((item) => (
					<MenuItemCard
						key={item.id}
						item={item}
						onAdd={() => onAddItem(item)}
					/>
				))}
			</div>
		</div>
	);
};
export default MenuGrid;
