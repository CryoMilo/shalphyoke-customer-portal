import { useState, useEffect } from "react";
import {
	Clock,
	CheckCircle2,
	AlertCircle,
	AlertTriangle,
	MessageSquare,
	Phone,
	ArrowLeft,
	ShoppingBag,
	RotateCcw,
	ExternalLink,
	XCircle,
} from "lucide-react";
import { useOrderFlowStore } from "../../stores/useOrderFlowStore";
import { orderRequestAPI } from "../../api/orderRequests";
import { notifyStockCheckCancelled } from "../../api/telegram";
import OrderStepper from "../Shared/OrderStepper";
import toast from "react-hot-toast";

const TOTAL_WAIT_SECONDS = 120; // 2 minutes maximum

const StockCheckSection = () => {
	const {
		activeOrderRequest,
		updateActiveOrderRequest,
		setStep,
		resetOrderFlow,
	} = useOrderFlowStore();

	const [secondsLeft, setSecondsLeft] = useState(TOTAL_WAIT_SECONDS);
	const [stockStatus, setStockStatus] = useState(
		activeOrderRequest?.stock_status || "pending_check"
	);
	const [changeReason, setChangeReason] = useState(
		activeOrderRequest?.stock_rejection_reason || ""
	);
	const [isCancelling, setIsCancelling] = useState(false);
	const [showCancelConfirm, setShowCancelConfirm] = useState(false);

	const shopPhone = import.meta.env.VITE_SHOP_PHONE || "0812345678";
	const fbPageName = import.meta.env.VITE_FB_PAGE_NAME || "shalphyokemm";
	const messengerUrl = `https://m.me/${fbPageName}?text=${encodeURIComponent(
		`Hi Shal Phyoke! I am checking item availability for order request #${
			activeOrderRequest?.request_number || ""
		}`
	)}`;

	// Prevent accidental browser back navigation during stock check
	useEffect(() => {
		if (stockStatus !== "pending_check") return;

		window.history.pushState({ stockCheck: true }, "");

		const handlePopState = () => {
			if (stockStatus === "pending_check") {
				window.history.pushState({ stockCheck: true }, "");
				toast("Kitchen is checking item stock. Please wait or tap 'Cancel Order Request'.", {
					icon: "⏳",
				});
			}
		};

		window.addEventListener("popstate", handlePopState);
		return () => {
			window.removeEventListener("popstate", handlePopState);
		};
	}, [stockStatus]);

	// Cancel Order Request Handler
	const handleCancelRequest = async () => {
		if (!activeOrderRequest?.id || isCancelling) return;
		setIsCancelling(true);
		const toastId = toast.loading("Cancelling order request...");

		try {
			await orderRequestAPI.cancelOrderRequest(
				activeOrderRequest.id,
				"Cancelled by customer while waiting for stock check"
			);

			// Notify staff on Telegram in background
			notifyStockCheckCancelled(
				activeOrderRequest,
				"Customer cancelled from stock check screen"
			).catch((err) => console.error("Telegram cancel notify error:", err));

			toast.success("Order request cancelled. Your cart is preserved.", { id: toastId });
			resetOrderFlow();
		} catch (err) {
			console.error("Cancel order request error:", err);
			toast.error("Failed to cancel request. Please try again.", { id: toastId });
		} finally {
			setIsCancelling(false);
			setShowCancelConfirm(false);
		}
	};

	// Countdown Timer (120s down to 0)
	useEffect(() => {
		if (secondsLeft <= 0 || stockStatus !== "pending_check") return;

		const timer = setInterval(() => {
			setSecondsLeft((prev) => Math.max(0, prev - 1));
		}, 1000);

		return () => clearInterval(timer);
	}, [secondsLeft, stockStatus]);

	// Supabase Realtime Subscription for instant lightweight ping
	useEffect(() => {
		if (!activeOrderRequest?.id) return;

		const subscription = orderRequestAPI.subscribeToOrderRequest(
			activeOrderRequest.id,
			(updated) => {
				updateActiveOrderRequest(updated);
				setStockStatus(updated.stock_status);

				if (
					updated.stock_status === "stock_confirmed" ||
					updated.status === "awaiting_payment"
				) {
					toast.success("Kitchen confirmed all items! 🎉 Proceeding to payment...", {
						duration: 3000,
					});
					setTimeout(() => {
						setStep("payment");
					}, 800);
				} else if (updated.stock_status === "change_requested") {
					setChangeReason(
						updated.stock_rejection_reason ||
							"Some items are out of stock in the kitchen."
					);
					toast.error("Stock update needed from kitchen", { duration: 4000 });
				} else if (
					updated.stock_status === "rejected" ||
					updated.status === "cancelled"
				) {
					setChangeReason(
						updated.stock_rejection_reason || "Order request could not be fulfilled."
					);
					toast.error("Order request cancelled by kitchen", { duration: 4000 });
				}
			}
		);

		return () => {
			subscription?.unsubscribe?.();
		};
	}, [activeOrderRequest?.id, updateActiveOrderRequest, setStep]);

	// Percentage for progress bar
	const progressPercent = Math.max(
		0,
		Math.min(100, ((TOTAL_WAIT_SECONDS - secondsLeft) / TOTAL_WAIT_SECONDS) * 100)
	);

	const minutes = Math.floor(secondsLeft / 60);
	const seconds = secondsLeft % 60;
	const formattedTime = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

	if (!activeOrderRequest) {
		return (
			<div className="max-w-md mx-auto text-center py-12 space-y-4">
				<AlertCircle className="w-12 h-12 text-warning mx-auto" />
				<h3 className="font-extrabold text-base">No active request found</h3>
				<button className="btn btn-primary btn-sm" onClick={() => setStep("menu")}>
					Return to Menu
				</button>
			</div>
		);
	}

	return (
		<div className="max-w-md mx-auto space-y-4 pb-16 animate-fadeIn">
			{/* Mobile App Bar */}
			<div className="flex items-center justify-between py-2 border-b border-base-200">
				<div>
					<span className="text-[11px] font-bold uppercase tracking-wider text-base-content/50">
						Request Reference
					</span>
					<h2 className="text-sm font-extrabold text-base-content font-mono">
						#{activeOrderRequest.request_number}
					</h2>
				</div>
				{stockStatus === "pending_check" ? (
					<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning/15 text-warning border border-warning/30 text-[11px] font-bold">
						<span className="loading loading-spinner loading-xs text-warning"></span>
						<span>Checking Stock</span>
					</div>
				) : (
					<button
						className="btn btn-xs btn-ghost gap-1 text-base-content/60"
						onClick={() => resetOrderFlow()}>
						<RotateCcw className="w-3.5 h-3.5" />
						New Order
					</button>
				)}
			</div>

			{/* Stepped Progress Line */}
			<div className="bg-base-100 border border-base-200 rounded-2xl p-3 shadow-sm">
				<OrderStepper currentStep={3} />
			</div>

			{/* ============================================================ */}
			{/* 1. STOCK CONFIRMED STATE */}
			{/* ============================================================ */}
			{stockStatus === "stock_confirmed" && (
				<div className="card bg-success/10 border-2 border-success/30 shadow-md rounded-2xl animate-scaleUp">
					<div className="card-body p-5 text-center space-y-3">
						<div className="w-14 h-14 bg-success text-success-content rounded-full flex items-center justify-center mx-auto shadow-md">
							<CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
						</div>
						<div>
							<h3 className="text-base font-extrabold text-base-content">
								Items Confirmed by Kitchen!
							</h3>
							<p className="text-xs text-base-content/70 mt-1">
								All your requested items are in stock and reserved. Proceeding to payment...
							</p>
						</div>
						<button
							className="btn btn-success btn-sm w-full font-bold text-white rounded-xl mt-2"
							onClick={() => setStep("payment")}>
							Proceed to Payment Now
						</button>
					</div>
				</div>
			)}

			{/* ============================================================ */}
			{/* 2. CHANGE REQUESTED / OUT OF STOCK STATE */}
			{/* ============================================================ */}
			{stockStatus === "change_requested" && (
				<div className="card bg-warning/15 border-2 border-warning/40 shadow-md rounded-2xl animate-fadeIn">
					<div className="card-body p-5 space-y-3">
						<div className="flex items-start gap-3">
							<div className="w-10 h-10 bg-warning/20 text-warning rounded-2xl flex items-center justify-center shrink-0">
								<AlertCircle className="w-6 h-6" />
							</div>
							<div>
								<h3 className="text-sm font-extrabold text-base-content">
									Kitchen Stock Update Needed
								</h3>
								<p className="text-xs text-base-content/80 mt-1 leading-relaxed">
									{changeReason}
								</p>
							</div>
						</div>

						<div className="pt-2 flex flex-col gap-2">
							<button
								type="button"
								className="btn btn-primary btn-sm w-full font-bold rounded-xl"
								onClick={() => {
									resetOrderFlow();
									setStep("menu");
								}}>
								<ArrowLeft className="w-4 h-4 mr-1" />
								Return to Menu &amp; Swap Items
							</button>

							<a
								href={messengerUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="btn btn-outline btn-sm w-full font-bold rounded-xl gap-2">
								<MessageSquare className="w-4 h-4 text-primary" />
								Chat on Messenger
								<ExternalLink className="w-3.5 h-3.5" />
							</a>
						</div>
					</div>
				</div>
			)}

			{/* ============================================================ */}
			{/* 3. ACTIVE PENDING STOCK CHECK (2-MIN STALL SCREEN) */}
			{/* ============================================================ */}
			{stockStatus === "pending_check" && (
				<div className="card bg-base-100 border-2 border-primary/20 shadow-md rounded-2xl">
					<div className="card-body p-5 text-center space-y-4">
						{/* Animated Pulsing Icon */}
						<div className="relative w-16 h-16 mx-auto flex items-center justify-center">
							<div className="absolute inset-0 bg-primary/15 rounded-full animate-ping opacity-60"></div>
							<div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center relative z-10">
								<Clock className="w-8 h-8 text-primary animate-pulse" />
							</div>
						</div>

						{/* Headline & Explanation */}
						<div className="space-y-1 max-w-xs mx-auto">
							<h3 className="text-base font-extrabold text-base-content">
								Confirming Item Availability
							</h3>
							<p className="text-xs text-base-content/70 leading-relaxed">
								Please wait, we are confirming the availability of the items you ordered with the kitchen (maximum 2 mins).
							</p>
						</div>

						{/* Live Countdown & Progress Bar */}
						<div className="space-y-1.5 max-w-xs mx-auto pt-1">
							<div className="flex justify-between items-center text-xs font-semibold">
								<span className="text-base-content/60">Estimated wait time:</span>
								<span className="font-mono text-primary font-black text-sm">
									{formattedTime}
								</span>
							</div>

							<div className="w-full bg-base-200 rounded-full h-2 overflow-hidden">
								<div
									className="bg-primary h-2 rounded-full transition-all duration-1000 ease-linear"
									style={{ width: `${progressPercent}%` }}
								/>
							</div>
						</div>

						{/* If timer elapses (took more than 2 minutes) */}
						{secondsLeft === 0 && (
							<div className="p-3.5 bg-base-200/80 rounded-2xl border border-base-300 text-left space-y-2 animate-fadeIn mt-3">
								<div className="flex items-center gap-2 text-warning text-xs font-bold">
									<AlertCircle className="w-4 h-4 shrink-0" />
									<span>Kitchen is busy during rush hour!</span>
								</div>
								<p className="text-[11px] text-base-content/70 leading-relaxed">
									If you need urgent assistance or want to check in immediately, feel free to tap below to message our Facebook page:
								</p>
								<div className="flex items-center gap-2 pt-1">
									<a
										href={messengerUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="btn btn-primary btn-xs font-bold flex-1 rounded-lg gap-1">
										<MessageSquare className="w-3.5 h-3.5" />
										Contact on Messenger
										<ExternalLink className="w-3 h-3" />
									</a>
									<a
										href={`tel:${shopPhone}`}
										className="btn btn-ghost btn-xs font-bold rounded-lg border border-base-300 gap-1">
										<Phone className="w-3.5 h-3.5" />
										Call Shop
									</a>
								</div>
							</div>
						)}

						{/* Cancel Order Request Action */}
						<div className="pt-2 border-t border-base-200">
							<button
								type="button"
								disabled={isCancelling}
								onClick={() => setShowCancelConfirm(true)}
								className="btn btn-ghost btn-sm text-error/80 hover:text-error hover:bg-error/10 w-full rounded-xl text-xs font-bold gap-1.5 transition-colors">
								<XCircle className="w-4 h-4" />
								Cancel Order Request
							</button>
						</div>
					</div>
				</div>
			)}

			{/* ============================================================ */}
			{/* 4. ITEMS UNDER VERIFICATION */}
			{/* ============================================================ */}
			<div className="card bg-base-100 shadow-sm border border-base-200 rounded-2xl">
				<div className="card-body p-4 space-y-2.5">
					<div className="flex items-center justify-between">
						<span className="text-xs font-bold uppercase tracking-wider text-base-content/60 flex items-center gap-1.5">
							<ShoppingBag className="w-3.5 h-3.5 text-primary" />
							Requested Items ({activeOrderRequest.items?.length || 0})
						</span>
						<span className="font-mono text-xs font-bold text-primary">
							฿{Number(activeOrderRequest.total_amount || 0).toFixed(2)}
						</span>
					</div>

					<div className="divide-y divide-base-200 text-xs">
						{activeOrderRequest.items?.map((item, idx) => {
							const needsCheck = Boolean(item.requires_stock_check);
							return (
								<div
									key={item.cart_id || idx}
									className="py-2.5 flex items-start justify-between gap-2">
									<div className="min-w-0 flex-1 space-y-0.5">
										<div className="font-bold text-base-content leading-tight flex items-center gap-1.5">
											<span>
												{item.quantity}x {item.name_english || item.name_burmese}
											</span>
											{needsCheck && (
												<span className="badge badge-warning text-[9px] font-extrabold px-1.5 py-0">
													Checking Stock
												</span>
											)}
										</div>
										{item.notes && (
											<div className="text-[11px] text-primary/80 font-medium">
												📝 {item.notes}
											</div>
										)}
									</div>
									<span className="font-mono font-semibold text-base-content/80 shrink-0">
										฿{((Number(item.final_price) || Number(item.price) || 0) * (item.quantity || 1)).toFixed(2)}
									</span>
								</div>
							);
						})}
					</div>
				</div>
			</div>

			{/* Cancel Request Confirmation Modal */}
			{showCancelConfirm && (
				<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
					<div className="bg-base-100 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-base-200 space-y-4 animate-scaleUp">
						<div className="flex items-start gap-3">
							<div className="w-10 h-10 rounded-xl bg-error/15 text-error flex items-center justify-center shrink-0 mt-0.5">
								<AlertTriangle className="w-5 h-5" />
							</div>
							<div className="min-w-0 flex-1">
								<h3 className="font-extrabold text-sm text-base-content">
									Cancel this Order Request?
								</h3>
								<p className="text-xs text-base-content/60 font-mono mt-0.5">
									#{activeOrderRequest.request_number}
								</p>
							</div>
						</div>

						<p className="text-xs text-base-content/70 leading-relaxed">
							This will notify the kitchen to stop checking stock. Your selected items will remain in your cart so you can modify your order.
						</p>

						<div className="flex gap-2 pt-2 border-t border-base-200">
							<button
								type="button"
								disabled={isCancelling}
								className="btn btn-ghost btn-sm flex-1 rounded-xl text-xs font-bold"
								onClick={() => setShowCancelConfirm(false)}>
								Keep Waiting
							</button>
							<button
								type="button"
								disabled={isCancelling}
								className="btn btn-error btn-sm flex-1 rounded-xl text-xs font-bold text-white shadow-md"
								onClick={handleCancelRequest}>
								{isCancelling ? (
									<div className="flex items-center gap-1.5">
										<span className="loading loading-spinner loading-xs"></span>
										<span>Cancelling...</span>
									</div>
								) : (
									"Yes, Cancel"
								)}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default StockCheckSection;
