import React from 'react';
import { Plus } from 'lucide-react';
const MenuItemCard = ({ item, onAdd }) => {
  return (
    <div className="bg-base-100 border border-base-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {item.image_url && (
        <img src={item.image_url} alt={item.name_english} className="w-full h-24 object-cover rounded-lg mb-3" />
      )}
      <h3 className="font-semibold text-sm line-clamp-2">{item.name_burmese}</h3>
      {item.name_english && <p className="text-xs text-base-content/70 truncate">{item.name_english}</p>}
      <div className="flex justify-between items-center mt-3">
        <span className="font-bold text-primary">฿{item.price}</span>
        <button className="btn btn-primary btn-sm btn-circle" onClick={onAdd}>
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
export default MenuItemCard;
