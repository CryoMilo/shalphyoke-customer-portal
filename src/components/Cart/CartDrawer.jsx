import { useState } from "react";
import { X } from "lucide-react";
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
		<div
			className={`fixed inset-0 z-50 ${
				isOpen ? "pointer-events-auto" : "pointer-events-none"
			}`}>
			<div
				className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
					isOpen ? "opacity-100" : "opacity-0"
				}`}
				onClick={onClose}
			/>
			<div
				className={`absolute right-0 top-0 h-full w-full max-w-md bg-base-100 shadow-xl transition-transform duration-300 ${
					isOpen ? "translate-x-0" : "translate-x-full"
				}`}>
				<div className="flex flex-col h-full">
					<div className="flex justify-between items-center p-4 border-b border-base-200">
						<h2 className="text-xl font-bold">Your Cart</h2>
						<button
							className="btn btn-sm btn-ghost btn-circle"
							onClick={onClose}>
							<X className="w-5 h-5" />
						</button>
					</div>
					<div className="flex-1 overflow-y-auto p-4 space-y-3">
						{cart.length === 0 ? (
							<div className="text-center py-12 opacity-50">
								<p className="text-lg">Your cart is empty</p>
								<p className="text-sm">Add some delicious items!</p>
							</div>
						) : (
							cart.map((item) => <CartItem key={item.cart_id} item={item} />)
						)}
					</div>
					{cart.length > 0 && (
						<div className="p-4 border-t border-base-200 space-y-3">
							<input
								type="text"
								placeholder="Your name (optional)"
								className="input input-bordered w-full"
								value={customerName}
								onChange={(e) => setCustomerName(e.target.value)}
							/>
							<input
								type="tel"
								placeholder="Phone number (optional)"
								className="input input-bordered w-full"
								value={customerPhone}
								onChange={(e) => setCustomerPhone(e.target.value)}
							/>
							<textarea
								placeholder="Special instructions (optional)"
								className="textarea textarea-bordered w-full"
								rows="2"
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
							/>
						</div>
					)}
					<div className="p-4 border-t border-base-200 bg-base-200">
						<div className="flex justify-between items-center mb-4">
							<span className="text-lg font-bold">Total</span>
							<span className="text-2xl font-bold text-primary">
								฿{total.toFixed(2)}
							</span>
						</div>
						<button
							className="btn btn-primary w-full"
							disabled={cart.length === 0 || isSubmitting}
							onClick={handleSubmit}>
							{isSubmitting ? (
								<>
									<span className="loading loading-spinner loading-xs"></span>{" "}
									Placing Order...
								</>
							) : (
								`Place Order - ฿${total.toFixed(2)}`
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
export default CartDrawer;
