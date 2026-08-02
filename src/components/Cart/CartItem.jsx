import { Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore } from "../../stores/useCartStore";

const CartItem = ({ item }) => {
	const { updateQuantity, removeFromCart } = useCartStore();

	return (
		<div className="bg-base-100 rounded-xl border border-base-200 p-3 transition-all hover:border-primary/20">
			<div className="flex items-start gap-3">
				<div className="flex-1 min-w-0">
					<div className="font-medium text-sm text-secondary">
						{item.name_burmese}
					</div>
					<div className="text-xs font-mono text-primary/80">
						฿{item.price} × {item.quantity}
					</div>
					{item.notes && (
						<div className="text-[10px] text-base-content/50 italic mt-0.5 line-clamp-1">
							"{item.notes}"
						</div>
					)}
				</div>

				<div className="flex items-center gap-1">
					<button
						className="btn btn-xs btn-ghost btn-circle hover:bg-base-300/60"
						onClick={() => updateQuantity(item.cart_id, -1)}>
						<Minus className="w-3.5 h-3.5" />
					</button>
					<span className="font-mono text-sm font-medium w-6 text-center">
						{item.quantity}
					</span>
					<button
						className="btn btn-xs btn-ghost btn-circle hover:bg-base-300/60"
						onClick={() => updateQuantity(item.cart_id, 1)}>
						<Plus className="w-3.5 h-3.5" />
					</button>
					<button
						className="btn btn-xs btn-ghost btn-circle text-error/60 hover:bg-error/10 hover:text-error"
						onClick={() => removeFromCart(item.cart_id)}>
						<Trash2 className="w-3.5 h-3.5" />
					</button>
				</div>
			</div>
		</div>
	);
};

export default CartItem;
