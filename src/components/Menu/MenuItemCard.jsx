import { Plus, ImageIcon, Moon, Sun } from "lucide-react";
import { useLanguageStore, getItemName } from "../../stores/useLanguageStore";
import { getItemTimeAvailability } from "../../utils/menuAvailability";

const MenuItemCard = ({ item, onAdd }) => {
	const { currentLang } = useLanguageStore();

	if (!item) return null;

	const isInactive = !item.is_active;
	const timeAvailability = getItemTimeAvailability(item);
	const isTimeDisabled = !timeAvailability.isAvailable;
	const isDisabled = isInactive || isTimeDisabled;

	const primaryName = getItemName(item, currentLang);
	// Secondary subtitle if available and different
	const secondaryName =
		currentLang === "en"
			? item.name_burmese || item.name_thai
			: item.name_english;
	const displayPrice = item.price || 0;

	return (
		<div
			className={`card bg-base-100 shadow-sm hover:shadow-md transition-all h-full border border-base-200/60 relative overflow-hidden ${
				isDisabled ? "opacity-65 bg-base-100/60" : ""
			}`}>
			{/* Time Tag Badges / Inactive Status Overlay */}
			{isInactive ? (
				<div className="absolute top-2 left-2 z-10">
					<span className="badge badge-sm bg-black/75 backdrop-blur-md text-white border-none font-extrabold text-[10px] shadow-sm">
						Out of stock
					</span>
				</div>
			) : isTimeDisabled ? (
				<div className="absolute top-2 left-2 z-10">
					<span className="badge badge-sm bg-black/80 backdrop-blur-md text-amber-300 border border-amber-500/30 font-extrabold text-[10px] shadow-sm flex items-center gap-1">
						{timeAvailability.tagType === "night_only" ? (
							<Moon className="w-3 h-3 text-amber-300" />
						) : (
							<Sun className="w-3 h-3 text-amber-300" />
						)}
						<span>{timeAvailability.badgeText}</span>
					</span>
				</div>
			) : timeAvailability.tagType && timeAvailability.tagType !== "all_day" ? (
				<div className="absolute top-2 left-2 z-10">
					<span className="badge badge-sm bg-black/60 backdrop-blur-md text-white border-none font-bold text-[10px] shadow-xs flex items-center gap-1">
						{timeAvailability.tagType === "night_only" ? (
							<Moon className="w-2.5 h-2.5 text-sky-300" />
						) : (
							<Sun className="w-2.5 h-2.5 text-amber-300" />
						)}
						<span>{timeAvailability.badgeText}</span>
					</span>
				</div>
			) : null}

			{item.image_url ? (
				<figure className="aspect-[4/3] w-full overflow-hidden bg-base-200/30 relative">
					<img
						src={item.image_url}
						alt={primaryName}
						className={`w-full h-full object-cover object-center transition-transform duration-300 ${
							isDisabled ? "grayscale-[25%]" : "hover:scale-105"
						}`}
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

					{isDisabled ? (
						<span
							className="text-[10px] font-extrabold text-base-content/50 bg-base-200 px-2.5 py-1 rounded-xl"
							title={isInactive ? "Out of stock" : timeAvailability.reason}>
							{isInactive
								? "Sold out"
								: timeAvailability.tagType === "night_only"
								? "After 6 PM"
								: "Before 6 PM"}
						</span>
					) : (
						<button
							className="btn btn-primary btn-sm btn-circle shrink-0 shadow-sm hover:scale-105 active:scale-95 transition-all"
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
