import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMenuStore } from "../stores/useMenuStore";
import { useCartStore } from "../stores/useCartStore";
import { useCart } from "../context/CartContext";
import { orderAPI } from "../api/orders";
import MenuGrid from "../components/Menu/MenuGrid";
import CartDrawer from "../components/Cart/CartDrawer";
import { ShoppingBag, ShieldCheck, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { getCartTotal, getCartItemCount } from "../utils/cartUtils";

const QROrder = () => {
	const navigate = useNavigate();
	const { isCartOpen, closeCart, openCart } = useCart();

	const { menuItems, fetchMenu, isLoading: menuLoading } = useMenuStore();
	const { cart, clearCart } = useCartStore();

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

	const handlePlaceOrder = async (deliveryInfo) => {
		if (cart.length === 0) {
			toast.error("Your cart is empty");
			return;
		}

		try {
			const orderData = {
				customerName: deliveryInfo.name,
				customerPhone: deliveryInfo.phone,
				deliveryAddress: deliveryInfo.deliveryAddress,
				deliveryFee: deliveryInfo.deliveryFee,
				items: cart,
				subtotal: deliveryInfo.subtotal,
				totalAmount: deliveryInfo.totalAmount,
				notes: deliveryInfo.notes,
				paymentMethod: "bank_transfer",
				itemNotes: {},
				selectedExtras: [],
				itemExtraPrices: {},
			};

			const order = await orderAPI.createDeliveryOrder(orderData);

			localStorage.setItem("last_order_timestamp", Date.now().toString());
			localStorage.setItem("last_order_id", order.id);

			toast.success("Order received! Opening payment details... 🎉");
			clearCart();

			// Navigate to status page with payment modal automatically open
			navigate(`/order/status/${order.id}?payment=open`);
		} catch (error) {
			console.error("Delivery order error:", error);
			toast.error("Failed to place order. Please try again or contact shop.");
		}
	};

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

	const categories = [
		"All",
		...new Set(menuItems.map((item) => item?.category).filter(Boolean)),
	];

	return (
		<>
			{/* Welcome Delivery Hero Banner */}
			<div className="bg-gradient-to-r from-primary/10 via-primary/5 to-base-100 border border-primary/20 rounded-2xl p-4 sm:p-5 mb-5 shadow-sm">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div>
						<div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2">
							<Sparkles className="w-3.5 h-3.5" />
							<span>Now Delivering to Condos & Apartments</span>
						</div>
						<h1 className="text-lg sm:text-xl font-extrabold text-base-content tracking-tight">
							Authentic Burmese Flavors at Your Doorstep
						</h1>
						<p className="text-xs text-base-content/70 mt-1">
							Fixed delivery: <strong className="text-primary">฿10</strong> to Rye
							A/B &bull; <strong className="text-primary">฿20</strong> to
							Richpark, Lumpini, Blitz, The Rich, P Park.
						</p>
					</div>

					<div className="flex items-center gap-2 text-xs text-base-content/60 shrink-0 bg-base-100/80 p-2.5 rounded-xl border border-base-200">
						<ShieldCheck className="w-4 h-4 text-success" />
						<span>Bank / TrueMoney QR Verified</span>
					</div>
				</div>
			</div>

			{/* Menu Categories & Items Grid */}
			<MenuGrid items={menuItems} categories={categories} />

			{/* Floating Sticky Cart Bar */}
			{cart.length > 0 && (
				<div className="fixed bottom-4 left-4 right-4 z-40 max-w-4xl mx-auto animate-slideUp">
					<button
						className="btn btn-primary w-full shadow-2xl hover:shadow-primary/30 transition-all text-primary-content font-bold flex justify-between items-center py-3.5 px-5 h-auto rounded-xl"
						onClick={() => (isCartOpen ? closeCart() : openCart())}>
						<span className="flex items-center gap-2 text-sm sm:text-base">
							<ShoppingBag className="w-5 h-5" />
							Review & Checkout
						</span>
						<span className="badge badge-lg bg-base-100/20 text-white border-none font-extrabold px-3">
							{cartCount} items &bull; ฿{total.toFixed(2)}
						</span>
					</button>
				</div>
			)}

			{/* Delivery Cart Drawer */}
			<CartDrawer
				isOpen={isCartOpen}
				onClose={closeCart}
				onPlaceOrder={handlePlaceOrder}
				cart={cart}
				total={total}
			/>
		</>
	);
};

export default QROrder;
