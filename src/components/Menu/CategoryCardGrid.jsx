import { Sparkles, ArrowRight } from "lucide-react";
import { CATEGORY_DEFINITIONS } from "../../utils/categoryDefinitions";

const CategoryCardGrid = ({ items = [], specials = [], onSelectCategory }) => {
	// Filter out categories that have zero active items
	const visibleCategories = CATEGORY_DEFINITIONS.filter((cat) => {
		const count = items.filter((item) =>
			item.is_active !== false && cat.filter(item, items, specials)
		).length;
		return count > 0;
	});

	const heroCategory = visibleCategories.find((cat) => cat.isHero);
	const gridCategories = visibleCategories.filter((cat) => !cat.isHero);

	return (
		<div className="space-y-3.5 animate-fadeIn">
			{/* Top Hero Card: Recommended (Full Width) */}
			{heroCategory && (
				<button
					type="button"
					onClick={() => onSelectCategory(heroCategory.id)}
					className={`w-full text-left p-5 sm:p-6 rounded-3xl border-2 bg-gradient-to-r ${heroCategory.accentColor} ${heroCategory.borderColor} shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-[0.99] group relative overflow-hidden`}>
					<div className="flex items-center justify-between relative z-10">
						<div className="space-y-1.5 max-w-[80%]">
							<div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/15 text-primary text-[11px] font-extrabold">
								<Sparkles className="w-3.5 h-3.5" />
								<span>{heroCategory.badge}</span>
							</div>
							<h3 className="text-xl sm:text-2xl font-black text-base-content tracking-tight group-hover:text-primary transition-colors">
								{heroCategory.title}
							</h3>
							<p className="text-xs sm:text-sm text-base-content/70 font-medium">
								{heroCategory.subtitle}
							</p>
						</div>

						<div className="flex flex-col items-end gap-2 shrink-0">
							<div
								className={`w-12 h-12 rounded-2xl ${heroCategory.iconBg} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
								<heroCategory.icon className="w-6 h-6" />
							</div>
							<div className="flex items-center gap-1 text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform">
								<span>Browse</span>
								<ArrowRight className="w-3.5 h-3.5" />
							</div>
						</div>
					</div>
				</button>
			)}

			{/* 2-Column Categories Grid (Noodles, Comfort, Snacks, Drinks, etc.) */}
			<div className="grid grid-cols-2 gap-3 sm:gap-4">
				{gridCategories.map((cat) => {
					const count = items.filter((item) =>
						item.is_active !== false && cat.filter(item, items, specials)
					).length;
					const Icon = cat.icon;

					return (
						<button
							key={cat.id}
							type="button"
							onClick={() => onSelectCategory(cat.id)}
							className={`p-4 sm:p-5 rounded-3xl border-2 bg-gradient-to-br ${cat.accentColor} ${cat.borderColor} shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer text-left flex flex-col justify-between h-36 sm:h-40 group active:scale-[0.98]`}>
							<div className="flex items-start justify-between w-full">
								<div
									className={`w-10 h-10 rounded-2xl ${cat.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs`}>
									<Icon className="w-5 h-5" />
								</div>
								<span className="badge badge-sm bg-base-100/80 backdrop-blur-xs border border-base-300 text-base-content/70 font-bold text-[10px]">
									{count} items
								</span>
							</div>

							<div>
								<h4 className="text-base sm:text-lg font-black text-base-content tracking-tight group-hover:text-primary transition-colors leading-tight">
									{cat.title}
								</h4>
								<p className="text-[11px] text-base-content/60 truncate mt-0.5 font-medium">
									{cat.subtitle}
								</p>
							</div>
						</button>
					);
				})}
			</div>
		</div>
	);
};

export default CategoryCardGrid;
