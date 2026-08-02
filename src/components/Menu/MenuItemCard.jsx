import { Plus } from "lucide-react";

const MenuItemCard = ({ item, onAdd }) => {
	if (!item) return null;

	const isInactive = !item.is_active;
	const displayName = item.name_burmese || item.name_english || "Unknown";
	const displayPrice = item.price || 0;

	return (
		<div
			className={`card bg-base-100 shadow-sm hover:shadow-md transition-all ${
				isInactive ? "opacity-50" : ""
			}`}>
			<div className="card-body p-3">
				<h3 className="card-title text-sm font-bold line-clamp-2">
					{displayName}
				</h3>

				{item.name_english && item.name_english !== displayName && (
					<p className="text-xs text-base-content/60 truncate">
						{item.name_english}
					</p>
				)}

				<div className="flex items-center justify-between mt-2">
					<span className="font-mono font-bold text-primary">
						฿{displayPrice}
					</span>

					{!isInactive && (
						<button
							className="btn btn-primary btn-sm btn-circle"
							onClick={onAdd}>
							<Plus className="w-4 h-4" />
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default MenuItemCard;
