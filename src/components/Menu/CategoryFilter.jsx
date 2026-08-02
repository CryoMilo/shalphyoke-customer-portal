import React from 'react';
const CategoryFilter = ({ categories, activeCategory, onCategoryChange }) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {categories.map((category) => (
        <button
          key={category}
          className={`btn btn-sm whitespace-nowrap ${
            activeCategory === category ? 'btn-primary' : 'btn-ghost'
          }`}
          onClick={() => onCategoryChange(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
};
export default CategoryFilter;
