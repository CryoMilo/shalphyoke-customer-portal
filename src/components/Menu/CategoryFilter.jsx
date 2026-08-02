const CategoryFilter = ({ categories, activeCategory, onCategoryChange }) => {
	if (!categories || categories.length === 0) {
		return null;
	}

	return (
		<div className="flex flex-wrap gap-2 pb-4 mb-4 border-b border-base-200">
			{categories.map((category) => (
				<button
					key={category}
					className={`btn btn-sm rounded-full ${
						activeCategory === category ? "btn-primary" : "btn-ghost"
					}`}
					onClick={() => onCategoryChange(category)}>
					{category}
				</button>
			))}
		</div>
	);
};

export default CategoryFilter;
