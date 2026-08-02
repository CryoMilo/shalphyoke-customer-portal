import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { orderAPI } from "../api/orders";
import {
	ArrowLeft,
	// CheckCircle,
	// Clock,
	// CookingPot,
	// Utensils,
	// XCircle,
} from "lucide-react";
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
		return (
			<div className="min-h-screen flex items-center justify-center bg-base-200">
				<span className="loading loading-spinner loading-lg text-primary"></span>
			</div>
		);
	}

	// Order Status Timeline Component
	// const OrderTimeline = ({ status }) => {
	// 	if (status === "cancelled" || status === "refunded") {
	// 		return (
	// 			<div className="alert alert-error">
	// 				<XCircle className="w-5 h-5" />
	// 				<span>This order has been {status}</span>
	// 			</div>
	// 		);
	// 	}

	// 	const steps = [
	// 		{ key: "pending", label: "Order Received", icon: Clock },
	// 		{ key: "preparing", label: "Preparing", icon: CookingPot },
	// 		{ key: "ready", label: "Ready to Serve", icon: Utensils },
	// 		{ key: "completed", label: "Completed", icon: CheckCircle },
	// 	];

	// 	const currentStep = steps.findIndex((s) => s.key === status);
	// 	const isComplete = status === "completed";

	// 	return (
	// 		<ul className="steps steps-vertical ml-4">
	// 			{steps.map((step, index) => {
	// 				const Icon = step.icon;
	// 				const isActive = index <= currentStep;
	// 				const isCurrent = index === currentStep;

	// 				return (
	// 					<li
	// 						key={step.key}
	// 						className={`step ${isActive ? "step-primary" : ""}`}>
	// 						<div className="flex items-center gap-2">
	// 							<Icon
	// 								className={`w-4 h-4 ${
	// 									isActive ? "text-primary" : "text-base-content/30"
	// 								}`}
	// 							/>
	// 							<span
	// 								className={isActive ? "font-medium" : "text-base-content/30"}>
	// 								{step.label}
	// 							</span>
	// 							{isCurrent && !isComplete && (
	// 								<span className="loading loading-spinner loading-xs text-primary" />
	// 							)}
	// 						</div>
	// 					</li>
	// 				);
	// 			})}
	// 		</ul>
	// 	);
	// };

	return (
		<div className="min-h-screen bg-base-200">
			<div className="max-w-md mx-auto p-4 pt-6">
				<div className="card bg-base-100 shadow-lg border border-base-200">
					<div className="card-body space-y-4">
						{/* Header */}
						<div className="flex items-center justify-between">
							<div>
								<h2 className="card-title text-xl">Order Status</h2>
								<div className="font-mono text-sm text-base-content/50">
									#{order.order_number?.slice(-8) || order.id.slice(0, 8)}
								</div>
							</div>
							<span
								className={`badge ${
									status === "completed"
										? "badge-success"
										: status === "ready"
										? "badge-success"
										: status === "preparing"
										? "badge-warning"
										: status === "cancelled" || status === "refunded"
										? "badge-error"
										: "badge-ghost"
								}`}>
								{status}
							</span>
						</div>

						{/* Timeline */}
						{/* <OrderTimeline status={status} /> */}

						{/* Order Items */}
						<div className="pt-2">
							<h4 className="font-bold text-sm mb-2">Your Order</h4>
							<div className="space-y-1">
								{order.order_items?.map((item, idx) => (
									<div
										key={idx}
										className="flex justify-between text-sm py-1 border-b border-base-200/60 last:border-0">
										<span className="text-base-content/80">
											{item.quantity}x {item.name_burmese}
										</span>
										<span className="font-mono">
											฿{(item.final_price || item.price) * item.quantity}
										</span>
									</div>
								))}
							</div>
							<div className="flex justify-between pt-2 mt-2 border-t border-base-300 font-bold">
								<span>Total</span>
								<span className="text-primary">฿{order.total_amount}</span>
							</div>
						</div>

						{/* Payment Status */}
						{order.payment_status === "unpaid" &&
							order.pos_order_status === "ready" && (
								<div className="alert alert-warning">
									<span>
										💳 Please pay at the counter when your food arrives
									</span>
								</div>
							)}

						{order.payment_status === "paid" && (
							<div className="alert alert-success">
								<span>✅ Payment complete! Thank you for dining with us.</span>
							</div>
						)}

						{(status === "cancelled" || status === "refunded") && (
							<div className="alert alert-error">
								<span>❌ This order has been {status}</span>
							</div>
						)}

						{/* Back Button */}
						<button
							className="btn btn-ghost btn-sm w-full gap-2 mt-2"
							onClick={() => navigate(`/order/${order.table_number}`)}>
							<ArrowLeft className="w-4 h-4" />
							Back to Menu
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default QRStatus;
