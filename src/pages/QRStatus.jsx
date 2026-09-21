import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { orderAPI } from "../../src/api/orders";
import {
	ArrowLeft,
	Clock,
	CookingPot,
	Bike,
	CheckCircle2,
	AlertTriangle,
	Upload,
	Phone,
	MessageCircle,
	MapPin,
	Building,
	FileText,
	ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import PaymentModal from "../components/Cart/PaymentModal";

const QRStatus = () => {
	const { orderId } = useParams();
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	const [order, setOrder] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(
		() => searchParams.get("payment") === "open"
	);

	const refreshOrder = async () => {
		try {
			const data = await orderAPI.getStatus(orderId);
			setOrder(data);
		} catch (err) {
			console.error("Refresh order error:", err);
		}
	};

	useEffect(() => {
		let isMounted = true;

		const loadOrder = async () => {
			try {
				const data = await orderAPI.getStatus(orderId);
				if (isMounted) {
					setOrder(data);
					setIsLoading(false);
				}
			} catch (error) {
				console.error("Fetch order error:", error);
				if (isMounted) {
					toast.error("Order not found");
					navigate("/");
				}
			}
		};

		loadOrder();

		// Subscribe to live Postgres changes on this order
		const subscription = orderAPI.subscribe(orderId, (updatedOrder) => {
			if (isMounted) {
				setOrder(updatedOrder);

				if (updatedOrder.pos_order_status === "preparing") {
					toast.success("🍳 Order approved! Kitchen has started cooking.");
				} else if (updatedOrder.pos_order_status === "ready") {
					toast.success("🛵 Food is ready and out for delivery!");
				} else if (updatedOrder.pos_order_status === "completed") {
					toast.success("✅ Delivered! Thank you for ordering with us.");
				} else if (
					updatedOrder.pos_order_status === "cancelled" ||
					updatedOrder.pos_order_status === "refunded"
				) {
					toast.error("⚠️ Order update: Please review notice below.");
				}
			}
		});

		return () => {
			isMounted = false;
			if (subscription && typeof subscription.unsubscribe === "function") {
				subscription.unsubscribe();
			}
		};
	}, [orderId, searchParams, navigate]);

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-base-200">
				<div className="text-center">
					<span className="loading loading-spinner loading-lg text-primary"></span>
					<p className="mt-3 text-sm text-base-content/60 font-medium">
						Loading order details...
					</p>
				</div>
			</div>
		);
	}

	if (!order) return null;

	const isCancelledOrDisapproved =
		order.pos_order_status === "cancelled" ||
		order.pos_order_status === "refunded";
	const isPaid = order.payment_status === "paid";
	const hasSlip = Boolean(order.payment_slip_url);

	// Determine active tracking step
	let currentStep = 0; // 0: Slip submitted / awaiting approval
	if (order.pos_order_status === "preparing") currentStep = 1;
	if (order.pos_order_status === "ready") currentStep = 2;
	if (order.pos_order_status === "completed") currentStep = 3;

	const shopPhone = import.meta.env.VITE_SHOP_PHONE || "0812345678";
	const lineUrl = import.meta.env.VITE_LINE_URL || "https://line.me";

	return (
		<div className="min-h-screen bg-base-200 pb-12">
			{/* Top Navbar */}
			<div className="sticky top-0 z-30 bg-base-100/90 backdrop-blur-md border-b border-base-300 px-4 py-3">
				<div className="max-w-md mx-auto flex items-center justify-between">
					<button
						className="btn btn-sm btn-ghost gap-1.5"
						onClick={() => navigate("/")}>
						<ArrowLeft className="w-4 h-4" />
						Menu
					</button>
					<span className="font-bold text-sm text-base-content">
						Order Tracking
					</span>
					<div className="w-12"></div>
				</div>
			</div>

			<div className="max-w-md mx-auto p-4 space-y-4 pt-4">
				{/* ============================================================ */}
				{/* 1. ADMIN DISAPPROVED / CANCELLED / CHANGE REQUESTED NOTIFICATION */}
				{/* ============================================================ */}
				{isCancelledOrDisapproved && (
					<div className="card bg-error/10 border-2 border-error/30 shadow-md">
						<div className="card-body p-4 space-y-3">
							<div className="flex items-start gap-3">
								<AlertTriangle className="w-6 h-6 text-error shrink-0 mt-0.5" />
								<div>
									<h3 className="font-extrabold text-base text-error">
										Order Disapproved / Item Out of Stock
									</h3>
									<p className="text-xs text-base-content/80 mt-1 leading-relaxed">
										We apologize! Some item(s) in your order may be temporarily out of
										stock or our staff requested a change before preparing.
									</p>
									{order.notes && (
										<div className="mt-2 p-2 rounded bg-base-100 text-xs font-medium border border-base-200">
											<span className="text-base-content/50">Staff Note: </span>
											<span className="text-base-content">{order.notes}</span>
										</div>
									)}
								</div>
							</div>

							<div className="pt-2 border-t border-error/20 flex flex-col sm:flex-row gap-2">
								<a
									href={lineUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="btn btn-sm btn-success text-white flex-1 gap-1.5">
									<MessageCircle className="w-4 h-4" />
									Chat on LINE
								</a>
								<a
									href={`tel:${shopPhone}`}
									className="btn btn-sm btn-outline btn-error flex-1 gap-1.5">
									<Phone className="w-4 h-4" />
									Call Shop
								</a>
							</div>
						</div>
					</div>
				)}

				{/* ============================================================ */}
				{/* 2. PAYMENT SLIP BANNER (IF AWAITING SLIP OR UPLOADED) */}
				{/* ============================================================ */}
				{!isCancelledOrDisapproved && (
					<div className="card bg-base-100 shadow-md border border-base-200">
						<div className="card-body p-4 space-y-3">
							<div className="flex items-center justify-between">
								<span className="text-xs font-bold uppercase tracking-wider text-base-content/50">
									Order #{order.order_number}
								</span>
								<span
									className={`badge badge-sm font-semibold ${
										isPaid
											? "badge-success text-white"
											: hasSlip
											? "badge-warning"
											: "badge-error text-white"
									}`}>
									{isPaid
										? "Payment Verified"
										: hasSlip
										? "Slip Under Review"
										: "Slip Required"}
								</span>
							</div>

							{/* Payment Status State Box */}
							{!isPaid && !hasSlip && (
								<div className="bg-warning/10 border border-warning/30 rounded-xl p-3 flex flex-col gap-2.5">
									<div className="flex items-start gap-2.5">
										<Upload className="w-5 h-5 text-warning shrink-0 mt-0.5" />
										<div>
											<h4 className="text-xs font-bold text-warning-content">
												Payment Slip Needed
											</h4>
											<p className="text-xs text-base-content/70 mt-0.5">
												Please transfer ฿{Number(order.total_amount).toFixed(2)} and
												upload your slip so staff can approve your order.
											</p>
										</div>
									</div>
									<button
										className="btn btn-sm btn-primary w-full shadow-sm text-primary-content font-bold"
										onClick={() => setIsPaymentModalOpen(true)}>
										Upload Payment Slip Now
									</button>
								</div>
							)}

							{!isPaid && hasSlip && (
								<div className="bg-info/10 border border-info/30 rounded-xl p-3 space-y-2">
									<div className="flex items-start gap-2.5">
										<Clock className="w-5 h-5 text-info shrink-0 mt-0.5 animate-spin" />
										<div className="flex-1">
											<h4 className="text-xs font-bold text-info-content">
												Payment Slip Uploaded
											</h4>
											<p className="text-xs text-base-content/70 mt-0.5">
												Staff is reviewing your transfer slip. Once approved, cooking will
												begin right away!
											</p>
										</div>
									</div>
									<div className="flex items-center justify-between pt-1 text-xs">
										<a
											href={order.payment_slip_url}
											target="_blank"
											rel="noopener noreferrer"
											className="text-primary underline flex items-center gap-1">
											<FileText className="w-3.5 h-3.5" /> View Uploaded Slip
											<ExternalLink className="w-3 h-3" />
										</a>
										<button
											className="text-xs text-base-content/60 hover:text-primary"
											onClick={() => setIsPaymentModalOpen(true)}>
											Re-upload
										</button>
									</div>
								</div>
							)}

							{isPaid && (
								<div className="bg-success/10 border border-success/30 rounded-xl p-3 flex items-center gap-2.5">
									<CheckCircle2 className="w-5 h-5 text-success shrink-0" />
									<div>
										<h4 className="text-xs font-bold text-success">
											Payment Confirmed
										</h4>
										<p className="text-xs text-base-content/70">
											Your transfer has been verified by staff.
										</p>
									</div>
								</div>
							)}
						</div>
					</div>
				)}

				{/* ============================================================ */}
				{/* 3. ORDER STATUS TIMELINE (STEPS) */}
				{/* ============================================================ */}
				{!isCancelledOrDisapproved && (
					<div className="card bg-base-100 shadow-md border border-base-200">
						<div className="card-body p-4">
							<h3 className="text-xs font-bold uppercase tracking-wider text-base-content/60 mb-3">
								Preparation & Delivery Progress
							</h3>

							<div className="space-y-4">
								{/* Step 1: Verification */}
								<div className="flex items-start gap-3">
									<div
										className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
											currentStep >= 0
												? isPaid
													? "bg-success text-white"
													: "bg-warning text-warning-content animate-pulse"
												: "bg-base-300 text-base-content/40"
										}`}>
										<Clock className="w-4 h-4" />
									</div>
									<div className="flex-1">
										<div className="text-sm font-bold">
											{isPaid ? "Payment Verified" : "Awaiting Slip Approval"}
										</div>
										<p className="text-xs text-base-content/60">
											{isPaid
												? "Order confirmed by admin"
												: "Reviewing payment slip"}
										</p>
									</div>
								</div>

								{/* Step 2: Preparing in Kitchen */}
								<div className="flex items-start gap-3">
									<div
										className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
											currentStep >= 1
												? "bg-primary text-white"
												: "bg-base-200 text-base-content/40"
										}`}>
										<CookingPot className="w-4 h-4" />
									</div>
									<div className="flex-1">
										<div className="text-sm font-bold">Kitchen Preparing</div>
										<p className="text-xs text-base-content/60">
											{currentStep >= 1
												? "Fresh food is cooking on the stove"
												: "Starts after payment verification"}
										</p>
									</div>
								</div>

								{/* Step 3: Out for Delivery */}
								<div className="flex items-start gap-3">
									<div
										className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
											currentStep >= 2
												? "bg-primary text-white animate-bounce"
												: "bg-base-200 text-base-content/40"
										}`}>
										<Bike className="w-4 h-4" />
									</div>
									<div className="flex-1">
										<div className="text-sm font-bold">Out for Delivery</div>
										<p className="text-xs text-base-content/60">
											{currentStep >= 2
												? "Rider is heading to your apartment building"
												: "Dispatched upon packaging"}
										</p>
									</div>
								</div>

								{/* Step 4: Delivered */}
								<div className="flex items-start gap-3">
									<div
										className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
											currentStep >= 3
												? "bg-success text-white"
												: "bg-base-200 text-base-content/40"
										}`}>
										<CheckCircle2 className="w-4 h-4" />
									</div>
									<div className="flex-1">
										<div className="text-sm font-bold">Delivered</div>
										<p className="text-xs text-base-content/60">
											Delivered to your room / lobby. Enjoy!
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* ============================================================ */}
				{/* 4. DELIVERY DESTINATION INFO */}
				{/* ============================================================ */}
				<div className="card bg-base-100 shadow-md border border-base-200">
					<div className="card-body p-4 space-y-2.5">
						<h3 className="text-xs font-bold uppercase tracking-wider text-base-content/60 flex items-center gap-1.5">
							<MapPin className="w-4 h-4 text-primary" />
							Delivery Details
						</h3>

						<div className="text-xs space-y-1.5 bg-base-200/50 p-3 rounded-xl border border-base-200">
							<div className="flex items-start gap-2">
								<Building className="w-4 h-4 text-primary shrink-0 mt-0.5" />
								<div>
									<span className="font-bold text-base-content">
										{order.delivery_address || "Apartment Delivery"}
									</span>
								</div>
							</div>
							<div className="flex justify-between pt-1 border-t border-base-300/50 text-base-content/70">
								<span>Customer:</span>
								<span className="font-semibold text-base-content">
									{order.customer_name || "Customer"} (
									{order.customer_phone || "-"})
								</span>
							</div>
							{order.notes && (
								<div className="flex justify-between text-base-content/70">
									<span>Note:</span>
									<span className="font-medium text-base-content">
										{order.notes}
									</span>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* ============================================================ */}
				{/* 5. ORDER SUMMARY & BILL */}
				{/* ============================================================ */}
				<div className="card bg-base-100 shadow-md border border-base-200">
					<div className="card-body p-4 space-y-3">
						<h3 className="text-xs font-bold uppercase tracking-wider text-base-content/60">
							Ordered Items
						</h3>

						<div className="space-y-2 divide-y divide-base-200">
							{order.order_items?.map((item, idx) => (
								<div key={idx} className="pt-2 first:pt-0 flex justify-between text-xs">
									<div>
										<span className="font-bold text-base-content">
											{item.quantity}x{" "}
											{item.name_english || item.name_burmese || item.name_thai}
										</span>
										{item.item_note && (
											<p className="text-[10px] text-base-content/50">
												{item.item_note}
											</p>
										)}
									</div>
									<span className="font-mono font-semibold">
										฿{(Number(item.price) * item.quantity).toFixed(2)}
									</span>
								</div>
							))}
						</div>

						{/* Bill Totals */}
						<div className="pt-2 border-t border-base-200 space-y-1 text-xs">
							<div className="flex justify-between text-base-content/70">
								<span>Food Subtotal</span>
								<span className="font-mono">
									฿{Number(order.subtotal || 0).toFixed(2)}
								</span>
							</div>
							<div className="flex justify-between text-base-content/70">
								<span>Apartment Delivery Fee</span>
								<span className="font-mono text-primary font-bold">
									฿{Number(order.delivery_fee || 0).toFixed(2)}
								</span>
							</div>
							<div className="flex justify-between pt-2 border-t border-base-300 font-bold text-sm">
								<span>Total</span>
								<span className="font-mono text-base text-primary">
									฿{Number(order.total_amount || 0).toFixed(2)}
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Support / Direct Contact Box */}
				<div className="text-center pt-2 pb-6 space-y-2">
					<p className="text-xs text-base-content/50">
						Need help with your order or want to modify an item?
					</p>
					<div className="flex justify-center gap-3">
						<a
							href={lineUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="btn btn-xs btn-outline btn-success gap-1">
							<MessageCircle className="w-3.5 h-3.5" />
							LINE Support
						</a>
						<a
							href={`tel:${shopPhone}`}
							className="btn btn-xs btn-outline btn-neutral gap-1">
							<Phone className="w-3.5 h-3.5" />
							Call Shop
						</a>
					</div>
				</div>
			</div>

			{/* Payment Slip Upload Modal */}
			<PaymentModal
				isOpen={isPaymentModalOpen}
				onClose={() => setIsPaymentModalOpen(false)}
				order={order}
				onPaymentSubmitted={() => refreshOrder()}
			/>
		</div>
	);
};

export default QRStatus;
