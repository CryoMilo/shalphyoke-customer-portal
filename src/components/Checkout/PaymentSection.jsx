import { useState } from "react";
import {
	ArrowLeft,
	Building,
	User,
	Phone,
	CheckCircle2,
	Upload,
	Copy,
	Check,
	QrCode,
	Smartphone,
	Banknote,
	AlertCircle,
	ShoppingBag,
} from "lucide-react";
import { useOrderFlowStore } from "../../stores/useOrderFlowStore";
import { useCartStore } from "../../stores/useCartStore";
import { orderRequestAPI } from "../../api/orderRequests";
import { notifyPaymentSubmitted } from "../../api/telegram";
import { PAYMENT_CONFIG } from "../../utils/paymentConfig";
import OrderStepper from "../Shared/OrderStepper";
import toast from "react-hot-toast";

const PaymentSection = () => {
	const {
		activeOrderRequest,
		updateActiveOrderRequest,
		setStep,
	} = useOrderFlowStore();

	const { clearCart } = useCartStore();

	const [paymentType, setPaymentType] = useState("promptpay"); // 'promptpay' | 'truemoney' | 'cod'
	const [slipFile, setSlipFile] = useState(null);
	const [slipPreviewUrl, setSlipPreviewUrl] = useState(null);
	const [copied, setCopied] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	if (!activeOrderRequest) {
		return (
			<div className="max-w-md mx-auto text-center py-12 space-y-4">
				<AlertCircle className="w-12 h-12 text-warning mx-auto" />
				<h3 className="font-extrabold text-base">No active order request</h3>
				<button className="btn btn-primary btn-sm" onClick={() => setStep("menu")}>
					Return to Menu
				</button>
			</div>
		);
	}

	const grandTotal = Number(activeOrderRequest.total_amount || 0);

	// Active payment config
	const activePaymentConfig =
		paymentType === "truemoney" ? PAYMENT_CONFIG.trueMoney : PAYMENT_CONFIG.bank;
	const accountNo =
		paymentType === "truemoney"
			? PAYMENT_CONFIG.trueMoney.phoneNumber
			: PAYMENT_CONFIG.bank.accountNumber;

	// Copy account number
	const handleCopy = (text) => {
		navigator.clipboard.writeText(text);
		setCopied(true);
		toast.success("Copied to clipboard!");
		setTimeout(() => setCopied(false), 2000);
	};

	// Handle slip file upload
	const handleSlipSelect = (e) => {
		const file = e.target.files?.[0];
		if (file) {
			if (!file.type.startsWith("image/")) {
				toast.error("Please upload an image file (JPG, PNG, WebP)");
				return;
			}
			setSlipFile(file);
			setSlipPreviewUrl(URL.createObjectURL(file));
		}
	};

	// Final Submit Payment (Phase 2)
	const handleSubmitPayment = async () => {
		// If PromptPay or TrueMoney, slip upload is required
		if (paymentType !== "cod" && !slipFile) {
			toast.error("Please upload your payment transfer slip");
			return;
		}

		setIsSubmitting(true);
		const toastId = toast.loading("Confirming your payment & order...");

		try {
			let uploadedSlipUrl = null;

			// 1. Upload payment slip if provided
			if (slipFile) {
				uploadedSlipUrl = await orderRequestAPI.uploadPaymentSlip(
					activeOrderRequest.id,
					slipFile
				);
			}

			// 2. Submit payment update to order_requests
			const updatedRequest = await orderRequestAPI.submitPayment(
				activeOrderRequest.id,
				{
					paymentType: paymentType,
					paymentSlipUrl: uploadedSlipUrl,
				}
			);

			updateActiveOrderRequest(updatedRequest);

			// 3. Notify Staff via Telegram in background
			notifyPaymentSubmitted(updatedRequest).catch((err) =>
				console.error("Telegram notification error:", err)
			);

			// 4. Clear cart & transition to waiting screen
			clearCart();
			toast.success("Order & Payment submitted successfully! 🎉", { id: toastId });
			setStep("waiting");
		} catch (error) {
			console.error("Payment submit error:", error);
			toast.error("Failed to submit payment. Please try again.", { id: toastId });
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="max-w-md mx-auto space-y-4 pb-16 animate-fadeIn">
			{/* Mobile App Bar */}
			<div className="flex items-center justify-between py-2 border-b border-base-200">
				<button
					className="btn btn-sm btn-ghost gap-1.5 font-bold -ml-2 text-base-content/70 hover:text-primary"
					onClick={() => setStep("contact")}>
					<ArrowLeft className="w-4 h-4" />
					Back
				</button>
				<h2 className="text-base font-extrabold text-base-content">
					Checkout &amp; Payment
				</h2>
				<div className="w-8"></div>
			</div>

			{/* Stepped Progress Line */}
			<div className="bg-base-100 border border-base-200 rounded-2xl p-3 shadow-sm">
				<OrderStepper currentStep={4} />
			</div>

			{/* Stock Confirmed Alert Badge */}
			<div className="p-3 rounded-2xl bg-success/15 border border-success/30 flex items-center gap-2.5 text-xs text-success font-extrabold shadow-xs">
				<CheckCircle2 className="w-4 h-4 shrink-0" />
				<span>Kitchen has verified your items. Please complete payment below!</span>
			</div>

			{/* 1. Destination & Customer Recap */}
			<div className="card bg-base-100 shadow-sm border border-base-200 rounded-2xl">
				<div className="card-body p-4 space-y-2">
					<span className="text-xs font-bold uppercase tracking-wider text-base-content/60 flex items-center gap-1.5">
						<Building className="w-3.5 h-3.5 text-primary" />
						Delivery To
					</span>

					<div className="bg-base-200/50 p-3 rounded-xl border border-base-200 text-xs space-y-1.5">
						<div className="font-extrabold text-base-content">
							{activeOrderRequest.delivery_address}
						</div>
						<div className="flex justify-between items-center pt-1 border-t border-base-300/40 text-[11px] text-base-content/70">
							<span className="flex items-center gap-1">
								<User className="w-3 h-3 text-primary" />
								{activeOrderRequest.customer_name}
							</span>
							<span className="flex items-center gap-1 font-mono font-semibold">
								<Phone className="w-3 h-3 text-primary" />
								{activeOrderRequest.customer_phone}
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* 2. Payment Method Selector */}
			<div className="card bg-base-100 shadow-sm border border-base-200 rounded-2xl">
				<div className="card-body p-4 space-y-3">
					<label className="text-xs font-bold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
						<Banknote className="w-3.5 h-3.5 text-primary" />
						Select Payment Method
					</label>

					<div className="grid grid-cols-3 gap-2">
						{/* PromptPay */}
						<button
							type="button"
							className={`p-2.5 rounded-xl border-2 flex flex-col items-center gap-1 text-center transition-all ${
								paymentType === "promptpay"
									? "border-primary bg-primary/10 text-primary font-bold shadow-xs scale-102"
									: "border-base-200 hover:border-base-300 text-base-content/70"
							}`}
							onClick={() => setPaymentType("promptpay")}>
							<QrCode className="w-5 h-5" />
							<span className="text-xs leading-tight">PromptPay</span>
						</button>

						{/* TrueMoney */}
						<button
							type="button"
							className={`p-2.5 rounded-xl border-2 flex flex-col items-center gap-1 text-center transition-all ${
								paymentType === "truemoney"
									? "border-primary bg-primary/10 text-primary font-bold shadow-xs scale-102"
									: "border-base-200 hover:border-base-300 text-base-content/70"
							}`}
							onClick={() => setPaymentType("truemoney")}>
							<Smartphone className="w-5 h-5" />
							<span className="text-xs leading-tight">TrueMoney</span>
						</button>

						{/* COD */}
						<button
							type="button"
							className={`p-2.5 rounded-xl border-2 flex flex-col items-center gap-1 text-center transition-all ${
								paymentType === "cod"
									? "border-primary bg-primary/10 text-primary font-bold shadow-xs scale-102"
									: "border-base-200 hover:border-base-300 text-base-content/70"
							}`}
							onClick={() => setPaymentType("cod")}>
							<Banknote className="w-5 h-5" />
							<span className="text-xs leading-tight">Cash on Deliv.</span>
						</button>
					</div>

					{/* Bank QR / TrueMoney Payment Details */}
					{paymentType !== "cod" ? (
						<div className="mt-3 p-3.5 bg-base-200/50 rounded-xl border border-base-200 space-y-3">
							<div className="text-center space-y-2">
								<span className="badge badge-primary badge-outline text-[11px] font-bold">
									{paymentType === "promptpay" ? "Scan Bank QR" : "TrueMoney QR"}
								</span>

								{/* QR Image */}
								<div className="w-48 h-48 mx-auto bg-white p-2 rounded-xl border border-base-300 shadow-sm flex items-center justify-center">
									<img
										src={activePaymentConfig.qrImage}
										alt="Payment QR Code"
										className="w-full h-full object-contain"
									/>
								</div>
								<p className="text-[11px] text-base-content/60">
									Scan with banking app or save QR to pay
								</p>
							</div>

							{/* Account Details & Copy */}
							<div className="bg-base-100 p-2.5 rounded-lg border border-base-200 space-y-1 text-xs">
								<div className="flex justify-between items-center text-base-content/70">
									<span>Account Name:</span>
									<span className="font-semibold text-base-content">
										{activePaymentConfig.accountName}
									</span>
								</div>
								<div className="flex justify-between items-center pt-1 border-t border-base-200">
									<span className="text-base-content/70">
										{paymentType === "truemoney" ? "Phone No:" : "Account No:"}
									</span>
									<div className="flex items-center gap-1 font-mono font-bold text-base-content">
										<span>{accountNo}</span>
										<button
											type="button"
											className="btn btn-ghost btn-xs btn-square"
											onClick={() => handleCopy(accountNo)}
											title="Copy Number">
											{copied ? (
												<Check className="w-3.5 h-3.5 text-success" />
											) : (
												<Copy className="w-3.5 h-3.5" />
											)}
										</button>
									</div>
								</div>
							</div>

							{/* Slip File Upload */}
							<div className="space-y-1.5 pt-1">
								<label className="text-xs font-bold text-base-content flex items-center gap-1">
									<Upload className="w-3.5 h-3.5 text-primary" />
									Attach Transfer Slip *
								</label>

								{slipPreviewUrl ? (
									<div className="relative rounded-xl overflow-hidden border-2 border-primary/30 bg-base-100 p-2 flex items-center gap-3">
										<img
											src={slipPreviewUrl}
											alt="Slip Preview"
											className="w-16 h-16 object-cover rounded-lg"
										/>
										<div className="flex-1 min-w-0">
											<span className="text-xs font-bold text-success flex items-center gap-1">
												<CheckCircle2 className="w-3.5 h-3.5" /> Slip Attached
											</span>
											<p className="text-[11px] text-base-content/50 truncate">
												{slipFile?.name}
											</p>
											<label className="text-[11px] text-primary font-semibold hover:underline cursor-pointer">
												Change Slip
												<input
													type="file"
													accept="image/*"
													className="hidden"
													onChange={handleSlipSelect}
												/>
											</label>
										</div>
									</div>
								) : (
									<label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-base-300 hover:border-primary rounded-xl cursor-pointer bg-base-200/40 hover:bg-base-200/70 transition-colors">
										<Upload className="w-6 h-6 text-primary/60 mb-1" />
										<span className="text-xs font-bold text-base-content">
											Tap to upload transfer slip screenshot
										</span>
										<span className="text-[10px] text-base-content/50">
											JPG, PNG, WebP from banking app
										</span>
										<input
											type="file"
											accept="image/*"
											className="hidden"
											onChange={handleSlipSelect}
										/>
									</label>
								)}
							</div>
						</div>
					) : (
						/* COD Notice */
						<div className="bg-success/10 border border-success/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-base-content/80">
							<AlertCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
							<div>
								<div className="font-bold text-success">Cash on Delivery (COD)</div>
								<p className="text-[11px] text-base-content/70 mt-0.5">
									Please prepare exact cash of <strong>฿{grandTotal.toFixed(2)}</strong> for the rider upon arrival.
								</p>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* 3. Items Summary */}
			<div className="card bg-base-100 shadow-sm border border-base-200 rounded-2xl">
				<div className="card-body p-4 space-y-2.5">
					<span className="text-xs font-bold uppercase tracking-wider text-base-content/60 flex items-center gap-1.5">
						<ShoppingBag className="w-3.5 h-3.5 text-primary" />
						Order Items ({activeOrderRequest.items?.length || 0})
					</span>

					<div className="divide-y divide-base-200 text-xs">
						{activeOrderRequest.items?.map((item, idx) => (
							<div
								key={item.cart_id || idx}
								className="py-2 flex justify-between items-start gap-2">
								<div className="min-w-0 flex-1">
									<div className="font-bold text-base-content">
										{item.quantity}x {item.name_english || item.name_burmese}
									</div>
									{item.notes && (
										<div className="text-[11px] text-primary/80 font-medium">
											📝 {item.notes}
										</div>
									)}
								</div>
								<span className="font-mono font-bold text-base-content shrink-0">
									฿{((Number(item.final_price) || Number(item.price) || 0) * (item.quantity || 1)).toFixed(2)}
								</span>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* 4. Total & Submit Button */}
			<div className="card bg-base-100 shadow-sm border border-base-200 rounded-2xl">
				<div className="card-body p-4 space-y-2.5">
					<div className="space-y-1.5 text-xs">
						<div className="flex justify-between text-base-content/70">
							<span>Food Subtotal</span>
							<span className="font-semibold font-mono">
								฿{Number(activeOrderRequest.subtotal || 0).toFixed(2)}
							</span>
						</div>
						<div className="flex justify-between text-base-content/70">
							<span>Apartment Delivery Fee</span>
							<span className="font-semibold font-mono text-primary">
								฿{Number(activeOrderRequest.delivery_fee || 0).toFixed(2)}
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
						className="btn btn-primary w-full shadow-lg font-bold text-primary-content rounded-xl mt-2"
						disabled={isSubmitting || (paymentType !== "cod" && !slipFile)}
						onClick={handleSubmitPayment}>
						{isSubmitting ? (
							<div className="flex items-center gap-2">
								<span className="loading loading-spinner loading-xs"></span>
								<span>Confirming Payment...</span>
							</div>
						) : (
							`Confirm Payment & Order • ฿${grandTotal.toFixed(2)}`
						)}
					</button>
				</div>
			</div>
		</div>
	);
};

export default PaymentSection;
