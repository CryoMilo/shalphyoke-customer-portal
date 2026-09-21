import { Plus, ImageIcon } from "lucide-react";
import { useLanguageStore, getItemName } from "../../stores/useLanguageStore";

const MenuItemCard = ({ item, onAdd }) => {
	const { currentLang } = useLanguageStore();

	if (!item) return null;

	const isInactive = !item.is_active;
	const primaryName = getItemName(item, currentLang);
	// Secondary subtitle if available and different
	const secondaryName =
		currentLang === "en"
			? item.name_burmese || item.name_thai
			: item.name_english;
	const displayPrice = item.price || 0;

	return (
		<div
			className={`card bg-base-100 shadow-sm hover:shadow-md transition-all h-full border border-base-200/60 ${
				isInactive ? "opacity-50" : ""
			}`}>
			{item.image_url ? (
				<figure className="aspect-[4/3] w-full overflow-hidden bg-base-200/30">
					<img
						src={item.image_url}
						alt={primaryName}
						className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-300"
						loading="lazy"
					/>
				</figure>
			) : (
				<figure className="aspect-[4/3] w-full bg-base-200/50 flex items-center justify-center">
					<ImageIcon className="w-8 h-8 text-base-content/20" />
				</figure>
			)}
			<div className="card-body p-3.5 flex-grow justify-between">
				<div>
					<h3 className="card-title text-sm font-bold line-clamp-2 leading-tight">
						{primaryName}
					</h3>
					{secondaryName && secondaryName !== primaryName && (
						<p className="text-xs text-base-content/60 truncate mt-0.5">
							{secondaryName}
						</p>
					)}
					{item.description && (
						<p className="text-[11px] text-base-content/50 line-clamp-2 mt-1">
							{item.description}
						</p>
					)}
				</div>

				<div className="flex items-center justify-between mt-2 pt-2 border-t border-base-200">
					<span className="font-mono font-bold text-primary text-base">
						฿{displayPrice}
					</span>

					{!isInactive && (
						<button
							className="btn btn-primary btn-sm btn-circle shrink-0 shadow-sm hover:scale-105"
							onClick={onAdd}
							title="Add to Cart">
							<Plus className="w-4 h-4 text-primary-content" />
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default MenuItemCard;
