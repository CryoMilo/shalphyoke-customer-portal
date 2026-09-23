import { useState, useEffect } from "react";
import {
	Clock,
	CookingPot,
	MapPin,
	Building,
	Phone,
	User,
	MessageCircle,
	AlertTriangle,
	ExternalLink,
	FileText,
	RotateCcw,
	Banknote,
	QrCode,
} from "lucide-react";
import { useOrderFlowStore } from "../../stores/useOrderFlowStore";
import { orderAPI } from "../../api/orders";
import OrderStepper from "../Shared/OrderStepper";
import toast from "react-hot-toast";

const WaitingForApproval = ({ orderIdProp }) => {
	const { currentOrder, setCurrentOrder, resetOrderFlow } = useOrderFlowStore();

	const [order, setOrder] = useState(currentOrder);
	const [isLoading, setIsLoading] = useState(!currentOrder && Boolean(orderIdProp));

	const targetOrderId = currentOrder?.id || orderIdProp;

	useEffect(() => {
		let isMounted = true;

		const fetchOrderDetails = async () => {
			if (!targetOrderId) return;
			try {
				const data = await orderAPI.getStatus(targetOrderId);
				if (isMounted) {
					setOrder(data);
					setCurrentOrder(data);
					setIsLoading(false);
				}
			} catch (err) {
				console.error("Fetch order error:", err);
				if (isMounted) setIsLoading(false);
			}
		};

		if (!currentOrder && targetOrderId) {
			fetchOrderDetails();
		}

		// Subscribe to live Postgres changes
		if (targetOrderId) {
			const subscription = orderAPI.subscribe(targetOrderId, (updatedOrder) => {
				if (isMounted) {
					setOrder(updatedOrder);
					setCurrentOrder(updatedOrder);

					if (updatedOrder.pos_order_status === "preparing") {
						toast.success("🍳 Order Approved by Admin! Kitchen is cooking.");
					} else if (updatedOrder.pos_order_status === "ready") {
						toast.success("🛵 Food is ready and out for delivery!");
					} else if (updatedOrder.pos_order_status === "completed") {
						toast.success("✅ Order complete! Thank you!");
					} else if (
						updatedOrder.pos_order_status === "cancelled" ||
						updatedOrder.pos_order_status === "refunded"
					) {
						toast.error("⚠️ Order was disapproved or cancelled by staff.");
					}
				}
			});

			return () => {
				isMounted = false;
				if (subscription && typeof subscription.unsubscribe === "function") {
					subscription.unsubscribe();
				}
			};
		}
	}, [targetOrderId, currentOrder, setCurrentOrder]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[50vh]">
				<div className="text-center space-y-3">
					<span className="loading loading-spinner loading-lg text-primary"></span>
					<p className="text-xs text-base-content/60 font-medium">
						Loading order details...
					</p>
				</div>
			</div>
		);
	}

	if (!order) {
		return (
			<div className="text-center py-12 space-y-3">
				<p className="text-sm font-semibold text-base-content/70">
					No active order found
				</p>
				<button
					className="btn btn-primary btn-sm rounded-xl font-bold"
					onClick={() => resetOrderFlow()}>
					Back to Menu
				</button>
			</div>
		);
	}

	const isDisapproved =
		order.pos_order_status === "cancelled" ||
		order.pos_order_status === "refunded";
	const isApproved =
		order.pos_order_status === "preparing" ||
		order.pos_order_status === "ready" ||
		order.pos_order_status === "completed";

	const shopPhone = import.meta.env.VITE_SHOP_PHONE || "0812345678";
	const lineUrl = import.meta.env.VITE_LINE_URL || "https://line.me";

	return (
		<div className="max-w-md mx-auto space-y-4 pb-16 animate-fadeIn">
			{/* Mobile App Bar */}
			<div className="flex items-center justify-between py-2 border-b border-base-200">
				<div>
					<span className="text-[11px] font-bold uppercase tracking-wider text-base-content/50">
						Order Reference
					</span>
					<h2 className="text-sm font-extrabold text-base-content font-mono">
						#{order.order_number}
					</h2>
				</div>
				<button
					className="btn btn-xs btn-ghost gap-1 text-base-content/60"
					onClick={() => resetOrderFlow()}>
					<RotateCcw className="w-3.5 h-3.5" />
					New Order
				</button>
			</div>

			{/* Stepped Progress Line */}
			<div className="bg-base-100 border border-base-200 rounded-2xl p-3 shadow-sm">
				<OrderStepper currentStep={4} />
			</div>

			{/* ============================================================ */}
			{/* 1. STATUS CARD (WAITING FOR APPROVAL / APPROVED / DISAPPROVED) */}
			{/* ============================================================ */}
			{!isDisapproved && !isApproved && (
				<div className="card bg-warning/10 border-2 border-warning/30 shadow-md rounded-2xl">
					<div className="card-body p-5 text-center space-y-3">
						<div className="w-16 h-16 bg-warning/20 text-warning-content rounded-full flex items-center justify-center mx-auto animate-pulse">
							<Clock className="w-8 h-8 text-warning" />
						</div>

						<div>
							<h3 className="text-base font-extrabold text-base-content">
								Waiting for Order Approval from Admin
							</h3>
							<p className="text-xs text-base-content/70 mt-1.5 leading-relaxed">
								Your order has been submitted. Our team is verifying your items and payment details.
								The kitchen will begin cooking once approved.
							</p>
						</div>

						<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-base-100 text-xs font-semibold text-warning border border-warning/30 shadow-sm mx-auto">
							<span className="loading loading-spinner loading-xs"></span>
							<span>Staff reviewing order...</span>
						</div>
					</div>
				</div>
			)}

			{/* Approved State */}
			{isApproved && (
				<div className="card bg-success/10 border-2 border-success/30 shadow-md rounded-2xl">
					<div className="card-body p-5 text-center space-y-2">
						<div className="w-14 h-14 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto">
							<CookingPot className="w-7 h-7 text-success" />
						</div>
						<h3 className="text-base font-extrabold text-success">
							Order Approved by Admin!
						</h3>
						<p className="text-xs text-base-content/70">
							The kitchen has accepted your order and started cooking fresh for you.
						</p>
					</div>
				</div>
			)}

			{/* Disapproved / Cancelled State */}
			{isDisapproved && (
				<div className="card bg-error/10 border-2 border-error/30 shadow-md rounded-2xl">
					<div className="card-body p-4 space-y-2.5">
						<div className="flex items-start gap-2.5">
							<AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5" />
							<div>
								<h3 className="font-extrabold text-sm text-error">
									Order Disapproved / Item Out of Stock
								</h3>
								<p className="text-xs text-base-content/80 mt-1">
									Some items may be out of stock or need adjustment. Please contact us via LINE or call the shop to swap items or request a refund.
								</p>
							</div>
						</div>
						{order.notes && (
							<div className="p-2 rounded-lg bg-base-100 text-xs border border-base-200">
								<span className="text-base-content/50">Staff Note: </span>
								<span className="font-semibold text-base-content">{order.notes}</span>
							</div>
						)}
					</div>
				</div>
			)}

			{/* ============================================================ */}
			{/* 2. DELIVERY DESTINATION DETAILS */}
			{/* ============================================================ */}
			<div className="card bg-base-100 shadow-sm border border-base-200 rounded-2xl">
				<div className="card-body p-4 space-y-2.5">
					<span className="text-xs font-bold uppercase tracking-wider text-base-content/60 flex items-center gap-1.5">
						<MapPin className="w-3.5 h-3.5 text-primary" />
						Delivery Information
					</span>

					<div className="bg-base-200/50 p-3 rounded-xl border border-base-200 text-xs space-y-1.5">
						<div className="flex items-start gap-2">
							<Building className="w-4 h-4 text-primary shrink-0 mt-0.5" />
							<div className="font-extrabold text-base-content">
								{order.delivery_address || "Apartment Delivery"}
							</div>
						</div>
						<div className="flex justify-between pt-1 border-t border-base-300/40 text-base-content/70">
							<span className="flex items-center gap-1">
								<User className="w-3 h-3 text-primary" />
								Customer:
							</span>
							<span className="font-semibold text-base-content">
								{order.customer_name || "Customer"}{" "}
								{order.customer_phone ? `(${order.customer_phone})` : ""}
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* ============================================================ */}
			{/* 3. PAYMENT SUMMARY */}
			{/* ============================================================ */}
			<div className="card bg-base-100 shadow-sm border border-base-200 rounded-2xl">
				<div className="card-body p-4 space-y-2.5">
					<span className="text-xs font-bold uppercase tracking-wider text-base-content/60 flex items-center gap-1.5">
						<QrCode className="w-3.5 h-3.5 text-primary" />
						Payment Summary
					</span>

					<div className="bg-base-200/50 p-3 rounded-xl border border-base-200 text-xs space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-base-content/70">Payment Method:</span>
							<span className="font-bold text-base-content capitalize flex items-center gap-1">
								{order.payment_method === "cash" ? (
									<>
										<Banknote className="w-3.5 h-3.5 text-success" />
										Cash on Delivery (COD)
									</>
								) : (
									<>
										<QrCode className="w-3.5 h-3.5 text-primary" />
										Bank / QR Transfer
									</>
								)}
							</span>
						</div>

						{order.payment_slip_url && (
							<div className="flex items-center justify-between pt-1 border-t border-base-300/40">
								<span className="text-base-content/70 flex items-center gap-1">
									<FileText className="w-3.5 h-3.5 text-success" />
									Payment Slip:
								</span>
								<a
									href={order.payment_slip_url}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary font-semibold underline flex items-center gap-1">
									View Slip <ExternalLink className="w-3 h-3" />
								</a>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* ============================================================ */}
			{/* 4. ORDER ITEMS SUMMARY */}
			{/* ============================================================ */}
			<div className="card bg-base-100 shadow-sm border border-base-200 rounded-2xl">
				<div className="card-body p-4 space-y-2.5">
					<span className="text-xs font-bold uppercase tracking-wider text-base-content/60">
						Items ({order.order_items?.length || 0})
					</span>

					<div className="divide-y divide-base-200 text-xs">
						{order.order_items?.map((item, idx) => (
							<div key={idx} className="py-2 flex justify-between items-center">
								<div>
									<span className="font-bold text-base-content">
										{item.quantity}x {item.name_english || item.name_burmese || item.name_thai}
									</span>
								</div>
								<span className="font-mono font-semibold">
									฿{(Number(item.price || 0) * (item.quantity || 1)).toFixed(2)}
								</span>
							</div>
						))}
					</div>

					<div className="pt-2 border-t border-base-200 space-y-1 text-xs">
						<div className="flex justify-between text-base-content/70">
							<span>Food Subtotal</span>
							<span className="font-mono">฿{Number(order.subtotal || 0).toFixed(2)}</span>
						</div>
						<div className="flex justify-between text-base-content/70">
							<span>Delivery Fee</span>
							<span className="font-mono text-primary font-bold">
								฿{Number(order.delivery_fee || 0).toFixed(2)}
							</span>
						</div>
						<div className="flex justify-between pt-2 border-t border-base-300 font-bold text-sm">
							<span>Total</span>
							<span className="font-mono text-primary text-base">
								฿{Number(order.total_amount || 0).toFixed(2)}
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Direct Contact Buttons */}
			<div className="pt-2 flex gap-2">
				<a
					href={lineUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="btn btn-sm btn-outline btn-success flex-1 gap-1.5 rounded-xl">
					<MessageCircle className="w-4 h-4" />
					Chat on LINE
				</a>
				<a
					href={`tel:${shopPhone}`}
					className="btn btn-sm btn-outline btn-neutral flex-1 gap-1.5 rounded-xl">
					<Phone className="w-4 h-4" />
					Call Shop
				</a>
			</div>
		</div>
	);
};

export default WaitingForApproval;
