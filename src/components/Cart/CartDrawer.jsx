import { X, ShoppingBag, ArrowRight } from "lucide-react";
import CartItem from "./CartItem";
import { useOrderFlowStore } from "../../stores/useOrderFlowStore";

const CartDrawer = ({ isOpen, onClose, cart, total }) => {
	const { selectedLocation, setStep } = useOrderFlowStore();

	const deliveryFee = Number(selectedLocation.fee) || 0;
	const grandTotal = total + deliveryFee;

	const handleProceedToCheckout = () => {
		onClose();
		setStep("checkout");
	};

	return (
		<>
			{/* Overlay */}
			<div
				className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 ${
					isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
				}`}
				onClick={onClose}
			/>

			{/* Drawer */}
			<div
				className={`fixed right-0 top-0 h-full w-full max-w-md bg-base-100 shadow-2xl z-50 flex flex-col transition-transform duration-300 ${
					isOpen ? "translate-x-0" : "translate-x-full"
				}`}>
				{/* Drawer Header */}
				<div className="flex items-center justify-between p-4 border-b border-base-200 bg-base-200/50">
					<div className="flex items-center gap-2">
						<ShoppingBag className="w-5 h-5 text-primary" />
						<h2 className="font-extrabold text-base">Your Cart</h2>
					</div>
					<button className="btn btn-sm btn-ghost btn-circle" onClick={onClose}>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Cart Items List */}
				<div className="flex-1 overflow-y-auto p-4 space-y-3">
					{cart.length === 0 ? (
						<div className="flex flex-col items-center justify-center h-full text-center text-base-content/40 py-12">
							<ShoppingBag className="w-12 h-12 stroke-[1.5] mb-2 opacity-30" />
							<p className="text-sm font-semibold text-base-content/60">Your cart is empty</p>
							<p className="text-xs text-base-content/40 mt-1">
								Add items from the menu to get started
							</p>
						</div>
					) : (
						<div className="space-y-2">
							{cart.map((item) => (
								<CartItem key={item.cart_id} item={item} />
							))}
						</div>
					)}
				</div>

				{/* Drawer Footer / Bill Summary */}
				{cart.length > 0 && (
					<div className="border-t border-base-200 bg-base-200/50 p-4 space-y-3">
						<div className="space-y-1.5 text-xs">
							<div className="flex justify-between text-base-content/70">
								<span>Food Subtotal</span>
								<span className="font-semibold font-mono">฿{total.toFixed(2)}</span>
							</div>
							<div className="flex justify-between text-base-content/70">
								<span>
									Delivery Fee ({selectedLocation.apartmentName || "Apartment"})
								</span>
								<span className="font-semibold font-mono text-primary">
									฿{deliveryFee.toFixed(2)}
								</span>
							</div>
							<div className="flex justify-between items-center pt-2 border-t border-base-300 font-bold text-sm">
								<span>Total Amount</span>
								<span className="text-lg text-primary font-mono">
									฿{grandTotal.toFixed(2)}
								</span>
							</div>
						</div>

						<button
							className="btn btn-primary w-full shadow-lg font-bold text-primary-content rounded-xl flex items-center justify-between"
							onClick={handleProceedToCheckout}>
							<span>Proceed to Checkout</span>
							<span className="flex items-center gap-1">
								฿{grandTotal.toFixed(2)}
								<ArrowRight className="w-4 h-4 ml-1" />
							</span>
						</button>
					</div>
				)}
			</div>
		</>
	);
};

export default CartDrawer;
