import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSessionStore } from "../stores/useSessionStore";
import { useMenuStore } from "../stores/useMenuStore";
import { useCartStore } from "../stores/useCartStore";
import { orderAPI } from "../api/orders";
import { sessionAPI } from "../api/session";
import MenuGrid from "../components/Menu/MenuGrid";
import CartDrawer from "../components/Cart/CartDrawer";
import BillView from "../components/Shared/BillView";
import Header from "../components/Layout/Header";
import Footer from "../components/Layout/Footer";
import LoadingSpinner from "../components/Shared/LoadingSpinner";
import toast from "react-hot-toast";
const QROrder = () => {
	const { table, token } = useParams();
	const navigate = useNavigate();
	const { session, bills, setBills } = useSessionStore();
	const { menuItems, fetchMenu, isLoading: menuLoading } = useMenuStore();
	const { cart, total, clearCart } = useCartStore();
	const [isCartOpen, setIsCartOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	useEffect(() => {
		const init = async () => {
			try {
				setIsLoading(true);
				if (!session) {
					await sessionAPI.validate(parseInt(table), token);
				}
				const bills = await sessionAPI.getTableBills(parseInt(table));
				setBills(bills);
				await fetchMenu();
			} catch (error) {
				console.error("Init error:", error);
				toast.error("Failed to load menu");
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
			const order = await orderAPI.create(orderData, session.session_token);
			toast.success("Order placed successfully! 🎉");
			clearCart();
			navigate(`/order/status/${order.id}`);
		} catch (error) {
			console.error("Order error:", error);
			toast.error("Failed to place order. Please try again.");
		}
	};
	if (isLoading || menuLoading) {
		return <LoadingSpinner />;
	}
	const categories = [
		"All",
		...new Set(menuItems.map((item) => item.category)),
	];
	return (
		<div className="qr-order-page min-h-screen bg-base-100">
			<Header tableNumber={table} billCount={bills?.length || 0} />
			<main className="pb-32">
				<BillView bills={bills} />
				<div className="px-4">
					<MenuGrid
						items={menuItems}
						onAddItem={(item) => useCartStore.getState().addToCart(item)}
						categories={categories}
					/>
				</div>
			</main>
			<div className="fixed bottom-4 left-4 right-4">
				<button
					className="btn btn-primary w-full shadow-lg flex justify-between items-center"
					onClick={() => setIsCartOpen(true)}
					disabled={cart.length === 0}>
					<span>🛒 View Cart</span>
					<span className="badge badge-neutral">
						{cart.length} items • ฿{total.toFixed(2)}
					</span>
				</button>
			</div>
			<CartDrawer
				isOpen={isCartOpen}
				onClose={() => setIsCartOpen(false)}
				onPlaceOrder={handlePlaceOrder}
				cart={cart}
				total={total}
			/>
			<Footer />
		</div>
	);
};
export default QROrder;
