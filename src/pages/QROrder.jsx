import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSessionStore } from "../stores/useSessionStore";
import { useMenuStore } from "../stores/useMenuStore";
import { useCartStore } from "../stores/useCartStore";
import { useCart } from "../context/CartContext";
import { orderAPI } from "../api/orders";
import { sessionAPI } from "../api/session";
import BillView from "../components/Shared/BillView";
import MenuGrid from "../components/Menu/MenuGrid";
import CartDrawer from "../components/Cart/CartDrawer";
import { ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";

const QROrder = () => {
	const { table, token } = useParams();
	const navigate = useNavigate();
	const { isCartOpen, closeCart, openCart } = useCart();

	const { bills, setBills } = useSessionStore();
	const { menuItems, fetchMenu, isLoading: menuLoading } = useMenuStore();
	const { cart, total, clearCart } = useCartStore();

	const [isLoading, setIsLoading] = useState(true);

	// Store table number for header
	useEffect(() => {
		localStorage.setItem("tableNumber", table);
	}, [table]);

	useEffect(() => {
		const init = async () => {
			try {
				setIsLoading(true);

				// Validate session
				await sessionAPI.validate(parseInt(table), token);

				// Get bills
				const bills = await sessionAPI.getTableBills(parseInt(table));
				setBills(bills);

				// Load menu
				await fetchMenu();
			} catch (error) {
				console.error("Init error:", error);
				toast.error("Failed to load menu");
				navigate("/order/invalid");
			} finally {
				setIsLoading(false);
			}
		};

		init();
	}, [table, token]);

	const handlePlaceOrder = async (customerInfo) => {
		if (cart.length === 0) {
			toast.error("Your cart is empty");
			return;
		}

		try {
			const orderData = {
				tableNumber: parseInt(table),
				customerName: customerInfo?.name || null,
				customerPhone: customerInfo?.phone || null,
				items: cart,
				subtotal: total,
				total: total,
				notes: customerInfo?.notes || null,
				itemNotes: {},
				selectedExtras: [],
				itemExtraPrices: {},
			};

			const order = await orderAPI.create(orderData, token);

			toast.success("Order placed successfully! 🎉");
			clearCart();

			navigate(`/order/status/${order.id}`);
		} catch (error) {
			console.error("Order error:", error);
			toast.error("Failed to place order. Please try again.");
		}
	};

	if (isLoading || menuLoading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="text-center">
					<span className="loading loading-spinner loading-lg text-primary"></span>
					<p className="mt-4 text-sm text-base-content/50">Loading menu...</p>
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
			<BillView bills={bills} />

			<MenuGrid items={menuItems} categories={categories} />

			{/* Floating Cart Button */}
			{cart.length > 0 && (
				<div className="fixed bottom-4 left-4 right-4 z-40 max-w-4xl mx-auto">
					<button
						className="btn btn-primary w-full shadow-lg hover:shadow-xl transition-all text-primary-content font-bold flex justify-between items-center"
						onClick={() => (isCartOpen ? closeCart() : openCart())}>
						<span className="flex items-center gap-2">
							<ShoppingBag className="w-5 h-5" />
							View Cart
						</span>
						<span className="badge badge-primary text-white border-none font-bold">
							{cart.length} items • ฿{total.toFixed(2)}
						</span>
					</button>
				</div>
			)}

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
