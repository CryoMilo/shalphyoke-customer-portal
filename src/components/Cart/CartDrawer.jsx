import { useState } from "react";
import { X, ShoppingBag } from "lucide-react";
import CartItem from "./CartItem";

const CartDrawer = ({ isOpen, onClose, onPlaceOrder, cart, total }) => {
	const [customerName, setCustomerName] = useState("");
	const [customerPhone, setCustomerPhone] = useState("");
	const [notes, setNotes] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async () => {
		if (cart.length === 0) return;

		setIsSubmitting(true);
		try {
			await onPlaceOrder({
				name: customerName,
				phone: customerPhone,
				notes: notes,
			});
			setCustomerName("");
			setCustomerPhone("");
			setNotes("");
			onClose();
		} catch (error) {
			console.error("Order error:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			{/* Overlay */}
			<div
				className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${
					isOpen
						? "opacity-100 pointer-events-auto"
						: "opacity-0 pointer-events-none"
				}`}
				onClick={onClose}
			/>

			{/* Drawer */}
			<div
				className={`fixed right-0 top-0 h-full w-full max-w-md bg-base-100 shadow-xl z-50 transition-transform duration-300 ${
					isOpen ? "translate-x-0" : "translate-x-full"
				}`}>
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-base-200 bg-base-200/50">
					<div className="flex items-center gap-2">
						<ShoppingBag className="w-5 h-5 text-primary" />
						<h2 className="font-bold text-lg">Your Cart</h2>
					</div>
					<button className="btn btn-sm btn-ghost btn-circle" onClick={onClose}>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Body */}
				<div className="flex-1 overflow-y-auto p-4 space-y-3 h-[60vh]">
					{cart.length === 0 ? (
						<div className="flex flex-col items-center justify-center h-full text-center">
							<div className="text-5xl mb-4 opacity-30">🛒</div>
							<h4 className="font-bold text-secondary">Your cart is empty</h4>
							<p className="text-sm text-base-content/50">
								Add some delicious items!
							</p>
						</div>
					) : (
						cart.map((item) => <CartItem key={item.cart_id} item={item} />)
					)}
				</div>

				{/* Footer */}
				{cart.length > 0 && (
					<div className="border-t border-base-200 bg-base-200/50 p-4 space-y-3">
						<div className="space-y-2">
							<input
								type="text"
								placeholder="Your name (optional)"
								className="input input-bordered input-sm w-full"
								value={customerName}
								onChange={(e) => setCustomerName(e.target.value)}
							/>
							<input
								type="tel"
								placeholder="Phone number (optional)"
								className="input input-bordered input-sm w-full"
								value={customerPhone}
								onChange={(e) => setCustomerPhone(e.target.value)}
							/>
							<textarea
								placeholder="Special instructions (optional)"
								className="textarea textarea-bordered textarea-xs w-full"
								rows="2"
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
							/>
						</div>

						<div className="flex justify-between items-center pt-2 border-t border-base-300/60">
							<span className="text-sm text-base-content/60">Subtotal</span>
							<span className="font-bold text-primary">
								฿{total.toFixed(2)}
							</span>
						</div>

						<button
							className="btn btn-primary w-full"
							disabled={isSubmitting}
							onClick={handleSubmit}>
							{isSubmitting ? (
								<>
									<span className="loading loading-spinner loading-xs"></span>
									Placing Order...
								</>
							) : (
								`Place Order • ฿${total.toFixed(2)}`
							)}
						</button>
					</div>
				)}
			</div>
		</>
	);
};

export default CartDrawer;
