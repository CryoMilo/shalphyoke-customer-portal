import { useState } from "react";
import { X, Copy, Check, Upload, ArrowRight, ShieldCheck, Smartphone } from "lucide-react";
import toast from "react-hot-toast";
import { PAYMENT_CONFIG } from "../../utils/paymentConfig";
import { orderAPI } from "../../api/orders";

const PaymentModal = ({ isOpen, onClose, order, onPaymentSubmitted }) => {
	const [activeTab, setActiveTab] = useState("bank"); // "bank" | "truemoney"
	const [copied, setCopied] = useState(false);
	const [selectedFile, setSelectedFile] = useState(null);
	const [previewUrl, setPreviewUrl] = useState(null);
	const [isUploading, setIsUploading] = useState(false);

	if (!isOpen || !order) return null;

	const paymentInfo =
		activeTab === "bank" ? PAYMENT_CONFIG.bank : PAYMENT_CONFIG.trueMoney;
	const accountNo =
		activeTab === "bank"
			? PAYMENT_CONFIG.bank.accountNumber
			: PAYMENT_CONFIG.trueMoney.phoneNumber;

	const handleCopy = (text) => {
		navigator.clipboard.writeText(text);
		setCopied(true);
		toast.success("Account number copied!");
		setTimeout(() => setCopied(false), 2000);
	};

	const handleFileSelect = (e) => {
		const file = e.target.files?.[0];
		if (file) {
			if (!file.type.startsWith("image/")) {
				toast.error("Please upload an image file (JPG, PNG, WebP)");
				return;
			}
			setSelectedFile(file);
			setPreviewUrl(URL.createObjectURL(file));
		}
	};

	const handleUploadSlip = async () => {
		if (!selectedFile) {
			toast.error("Please select a payment slip screenshot first");
			return;
		}

		setIsUploading(true);
		const toastId = toast.loading("Uploading payment slip...");

		try {
			await orderAPI.uploadPaymentSlip(order.id, selectedFile);
			toast.success("Payment slip uploaded! Awaiting staff verification 🎉", {
				id: toastId,
			});
			if (onPaymentSubmitted) {
				onPaymentSubmitted();
			}
			onClose();
		} catch (error) {
			console.error("Slip upload error:", error);
			toast.error(
				"Failed to upload slip. You can also send the slip via LINE.",
				{ id: toastId }
			);
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
			<div className="bg-base-100 rounded-2xl max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-base-300">
				{/* Modal Header */}
				<div className="sticky top-0 bg-base-100 p-4 border-b border-base-200 flex items-center justify-between z-10">
					<div>
						<h3 className="font-bold text-lg flex items-center gap-2 text-base-content">
							<ShieldCheck className="w-5 h-5 text-success" />
							Payment & Slip Upload
						</h3>
						<p className="text-xs text-base-content/60">
							Order #{order.order_number}
						</p>
					</div>
					<button
						className="btn btn-sm btn-circle btn-ghost"
						onClick={onClose}
						disabled={isUploading}>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="p-5 space-y-4">
					{/* Total Due Banner */}
					<div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
						<span className="text-xs font-semibold uppercase tracking-wider text-primary">
							Total Amount to Transfer
						</span>
						<div className="text-3xl font-extrabold text-primary mt-1">
							฿{Number(order.total_amount || 0).toFixed(2)}
						</div>
						<div className="text-xs text-base-content/60 mt-1">
							Includes food + ฿{order.delivery_fee || 0} apartment delivery
						</div>
					</div>

					{/* Payment Method Switcher */}
					<div className="grid grid-cols-2 gap-2 bg-base-200 p-1 rounded-xl">
						<button
							className={`btn btn-sm border-none font-semibold ${
								activeTab === "bank"
									? "bg-base-100 shadow-sm text-primary"
									: "btn-ghost text-base-content/70"
							}`}
							onClick={() => setActiveTab("bank")}>
							🏦 Bank Transfer
						</button>
						<button
							className={`btn btn-sm border-none font-semibold ${
								activeTab === "truemoney"
									? "bg-base-100 shadow-sm text-warning"
									: "btn-ghost text-base-content/70"
							}`}
							onClick={() => setActiveTab("truemoney")}>
							<Smartphone className="w-4 h-4 mr-1" />
							TrueMoney
						</button>
					</div>

					{/* Account Details Box */}
					<div className="bg-base-200/60 border border-base-200 rounded-xl p-4 space-y-3">
						<div className="flex justify-between items-center text-sm">
							<span className="text-base-content/60">Provider / Bank:</span>
							<span className="font-semibold text-base-content">
								{paymentInfo.name}
							</span>
						</div>
						<div className="flex justify-between items-center text-sm">
							<span className="text-base-content/60">Account Name:</span>
							<span className="font-semibold text-base-content">
								{paymentInfo.accountName}
							</span>
						</div>
						<div className="flex justify-between items-center bg-base-100 p-2.5 rounded-lg border border-base-300">
							<div>
								<div className="text-xs text-base-content/50">
									{activeTab === "bank" ? "Account Number" : "Phone Number"}
								</div>
								<div className="font-mono font-bold text-base text-primary">
									{accountNo}
								</div>
							</div>
							<button
								className="btn btn-xs btn-outline btn-primary gap-1"
								onClick={() => handleCopy(accountNo.replace(/-/g, ""))}>
								{copied ? (
									<>
										<Check className="w-3.5 h-3.5 text-success" />
										Copied
									</>
								) : (
									<>
										<Copy className="w-3.5 h-3.5" />
										Copy
									</>
								)}
							</button>
						</div>
					</div>

					{/* QR Code Display */}
					<div className="bg-white p-4 rounded-xl border border-base-300 flex flex-col items-center justify-center text-center">
						<div className="w-44 h-44 bg-gray-50 rounded-lg flex items-center justify-center border border-dashed border-gray-300 overflow-hidden relative">
							{paymentInfo.qrImage ? (
								<img
									src={paymentInfo.qrImage}
									alt={`${paymentInfo.name} QR Code`}
									className="w-full h-full object-contain"
									onError={(e) => {
										// If image not found, show clean styled placeholder
										e.currentTarget.style.display = "none";
										const fallback = document.getElementById("qr-fallback");
										if (fallback) fallback.style.display = "flex";
									}}
								/>
							) : null}
							<div
								id="qr-fallback"
								className="hidden flex-col items-center justify-center p-3 text-center">
								<div className="text-3xl mb-1">📱</div>
								<div className="text-xs font-bold text-gray-700">Scan to Pay</div>
								<div className="text-[10px] text-gray-500">
									Use {paymentInfo.name} App
								</div>
							</div>
						</div>
						<p className="text-xs text-gray-500 mt-2">
							Scan QR or transfer directly to the account above
						</p>
					</div>

					{/* Slip Upload Section */}
					<div className="space-y-2 pt-2 border-t border-base-200">
						<label className="block text-sm font-semibold text-base-content">
							Attach Payment Slip / Screenshot
						</label>

						{previewUrl ? (
							<div className="relative rounded-xl overflow-hidden border border-success/40 bg-success/5 p-2 flex items-center gap-3">
								<img
									src={previewUrl}
									alt="Slip Preview"
									className="w-16 h-20 object-cover rounded-lg border border-base-300"
								/>
								<div className="flex-1 min-w-0">
									<p className="text-xs font-bold text-success flex items-center gap-1">
										<Check className="w-4 h-4" /> Slip Selected
									</p>
									<p className="text-xs text-base-content/60 truncate mt-0.5">
										{selectedFile?.name}
									</p>
									<label
										htmlFor="slip-reupload"
										className="text-xs text-primary underline cursor-pointer inline-block mt-1">
										Change Image
									</label>
									<input
										id="slip-reupload"
										type="file"
										accept="image/*"
										className="hidden"
										onChange={handleFileSelect}
									/>
								</div>
							</div>
						) : (
							<label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-base-300 hover:border-primary rounded-xl cursor-pointer bg-base-200/30 hover:bg-base-200/60 transition-colors">
								<Upload className="w-8 h-8 text-primary/60 mb-1 animate-bounce" />
								<span className="text-xs font-bold text-base-content">
									Tap to upload bank transfer slip
								</span>
								<span className="text-[11px] text-base-content/50 mt-0.5">
									PNG, JPG, WebP from banking app
								</span>
								<input
									type="file"
									accept="image/*"
									className="hidden"
									onChange={handleFileSelect}
								/>
							</label>
						)}
					</div>
				</div>

				{/* Modal Footer */}
				<div className="p-4 border-t border-base-200 bg-base-200/30 flex gap-2">
					<button
						className="btn btn-ghost flex-1 text-xs"
						onClick={onClose}
						disabled={isUploading}>
						Upload Later
					</button>
					<button
						className="btn btn-primary flex-1 font-bold gap-2 text-primary-content"
						onClick={handleUploadSlip}
						disabled={!selectedFile || isUploading}>
						{isUploading ? (
							<>
								<span className="loading loading-spinner loading-xs"></span>
								Uploading...
							</>
						) : (
							<>
								Confirm & Submit Slip
								<ArrowRight className="w-4 h-4" />
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	);
};

export default PaymentModal;
