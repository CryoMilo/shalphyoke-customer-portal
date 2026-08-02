import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { orderAPI } from "../api/orders";
import OrderStatus from "../components/Shared/OrderStatus";
import LoadingSpinner from "../components/Shared/LoadingSpinner";
import toast from "react-hot-toast";

const QRStatus = () => {
	const { orderId } = useParams();
	const navigate = useNavigate();
	const [order, setOrder] = useState(null);
	const [status, setStatus] = useState("loading");

	useEffect(() => {
		const fetchOrder = async () => {
			try {
				const data = await orderAPI.getStatus(orderId);
				setOrder(data);
				setStatus(data.pos_order_status);
			} catch (error) {
				console.error("Fetch order error:", error);
				toast.error("Order not found");
				navigate("/order/invalid");
			}
		};

		fetchOrder();

		const subscription = orderAPI.subscribe(orderId, (updatedOrder) => {
			setOrder(updatedOrder);
			setStatus(updatedOrder.pos_order_status);

			// Toast notifications based on status
			if (updatedOrder.pos_order_status === "ready") {
				toast.success("🍽️ Your food is ready!");
			}
			if (updatedOrder.pos_order_status === "completed") {
				toast.success("✅ Order complete! Thank you!");
			}
			if (updatedOrder.pos_order_status === "cancelled") {
				toast.error("❌ Order was cancelled");
			}
			if (updatedOrder.pos_order_status === "refunded") {
				toast.error("🔄 Order was refunded");
			}
		});

		return () => {
			subscription.unsubscribe();
		};
	}, [orderId, navigate]);

	if (!order) {
		return <LoadingSpinner />;
	}

	return (
		<div className="max-w-md mx-auto p-4 min-h-screen bg-base-100">
			<div className="card bg-base-200 shadow-xl">
				<div className="card-body">
					<h2 className="card-title text-2xl">Order Status</h2>

					<div className="text-sm opacity-60 mb-4">
						Order #{order.order_number?.slice(-8) || order.id.slice(0, 8)}
					</div>

					<OrderStatus status={status} />

					{/* Order Items */}
					<div className="mt-6">
						<h3 className="font-bold mb-2">Your Order</h3>
						<div className="space-y-1">
							{order.order_items?.map((item, idx) => (
								<div
									key={idx}
									className="flex justify-between text-sm py-1 border-b border-base-300/50">
									<span>
										{item.quantity}x {item.name_burmese}
									</span>
									<span>
										฿{(item.final_price || item.price) * item.quantity}
									</span>
								</div>
							))}
						</div>
						<div className="mt-3 pt-2 border-t border-base-300 flex justify-between font-bold">
							<span>Total</span>
							<span className="text-primary">฿{order.total_amount}</span>
						</div>
					</div>

					{/* Payment Status */}
					{order.payment_status === "unpaid" &&
						order.pos_order_status === "ready" && (
							<div className="alert alert-warning mt-4">
								<span>💳 Please pay at the counter when your food arrives</span>
							</div>
						)}

					{order.payment_status === "paid" && (
						<div className="alert alert-success mt-4">
							<span>✅ Payment complete! Thank you for dining with us.</span>
						</div>
					)}

					{(status === "cancelled" || status === "refunded") && (
						<div className="alert alert-error mt-4">
							<span>❌ This order has been {status}</span>
						</div>
					)}

					<div className="mt-4 flex gap-2">
						<button
							className="btn btn-ghost btn-sm flex-1"
							onClick={() => navigate(`/order/${order.table_number}`)}>
							← Back to Menu
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default QRStatus;
