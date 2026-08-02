import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCartStore } from '../../stores/useCartStore';
const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCartStore();
  return (
    <div className="flex justify-between items-start bg-base-200 rounded-lg p-3">
      <div className="flex-1">
        <h4 className="font-medium text-sm">{item.name_burmese}</h4>
        <p className="text-xs opacity-60">฿{item.price} × {item.quantity}</p>
      </div>
      <div className="flex items-center gap-1">
        <button className="btn btn-xs btn-ghost btn-circle" onClick={() => updateQuantity(item.cart_id, -1)}><Minus className="w-3 h-3" /></button>
        <span className="font-mono text-sm w-6 text-center">{item.quantity}</span>
        <button className="btn btn-xs btn-ghost btn-circle" onClick={() => updateQuantity(item.cart_id, 1)}><Plus className="w-3 h-3" /></button>
        <button className="btn btn-xs btn-ghost btn-circle text-error" onClick={() => removeFromCart(item.cart_id)}><Trash2 className="w-3 h-3" /></button>
      </div>
    </div>
  );
};
export default CartItem;
