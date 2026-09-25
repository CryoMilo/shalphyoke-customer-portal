import { useState, useEffect } from "react";
import { useMenuStore } from "../stores/useMenuStore";
import { useCartStore } from "../stores/useCartStore";
import { useOrderFlowStore } from "../stores/useOrderFlowStore";
import { useCart } from "../context/CartContext";
import MenuGrid from "../components/Menu/MenuGrid";
import CartDrawer from "../components/Cart/CartDrawer";
import LocationPromptPage from "../components/Location/LocationPromptPage";
import ContactDetailsSection from "../components/Checkout/ContactDetailsSection";
import StockCheckSection from "../components/Checkout/StockCheckSection";
import PaymentSection from "../components/Checkout/PaymentSection";
import WaitingForApproval from "../components/Checkout/WaitingForApproval";
import OrderStepper from "../components/Shared/OrderStepper";
import { ShoppingBag, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { getCartTotal, getCartItemCount } from "../utils/cartUtils";
import { getItemTimeAvailability } from "../utils/menuAvailability";

const QROrder = () => {
	const { isCartOpen, closeCart } = useCart();
	const { step, setStep, selectedLocation, activeOrderRequest } = useOrderFlowStore();

	const { menuItems, specials, fetchMenu, isLoading: menuLoading } = useMenuStore();
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

	// 🔒 CRITICAL GUARD: If customer has an active order request currently being checked by kitchen,
	// lock customer to StockCheckSection so they cannot place simultaneous duplicate requests.
	if (
		activeOrderRequest?.status === "stock_checking" &&
		activeOrderRequest?.stock_status === "pending_check"
	) {
		return <StockCheckSection />;
	}

	// Step 1: Location Choice Page (if location not confirmed or user navigating to location)
	if (step === "location" || !selectedLocation.isConfirmed) {
		return <LocationPromptPage />;
	}

	// Step 3 (Phase 1): Contact & Details Info
	if (step === "contact" || step === "checkout") {
		return <ContactDetailsSection />;
	}

	// Step 3 (Phase 1 Stall): Kitchen Stock Availability Check
	if (step === "stock_check") {
		return <StockCheckSection />;
	}

	// Step 4 (Phase 2): Payment & Slip Upload
	if (step === "payment") {
		return <PaymentSection />;
	}

	// Final Step: Waiting for Admin Order Approval UI
	if (step === "waiting") {
		return <WaitingForApproval />;
	}

	return (
		<>
			{/* Stepped Horizontal Progress Line */}
			<div className="bg-base-100 border border-base-200 rounded-2xl p-3 sm:p-4 mb-4 shadow-sm">
				<OrderStepper currentStep={2} />
			</div>

			{/* Self-Order Kiosk Category Grid & Items */}
			<MenuGrid items={menuItems} specials={specials} />

			{/* Floating Bottom Cart Bar */}
			{cart.length > 0 && (
				<div className="fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto animate-slideUp">
					<button
						className="btn btn-primary w-full shadow-2xl hover:shadow-primary/30 transition-all text-primary-content font-bold flex justify-between items-center py-3.5 px-5 h-auto rounded-2xl"
						onClick={() => {
							const unavailableItem = cart.find(
								(item) => !getItemTimeAvailability(item).isAvailable
							);
							if (unavailableItem) {
								const timeAvail = getItemTimeAvailability(unavailableItem);
								toast.error(
									`"${unavailableItem.name_english || "Item"}" is ${timeAvail.reason.toLowerCase()}. Please remove it from cart.`
								);
								return;
							}
							setStep("contact");
						}}>
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
