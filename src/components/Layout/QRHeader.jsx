import { useCartStore } from "../../stores/useCartStore";
import { useLanguageStore } from "../../stores/useLanguageStore";
import { useOrderFlowStore } from "../../stores/useOrderFlowStore";
import { getCartItemCount } from "../../utils/cartUtils";
import { ShoppingBag, MapPin, Globe } from "lucide-react";
import logo from "../../../src/assets/logo.png";
import { LANGUAGES } from "../../utils/constants";

const QRHeader = ({ onCartClick, onLocationClick }) => {
	const { cart } = useCartStore();
	const { currentLang, setLanguage } = useLanguageStore();
	const { selectedLocation } = useOrderFlowStore();

	const cartCount = getCartItemCount(cart);

	const locationLabel = selectedLocation?.apartmentName
		? `${selectedLocation.apartmentName}${
				selectedLocation.building ? ` (${selectedLocation.building})` : ""
		  } • ฿${selectedLocation.fee}`
		: "Select Location";

	return (
		<header className="sticky top-0 z-40 bg-base-100/90 backdrop-blur-lg border-b border-base-300 shadow-sm">
			<div className="navbar max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
				{/* Brand - Left */}
				<div className="flex items-center gap-2">
					<div className="avatar">
						<div className="w-10 h-10 rounded-full border border-primary/20 p-0.5 bg-base-100 shadow-sm">
							<img src={logo} alt="Shal Phyoke Logo" className="rounded-full object-cover" />
						</div>
					</div>
					<div>
						<div className="text-sm font-extrabold text-secondary tracking-tight leading-none">
							Shal Phyoke
						</div>
						{/* Location Clickable Pill */}
						<button
							type="button"
							onClick={onLocationClick}
							className="mt-1 flex items-center gap-1 text-[11px] font-bold text-primary hover:underline transition-all">
							<MapPin className="w-3 h-3 shrink-0" />
							<span className="truncate max-w-[130px] sm:max-w-[200px]">
								{locationLabel}
							</span>
						</button>
					</div>
				</div>

				{/* Right side: Language switcher + Cart */}
				<div className="flex items-center gap-2">
					{/* Language Switcher Dropdown */}
					<div className="dropdown dropdown-end">
						<label
							tabIndex={0}
							className="btn btn-sm btn-ghost btn-circle gap-1 text-xs border border-base-300">
							<Globe className="w-4 h-4 text-base-content/70" />
						</label>
						<ul
							tabIndex={0}
							className="dropdown-content z-[50] menu p-2 shadow-xl bg-base-100 rounded-box w-36 border border-base-200 mt-2">
							{Object.values(LANGUAGES).map((lang) => (
								<li key={lang.code}>
									<button
										className={`text-xs flex items-center justify-between ${
											currentLang === lang.code ? "active font-bold" : ""
										}`}
										onClick={() => setLanguage(lang.code)}>
										<span>{lang.flag} {lang.label}</span>
									</button>
								</li>
							))}
						</ul>
					</div>

					{/* Cart Button */}
					<button
						className="btn btn-sm btn-primary btn-circle relative shadow-md"
						onClick={onCartClick}
						aria-label="Open cart">
						<ShoppingBag className="w-4 h-4 text-primary-content" />
						{cartCount > 0 && (
							<span className="badge badge-accent badge-xs absolute -top-1.5 -right-1.5 text-[10px] font-bold px-1.5 py-2">
								{cartCount}
							</span>
						)}
					</button>
				</div>
			</div>
		</header>
	);
};

export default QRHeader;
