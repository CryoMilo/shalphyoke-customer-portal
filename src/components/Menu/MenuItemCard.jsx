import { Plus, ImageIcon } from "lucide-react";

const MenuItemCard = ({ item, onAdd }) => {
	if (!item) return null;

	const isInactive = !item.is_active;
	const displayName = item.name_burmese || item.name_english || "Unknown";
	const displayPrice = item.price || 0;

	return (
		<div
			className={`card bg-base-100 shadow-sm hover:shadow-md transition-all h-full ${
				isInactive ? "opacity-50" : ""
			}`}>
			{item.image_url ? (
				<figure className="aspect-[4/3] w-full overflow-hidden">
					<img 
						src={item.image_url} 
						alt={displayName} 
						className="w-full h-full object-cover object-center"
					/>
				</figure>
			) : (
				<figure className="aspect-[4/3] w-full bg-base-200/50 flex items-center justify-center">
					<ImageIcon className="w-8 h-8 text-base-content/20" />
				</figure>
			)}
			<div className="card-body p-3 flex-grow justify-between">
				<div>
					<h3 className="card-title text-sm font-bold line-clamp-2 leading-tight">
						{displayName}
					</h3>
					{item.name_english && item.name_english !== displayName && (
						<p className="text-xs text-base-content/60 truncate mt-0.5">
							{item.name_english}
						</p>
					)}
				</div>

				<div className="flex items-center justify-between mt-2 pt-2 border-t border-base-200">
					<span className="font-mono font-bold text-primary">
						฿{displayPrice}
					</span>

					{!isInactive && (
						<button
							className="btn btn-primary btn-sm btn-circle shrink-0"
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
