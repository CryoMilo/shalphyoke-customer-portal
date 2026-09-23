import { useState, useEffect } from "react";
import { useMenuStore } from "../stores/useMenuStore";
import { useCartStore } from "../stores/useCartStore";
import { useOrderFlowStore } from "../stores/useOrderFlowStore";
import { useCart } from "../context/CartContext";
import MenuGrid from "../components/Menu/MenuGrid";
import CartDrawer from "../components/Cart/CartDrawer";
import LocationPromptPage from "../components/Location/LocationPromptPage";
import DetailInfoSection from "../components/Checkout/DetailInfoSection";
import WaitingForApproval from "../components/Checkout/WaitingForApproval";
import { ShoppingBag, MapPin, Sparkles, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { getCartTotal, getCartItemCount } from "../utils/cartUtils";

const QROrder = () => {
	const { isCartOpen, closeCart } = useCart();
	const { step, setStep, selectedLocation } = useOrderFlowStore();

	const { menuItems, fetchMenu, isLoading: menuLoading } = useMenuStore();
	const { cart } = useCartStore();

	const total = getCartTotal(cart);
	const cartCount = getCartItemCount(cart);

	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const init = async () => {
			try {
				setIsLoading(true);
				await fetchMenu();
			} catch (error) {
				console.error("Init error:", error);
				toast.error("Failed to load menu. Please refresh.");
			} finally {
				setIsLoading(false);
			}
		};

		init();
	}, [fetchMenu]);

	if (isLoading || menuLoading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="text-center">
					<span className="loading loading-spinner loading-lg text-primary"></span>
					<p className="mt-4 text-sm font-medium text-base-content/60">
						Loading appetizing menu...
					</p>
				</div>
			</div>
		);
	}

	// Step 1: Location Choice Page (if location not confirmed or user navigating to location)
	if (step === "location" || !selectedLocation.isConfirmed) {
		return <LocationPromptPage />;
	}

	// Step 3: Detail Info & Payment Section
	if (step === "checkout") {
		return <DetailInfoSection />;
	}

	// Step 4: Waiting for Admin Order Approval UI
	if (step === "waiting") {
		return <WaitingForApproval />;
	}

	// Step 2: Menu Browsing
	const categories = [
		"All",
		...new Set(menuItems.map((item) => item?.category).filter(Boolean)),
	];

	return (
		<>
			{/* Welcome Delivery Hero Banner with Clickable Location */}
			<div className="bg-gradient-to-r from-primary/10 via-primary/5 to-base-100 border border-primary/20 rounded-2xl p-4 sm:p-5 mb-5 shadow-sm">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div>
						<div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2">
							<Sparkles className="w-3.5 h-3.5" />
							<span>Apartment Delivery Portal</span>
						</div>
						<h1 className="text-lg sm:text-xl font-extrabold text-base-content tracking-tight">
							Authentic Burmese Flavors Delivered Fresh
						</h1>
						<p className="text-xs text-base-content/70 mt-1">
							Fixed-rate delivery to Rye (฿10), Richpark, Lumpini, Blitz, The Rich, P Park, Zayn Hotel (฿20).
						</p>
					</div>

					{/* Active Location Card - Tap to open Location Page */}
					<button
						type="button"
						onClick={() => setStep("location")}
						className="flex items-center gap-2.5 p-3 rounded-xl bg-base-100 border border-base-200 hover:border-primary text-left transition-all shrink-0 shadow-sm group">
						<div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
							<MapPin className="w-4 h-4" />
						</div>
						<div>
							<div className="text-[10px] font-bold uppercase tracking-wider text-base-content/50">
								Delivering To:
							</div>
							<div className="text-xs font-extrabold text-base-content">
								{selectedLocation.apartmentName}
								{selectedLocation.building ? ` (${selectedLocation.building})` : ""}
							</div>
							<div className="text-[10px] text-primary font-bold">
								Delivery: ฿{selectedLocation.fee} &bull; Tap to change
							</div>
						</div>
					</button>
				</div>
			</div>

			{/* Menu Categories & Items Grid */}
			<MenuGrid items={menuItems} categories={categories} />

			{/* Floating Bottom Cart Bar */}
			{cart.length > 0 && (
				<div className="fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto animate-slideUp">
					<button
						className="btn btn-primary w-full shadow-2xl hover:shadow-primary/30 transition-all text-primary-content font-bold flex justify-between items-center py-3.5 px-5 h-auto rounded-2xl"
						onClick={() => setStep("checkout")}>
						<span className="flex items-center gap-2 text-sm font-extrabold">
							<ShoppingBag className="w-5 h-5" />
							<span>Review &amp; Checkout</span>
						</span>
						<span className="badge badge-lg bg-base-100/20 text-white border-none font-extrabold px-3 flex items-center gap-1.5">
							<span>{cartCount} items</span>
							<span>&bull;</span>
							<span>฿{total.toFixed(2)}</span>
							<ArrowRight className="w-3.5 h-3.5 ml-0.5" />
						</span>
					</button>
				</div>
			)}

			{/* Slide-over Cart Drawer */}
			<CartDrawer
				isOpen={isCartOpen}
				onClose={closeCart}
				cart={cart}
				total={total}
			/>
		</>
	);
};

export default QROrder;
