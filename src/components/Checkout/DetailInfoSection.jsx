import { useState, useRef, useEffect } from "react";
import {
	ArrowLeft,
	MapPin,
	Building,
	Phone,
	User,
	Search,
	CheckCircle2,
	Upload,
	Copy,
	Check,
	Sparkles,
	AlertCircle,
	Banknote,
	Smartphone,
	QrCode,
} from "lucide-react";
import { useOrderFlowStore } from "../../stores/useOrderFlowStore";
import { useCartStore } from "../../stores/useCartStore";
import { customerAPI } from "../../api/customers";
import { orderAPI } from "../../api/orders";
import { PAYMENT_CONFIG } from "../../utils/paymentConfig";
import { formatDeliveryAddress, formatBuildingInfo } from "../../utils/deliveryLocations";
import toast from "react-hot-toast";

const DetailInfoSection = () => {
	const {
		selectedLocation,
		customerInfo,
		setCustomerInfo,
		setStep,
		setCurrentOrder,
	} = useOrderFlowStore();

	const { cart, clearCart } = useCartStore();

	// Local states for checkout form
	const [name, setName] = useState(customerInfo.name || "");
	const [customerId, setCustomerId] = useState(customerInfo.customerId || null);
	const [phone, setPhone] = useState(customerInfo.phone || "");
	const [paymentType, setPaymentType] = useState("promptpay"); // 'promptpay' | 'truemoney' | 'cod'
	const [notes, setNotes] = useState(customerInfo.notes || "");

	// Slip upload states
	const [slipFile, setSlipFile] = useState(null);
	const [slipPreviewUrl, setSlipPreviewUrl] = useState(null);
	const [copied, setCopied] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Customer autocomplete states
	const [searchResults, setSearchResults] = useState([]);
	const [isSearching, setIsSearching] = useState(false);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const searchTimeoutRef = useRef(null);
	const nameContainerRef = useRef(null);

	// Calculate totals
	const subtotal = cart.reduce(
		(sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1),
		0
	);
	const deliveryFee = Number(selectedLocation.fee) || 0;
	const totalAmount = subtotal + deliveryFee;

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
		toast.success("Account number copied!");
		setTimeout(() => setCopied(false), 2000);
	};

	// Handle name typing & autocomplete lookup
	const handleNameChange = (val) => {
		setName(val);
		setCustomerInfo({ name: val });

		if (searchTimeoutRef.current) {
			clearTimeout(searchTimeoutRef.current);
		}

		const query = val.trim();
		if (query.length >= 1) {
			setIsSearching(true);
			searchTimeoutRef.current = setTimeout(async () => {
				try {
					const results = await customerAPI.search(query);
					setSearchResults(results);
					setShowSuggestions(results.length > 0);
				} catch (err) {
					console.error("Search customer error:", err);
				} finally {
					setIsSearching(false);
				}
			}, 250);
		} else {
			setSearchResults([]);
			setShowSuggestions(false);
			setIsSearching(false);
		}
	};

	// When customer selects a profile from suggestions:
	// Only auto-fill the name (and phone if empty), keep selected address/building info!
	const handleSelectCustomer = (cust) => {
		setCustomerId(cust.id);
		setName(cust.name);
		if (cust.phone && !phone) {
			setPhone(cust.phone);
		}
		setCustomerInfo({
			customerId: cust.id,
			name: cust.name,
			phone: cust.phone || phone,
		});

		setShowSuggestions(false);
		setSearchResults([]);

		toast.success(`Customer linked: ${cust.name}`, {
			icon: "👤",
			duration: 2000,
		});
	};

	// Close autocomplete on click outside
	useEffect(() => {
		const handleClickOutside = (e) => {
			if (nameContainerRef.current && !nameContainerRef.current.contains(e.target)) {
				setShowSuggestions(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Slip file selection
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

	// Handle final order submit
	const handleSubmitOrder = async () => {
		const trimmedName = name.trim();
		if (!trimmedName) {
			toast.error("Please enter your name");
			return;
		}

		// Phone validation strictly if COD
		if (paymentType === "cod") {
			const cleanPhone = phone.replace(/\D/g, "");
			if (!cleanPhone || cleanPhone.length < 9) {
				toast.error("Please provide a valid phone number for Cash on Delivery");
				return;
			}
		}

		// If PromptPay or TrueMoney, recommend/require slip upload
		if (paymentType !== "cod" && !slipFile) {
			toast.error("Please attach your payment transfer slip");
			return;
		}

		setIsSubmitting(true);
		const toastId = toast.loading("Submitting your order...");

		try {
			let uploadedSlipUrl = null;

			// 1. Upload slip if provided
			if (slipFile) {
				const tempId = `order_${crypto.randomUUID()}`;
				uploadedSlipUrl = await orderAPI.uploadPaymentSlip(tempId, slipFile);
			}

			// Clean building info: e.g. "Building A"
			const cleanBuilding = formatBuildingInfo({
				building: selectedLocation.building,
			});

			// Clean formatted address: e.g. "Rye (Building A)"
			const fullDeliveryAddress = formatDeliveryAddress({
				apartment: selectedLocation.apartmentName,
				building: selectedLocation.building,
				dropoffNote: notes,
			});

			// 2. Insert delivery order
			const orderPayload = {
				customerId: customerId || null,
				customerName: trimmedName,
				customerPhone: phone.trim() || null,
				deliveryAddress: fullDeliveryAddress,
				cleanAddress: selectedLocation.apartmentName, // Normalized clean address to update customer
				cleanBuildingInfo: cleanBuilding, // Normalized clean building_info to update customer
				deliveryFee: deliveryFee,
				items: cart,
				subtotal: subtotal,
				totalAmount: totalAmount,
				paymentType: paymentType, // 'promptpay' | 'truemoney' | 'cod'
				paymentSlipUrl: uploadedSlipUrl,
				notes: notes.trim() || null,
			};

			const createdOrder = await orderAPI.createDeliveryOrder(orderPayload);

			// 3. Clear cart & transition to Waiting for Admin Approval UI
			clearCart();
			setCurrentOrder(createdOrder);
			setStep("waiting");

			toast.success("Order submitted successfully! 🎉", { id: toastId });
		} catch (error) {
			console.error("Order submit error:", error);
			toast.error("Failed to submit order. Please try again or call shop.", {
				id: toastId,
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="max-w-md mx-auto space-y-4 pb-16 animate-fadeIn">
			{/* Mobile App Bar */}
			<div className="flex items-center justify-between py-2 border-b border-base-200">
				<button
					className="btn btn-sm btn-ghost gap-1.5 font-bold -ml-2"
					onClick={() => setStep("menu")}>
					<ArrowLeft className="w-4 h-4" />
					Back to Menu
				</button>
				<h2 className="text-base font-extrabold text-base-content">
					Checkout &amp; Payment
				</h2>
				<div className="w-8"></div>
			</div>

			{/* 1. Chosen Location Card */}
			<div className="card bg-base-100 shadow-sm border border-base-200 rounded-2xl">
				<div className="card-body p-4 space-y-2">
					<div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-base-content/60">
						<span className="flex items-center gap-1.5">
							<MapPin className="w-3.5 h-3.5 text-primary" />
							Delivery Destination
						</span>
						<button
							className="text-primary hover:underline text-[11px] normal-case"
							onClick={() => setStep("location")}>
							Change
						</button>
					</div>

					<div className="bg-base-200/50 p-3 rounded-xl border border-base-200 text-xs space-y-1">
						<div className="font-extrabold text-sm text-base-content flex items-center gap-1.5">
							<Building className="w-4 h-4 text-primary shrink-0" />
							<span>
								{selectedLocation.apartmentName}
								{selectedLocation.building && ` - ${selectedLocation.building}`}
							</span>
						</div>
						<div className="text-primary font-semibold pl-5 text-[11px]">
							Delivery fee: ฿{deliveryFee}
						</div>
					</div>
				</div>
			</div>

			{/* 2. Customer Name with Autocomplete */}
			<div className="card bg-base-100 shadow-sm border border-base-200 rounded-2xl">
				<div className="card-body p-4 space-y-3" ref={nameContainerRef}>
					<div className="flex items-center justify-between">
						<label className="text-xs font-bold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
							<User className="w-3.5 h-3.5 text-primary" />
							Customer Name *
						</label>
						{customerId && (
							<span className="badge badge-success badge-xs text-white gap-1 font-semibold">
								<CheckCircle2 className="w-3 h-3" /> Customer Linked
							</span>
						)}
					</div>

					<div className="relative">
						<input
							type="text"
							placeholder="Type your name..."
							className="input input-bordered input-sm w-full font-medium"
							value={name}
							onChange={(e) => handleNameChange(e.target.value)}
							onFocus={() => {
								if (searchResults.length > 0) setShowSuggestions(true);
							}}
							autoComplete="off"
						/>
						<div className="absolute right-2.5 top-2 text-base-content/40">
							{isSearching ? (
								<span className="loading loading-spinner loading-xs text-primary" />
							) : (
								<Search className="w-4 h-4" />
							)}
						</div>

						{/* Autocomplete Dropdown */}
						{showSuggestions && searchResults.length > 0 && (
							<div className="absolute left-0 right-0 mt-1 bg-base-100 border border-base-300 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-base-200 animate-fadeIn max-h-48 overflow-y-auto">
								<div className="bg-base-200/60 px-3 py-1.5 text-[10px] font-semibold text-base-content/60 flex items-center gap-1">
									<Sparkles className="w-3 h-3 text-primary" />
									Select your name to link profile:
								</div>
								{searchResults.map((cust) => (
									<button
										key={cust.id}
										type="button"
										className="w-full text-left px-3 py-2 hover:bg-primary/5 transition-colors flex items-center justify-between text-xs"
										onClick={() => handleSelectCustomer(cust)}>
										<div>
											<span className="font-bold text-base-content">{cust.name}</span>
											{cust.phone && (
												<span className="text-base-content/50 ml-1.5 font-mono text-[11px]">
													({cust.phone})
												</span>
											)}
										</div>
										{cust.total_orders > 0 && (
											<span className="badge badge-ghost badge-xs text-[10px]">
												{cust.total_orders} orders
											</span>
										)}
									</button>
								))}
							</div>
						)}
					</div>

					{/* Phone Number Field */}
					<div>
						<label className="text-xs font-semibold text-base-content/80 flex items-center justify-between pb-1">
							<span className="flex items-center gap-1">
								<Phone className="w-3.5 h-3.5 text-primary" />
								Phone Number
								{paymentType === "cod" ? (
									<span className="text-error font-bold">* (Required for COD)</span>
								) : (
									<span className="text-base-content/50 font-normal">(Optional)</span>
								)}
							</span>
						</label>
						<input
							type="tel"
							placeholder="08X-XXX-XXXX"
							className={`input input-bordered input-sm w-full font-medium ${
								paymentType === "cod" && !phone ? "border-warning" : ""
							}`}
							value={phone}
							onChange={(e) => {
								setPhone(e.target.value);
								setCustomerInfo({ phone: e.target.value });
							}}
						/>
					</div>

					{/* Special instructions */}
					<div>
						<label className="text-xs font-semibold text-base-content/80 pb-1 block">
							Special Instructions / Notes (Optional)
						</label>
						<textarea
							placeholder="e.g. Leave with lobby security / Call on arrival"
							className="textarea textarea-bordered textarea-xs w-full"
							rows="2"
							value={notes}
							onChange={(e) => {
								setNotes(e.target.value);
								setCustomerInfo({ notes: e.target.value });
							}}
						/>
					</div>
				</div>
			</div>

			{/* 3. Payment Type Selection */}
			<div className="card bg-base-100 shadow-sm border border-base-200 rounded-2xl">
				<div className="card-body p-4 space-y-3">
					<label className="text-xs font-bold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
						<QrCode className="w-3.5 h-3.5 text-primary" />
						Select Payment Type
					</label>

					<div className="grid grid-cols-3 gap-2">
						{/* PromptPay */}
						<button
							type="button"
							className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
								paymentType === "promptpay"
									? "border-primary bg-primary/10 text-primary font-bold shadow-sm ring-1 ring-primary"
									: "border-base-200 hover:border-base-300 bg-base-200/40 text-base-content/70"
							}`}
							onClick={() => setPaymentType("promptpay")}>
							<QrCode className="w-5 h-5" />
							<span className="text-xs">PromptPay</span>
						</button>

						{/* TrueMoney */}
						<button
							type="button"
							className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
								paymentType === "truemoney"
									? "border-warning bg-warning/10 text-warning font-bold shadow-sm ring-1 ring-warning"
									: "border-base-200 hover:border-base-300 bg-base-200/40 text-base-content/70"
							}`}
							onClick={() => setPaymentType("truemoney")}>
							<Smartphone className="w-5 h-5" />
							<span className="text-xs">TrueMoney</span>
						</button>

						{/* COD */}
						<button
							type="button"
							className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
								paymentType === "cod"
									? "border-success bg-success/10 text-success font-bold shadow-sm ring-1 ring-success"
									: "border-base-200 hover:border-base-300 bg-base-200/40 text-base-content/70"
							}`}
							onClick={() => setPaymentType("cod")}>
							<Banknote className="w-5 h-5" />
							<span className="text-xs">COD</span>
						</button>
					</div>

					{/* PromptPay / TrueMoney QR & Slip Upload */}
					{paymentType !== "cod" ? (
						<div className="space-y-3 pt-2 border-t border-base-200">
							{/* Account details */}
							<div className="bg-base-200/60 p-3 rounded-xl border border-base-200 space-y-2 text-xs">
								<div className="flex justify-between items-center">
									<span className="text-base-content/60">Provider:</span>
									<span className="font-bold text-base-content">
										{activePaymentConfig.name}
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-base-content/60">Account Name:</span>
									<span className="font-bold text-base-content">
										{activePaymentConfig.accountName}
									</span>
								</div>
								<div className="flex justify-between items-center bg-base-100 p-2 rounded-lg border border-base-300">
									<div>
										<div className="text-[10px] text-base-content/50">
											{paymentType === "truemoney" ? "Phone Number" : "Account Number"}
										</div>
										<div className="font-mono font-bold text-sm text-primary">
											{accountNo}
										</div>
									</div>
									<button
										type="button"
										className="btn btn-xs btn-outline btn-primary gap-1"
										onClick={() => handleCopy(accountNo.replace(/-/g, ""))}>
										{copied ? (
											<>
												<Check className="w-3 h-3 text-success" />
												Copied
											</>
										) : (
											<>
												<Copy className="w-3 h-3" />
												Copy
											</>
										)}
									</button>
								</div>
							</div>

							{/* QR Code image */}
							<div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-base-300">
								<div className="w-36 h-36 bg-gray-50 rounded-lg flex items-center justify-center border border-dashed border-gray-300 overflow-hidden relative">
									{activePaymentConfig.qrImage ? (
										<img
											src={activePaymentConfig.qrImage}
											alt={`${activePaymentConfig.name} QR`}
											className="w-full h-full object-contain"
											onError={(e) => {
												e.currentTarget.style.display = "none";
											}}
										/>
									) : null}
									<div className="absolute flex flex-col items-center justify-center text-gray-400 p-2 text-center pointer-events-none -z-0">
										<QrCode className="w-10 h-10 opacity-30 mb-1" />
										<span className="text-[10px] font-bold text-gray-600">Scan to Pay</span>
									</div>
								</div>
								<p className="text-[11px] text-gray-500 mt-1.5 text-center">
									Transfer <strong>฿{totalAmount.toFixed(2)}</strong> via {activePaymentConfig.name}
								</p>
							</div>

							{/* Slip Upload Area */}
							<div className="space-y-1.5">
								<label className="text-xs font-bold text-base-content flex items-center justify-between">
									<span>Attach Payment Slip *</span>
									{slipFile && (
										<span className="text-success text-[11px] flex items-center gap-1 font-semibold">
											<Check className="w-3 h-3" /> Attached
										</span>
									)}
								</label>

								{slipPreviewUrl ? (
									<div className="p-2 border border-success/40 bg-success/5 rounded-xl flex items-center gap-3">
										<img
											src={slipPreviewUrl}
											alt="Slip Preview"
											className="w-14 h-16 object-cover rounded-lg border border-base-300"
										/>
										<div className="flex-1 min-w-0 text-xs">
											<p className="font-bold text-success truncate">{slipFile?.name}</p>
											<label
												htmlFor="slip-reupload-input"
												className="text-primary underline text-[11px] cursor-pointer inline-block mt-1">
												Change Image
											</label>
											<input
												id="slip-reupload-input"
												type="file"
												accept="image/*"
												className="hidden"
												onChange={handleSlipSelect}
											/>
										</div>
									</div>
								) : (
									<label className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-base-300 hover:border-primary rounded-xl cursor-pointer bg-base-200/30 hover:bg-base-200/60 transition-colors">
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
									Please prepare exact cash of <strong>฿{totalAmount.toFixed(2)}</strong> for the rider upon arrival.
								</p>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* 4. Total & Submit Button */}
			<div className="card bg-base-100 shadow-sm border border-base-200 rounded-2xl">
				<div className="card-body p-4 space-y-2.5">
					<div className="space-y-1.5 text-xs">
						<div className="flex justify-between text-base-content/70">
							<span>Food Subtotal ({cart.length} items)</span>
							<span className="font-semibold font-mono">฿{subtotal.toFixed(2)}</span>
						</div>
						<div className="flex justify-between text-base-content/70">
							<span>Apartment Delivery Fee</span>
							<span className="font-semibold font-mono text-primary">
								฿{deliveryFee.toFixed(2)}
							</span>
						</div>
						<div className="flex justify-between items-center pt-2 border-t border-base-300 font-bold text-sm">
							<span>Total Amount</span>
							<span className="text-lg text-primary font-mono">
								฿{totalAmount.toFixed(2)}
							</span>
						</div>
					</div>

					<button
						className="btn btn-primary w-full shadow-lg font-bold text-primary-content rounded-xl mt-2"
						disabled={
							isSubmitting ||
							!name.trim() ||
							(paymentType === "cod" && !phone.trim()) ||
							(paymentType !== "cod" && !slipFile)
						}
						onClick={handleSubmitOrder}>
						{isSubmitting ? (
							<>
								<span className="loading loading-spinner loading-xs"></span>
								Submitting Order...
							</>
						) : (
							`Place Order • ฿${totalAmount.toFixed(2)}`
						)}
					</button>
				</div>
			</div>
		</div>
	);
};

export default DetailInfoSection;
