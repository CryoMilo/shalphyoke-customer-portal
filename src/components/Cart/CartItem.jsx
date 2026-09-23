import { Minus, Plus, Trash2, ImageIcon, Edit3 } from "lucide-react";
import { useCartStore } from "../../stores/useCartStore";
import { useLanguageStore, getItemName } from "../../stores/useLanguageStore";

const CartItem = ({ item, onEditNote }) => {
	const { updateQuantity, removeFromCart, itemNotes, itemExtraPrices } = useCartStore();
	const { currentLang } = useLanguageStore();

	const primaryName = getItemName(item, currentLang);
	const secondaryName =
		currentLang === "en"
			? item.name_burmese || item.name_thai
			: item.name_english;

	const extraPrice = Number(
		item.extra_price !== undefined
			? item.extra_price
			: itemExtraPrices[item.cart_id] || 0
	);

	const unitPrice = (Number(item.price) || 0) + extraPrice;
	const noteText = (item.notes || itemNotes[item.cart_id] || "").trim();

	return (
		<div className="bg-base-100 rounded-2xl border border-base-200 p-3.5 transition-all hover:border-primary/20 shadow-xs">
			<div className="flex items-start gap-3">
				{item.image_url ? (
					<div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-base-200">
						<img
							src={item.image_url}
							alt={primaryName || "Item"}
							className="w-full h-full object-cover object-center"
						/>
					</div>
				) : (
					<div className="w-14 h-14 rounded-xl bg-base-200 flex items-center justify-center shrink-0">
						<ImageIcon className="w-6 h-6 text-base-content/20" />
					</div>
				)}

				<div className="flex-1 min-w-0">
					<div className="font-extrabold text-sm text-base-content leading-tight">
						{primaryName}
					</div>
					{secondaryName && secondaryName !== primaryName && (
						<div className="text-[11px] text-base-content/50 mt-0.5 truncate">
							{secondaryName}
						</div>
					)}

					<div className="text-xs font-mono font-bold text-primary mt-1">
						฿{unitPrice} × {item.quantity} = ฿{(unitPrice * item.quantity).toFixed(2)}
					</div>

					{/* Notes and Add-ons Tag */}
					{noteText && (
						<div className="mt-1.5 flex items-start gap-1 text-[11px] text-primary bg-primary/10 px-2 py-1 rounded-lg font-medium leading-tight">
							<span>📝</span>
							<span className="line-clamp-2">{noteText}</span>
						</div>
					)}

					{/* Edit Note Action */}
					{onEditNote && (
						<button
							type="button"
							onClick={() => onEditNote(item)}
							className="mt-1 inline-flex items-center gap-1 text-[10px] text-base-content/60 hover:text-primary font-bold transition-colors">
							<Edit3 className="w-3 h-3" />
							<span>Edit options</span>
						</button>
					)}
				</div>

				{/* Quantity & Delete Controls */}
				<div className="flex flex-col items-end justify-between h-full gap-2 shrink-0">
					<button
						type="button"
						className="btn btn-xs btn-ghost btn-circle text-error/60 hover:bg-error/10 hover:text-error"
						onClick={() => removeFromCart(item.cart_id)}
						title="Remove item">
						<Trash2 className="w-3.5 h-3.5" />
					</button>

					<div className="flex items-center gap-1 bg-base-200/80 rounded-xl p-0.5 border border-base-300">
						<button
							type="button"
							className="btn btn-xs btn-ghost btn-circle w-6 h-6 min-h-0 hover:bg-base-300"
							onClick={() => updateQuantity(item.cart_id, -1)}>
							<Minus className="w-3 h-3" />
						</button>
						<span className="font-mono text-xs font-black w-5 text-center">
							{item.quantity}
						</span>
						<button
							type="button"
							className="btn btn-xs btn-ghost btn-circle w-6 h-6 min-h-0 hover:bg-base-300"
							onClick={() => updateQuantity(item.cart_id, 1)}>
							<Plus className="w-3 h-3" />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default CartItem;
