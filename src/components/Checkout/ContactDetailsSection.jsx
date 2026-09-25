import { useState, useRef, useEffect } from "react";
import {
	ArrowLeft,
	Building,
	Phone,
	User,
	Search,
	CheckCircle2,
	Sparkles,
	ShoppingBag,
	Clock,
	ArrowRight,
} from "lucide-react";
import { useOrderFlowStore } from "../../stores/useOrderFlowStore";
import { useCartStore } from "../../stores/useCartStore";
import { customerAPI } from "../../api/customers";
import { orderRequestAPI } from "../../api/orderRequests";
import { notifyStockCheckRequired } from "../../api/telegram";
import { formatDeliveryAddress, formatBuildingInfo } from "../../utils/deliveryLocations";
import { getCartTotal } from "../../utils/cartUtils";
import OrderStepper from "../Shared/OrderStepper";
import toast from "react-hot-toast";

const ContactDetailsSection = () => {
	const {
		selectedLocation,
		customerInfo,
		setCustomerInfo,
		setStep,
		activeOrderRequest,
		setActiveOrderRequest,
	} = useOrderFlowStore();

	const { cart, itemNotes, itemExtraPrices } = useCartStore();

	// Local states for contact form
	const [name, setName] = useState(customerInfo.name || "");
	const [customerId, setCustomerId] = useState(customerInfo.customerId || null);
	const [phone, setPhone] = useState(customerInfo.phone || "");
	const [notes, setNotes] = useState(customerInfo.notes || "");
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Customer autocomplete states
	const [searchResults, setSearchResults] = useState([]);
	const [isSearching, setIsSearching] = useState(false);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const searchTimeoutRef = useRef(null);
	const nameContainerRef = useRef(null);

	// Calculate totals
	const subtotal = getCartTotal(cart);
	const deliveryFee = Number(selectedLocation.fee) || 0;
	const totalAmount = subtotal + deliveryFee;

	// Check if any item in cart requires stock check
	const uncertainItems = cart.filter((item) => item.requires_stock_check === true);
	const hasUncertainItems = uncertainItems.length > 0;

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
		toast.success(`Customer linked: ${cust.name}`, { icon: "✨" });
	};

	// Close autocomplete on outside click
	useEffect(() => {
		const handleClickOutside = (e) => {
			if (nameContainerRef.current && !nameContainerRef.current.contains(e.target)) {
				setShowSuggestions(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Handle Order Request Submission (Phase 1)
	const handleSubmitRequest = async () => {
		const trimmedName = name.trim();
		if (!trimmedName) {
			toast.error("Please enter your name");
			return;
		}

		// Phone number is required for all delivery requests
		const cleanPhone = phone.replace(/\D/g, "");
		if (!cleanPhone || cleanPhone.length < 9) {
			toast.error("Please provide a valid phone number (min 9 digits)");
			return;
		}

		setIsSubmitting(true);
		const toastId = toast.loading("Submitting your order request...");

		try {
			// Format clean building & address
			const cleanBuilding = formatBuildingInfo({
				building: selectedLocation.building,
			});

			const fullDeliveryAddress = formatDeliveryAddress({
				apartment: selectedLocation.apartmentName,
				building: selectedLocation.building,
				dropoffNote: notes,
			});

			// Format items adhering to POS normalized schema
			const orderItems = cart.map((item) => {
				const extraPrice = Number(
					item.extra_price !== undefined
						? item.extra_price
						: itemExtraPrices[item.cart_id] || 0
				);
				const finalPrice = Number(
					item.final_price !== undefined
						? item.final_price
						: (Number(item.price) || 0) + extraPrice
				);
				return {
					id: item.id,
					cart_id: item.cart_id,
					name_burmese: item.name_burmese || "",
					name_english: item.name_english || "",
					name_thai: item.name_thai || "",
					price: Number(item.price) || 0,
					quantity: Number(item.quantity) || 1,
					extra_price: extraPrice,
					final_price: finalPrice,
					notes: (item.notes || itemNotes[item.cart_id] || "").trim(),
					requires_stock_check: Boolean(item.requires_stock_check),
				};
			});

			const requestPayload = {
				customerId: customerId || null,
				customerName: trimmedName,
				customerPhone: phone.trim(),
				deliveryAddress: fullDeliveryAddress,
				cleanAddress: selectedLocation.apartmentName,
				cleanBuildingInfo: cleanBuilding,
				deliveryFee: deliveryFee,
				items: orderItems,
				itemNotes: itemNotes,
				itemExtraPrices: itemExtraPrices,
				subtotal: subtotal,
				totalAmount: totalAmount,
				notes: notes.trim() || null,
				hasUncertainItems: hasUncertainItems,
			};

			let finalRequest;
			// Single-Card Lifecycle: If modifying an existing request (e.g. after out-of-stock change request),
			// UPDATE the existing row so Admin POS retains the exact same card across the lifecycle.
			if (activeOrderRequest?.id) {
				finalRequest = await orderRequestAPI.resubmitOrderRequest(
					activeOrderRequest.id,
					requestPayload
				);
			} else {
				// Fresh new order request (first checkout)
				finalRequest = await orderRequestAPI.createOrderRequest(requestPayload);
			}

			setActiveOrderRequest(finalRequest);

			// If order has items requiring stock verification:
			if (hasUncertainItems) {
				// Send Telegram alert to staff group in background
				notifyStockCheckRequired(finalRequest).catch((err) =>
					console.error("Telegram notification error:", err)
				);

				toast.success(
					activeOrderRequest?.id
						? "Order request updated! Checking kitchen availability..."
						: "Order request sent! Checking kitchen availability...",
					{ id: toastId }
				);
				setStep("stock_check");
			} else {
				// All items in stock: proceed directly to payment
				toast.success("Items ready! Proceeding to payment...", { id: toastId });
				setStep("payment");
			}
		} catch (error) {
			console.error("Order request submit error:", error);
			toast.error("Failed to submit request. Please try again.", { id: toastId });
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
					onClick={() => setStep("menu")}>
					<ArrowLeft className="w-4 h-4" />
					Back to Menu
				</button>
				<h2 className="text-base font-extrabold text-base-content">
					Delivery Details
				</h2>
				<div className="w-8"></div>
			</div>

			{/* Stepped Progress Line */}
			<div className="bg-base-100 border border-base-200 rounded-2xl p-3 shadow-sm">
				<OrderStepper currentStep={3} />
			</div>

			{/* 1. Delivery Destination Card */}
			<div className="card bg-base-100 shadow-sm border border-base-200 rounded-2xl">
				<div className="card-body p-4 space-y-2">
					<div className="flex items-center justify-between">
						<span className="text-xs font-bold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
							<Building className="w-3.5 h-3.5 text-primary" />
							Delivery Destination
						</span>
						<button
							className="text-primary hover:underline text-[11px] font-semibold"
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
											{cust.building_info && (
												<span className="text-[10px] text-base-content/50 ml-1.5">
													({cust.building_info})
												</span>
											)}
										</div>
										<span className="text-[10px] text-primary font-semibold">
											{cust.total_orders || 0} orders
										</span>
									</button>
								))}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* 3. Phone Number Field (Mandatory) */}
			<div className="card bg-base-100 shadow-sm border border-base-200 rounded-2xl">
				<div className="card-body p-4 space-y-3">
					<div className="flex items-center justify-between">
						<label className="text-xs font-bold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
							<Phone className="w-3.5 h-3.5 text-primary" />
							Phone Number *
						</label>
						<span className="badge badge-warning badge-xs font-bold text-[10px] px-2 py-0.5">
							Required
						</span>
					</div>

					<input
						type="tel"
						placeholder="e.g. 0812345678 (for rider & order updates)..."
						className="input input-bordered input-sm w-full font-medium"
						value={phone}
						onChange={(e) => {
							setPhone(e.target.value);
							setCustomerInfo({ phone: e.target.value });
						}}
					/>
					<p className="text-[10px] text-base-content/50 leading-tight">
						Riders and kitchen will contact this number if there is an update with your delivery.
					</p>
				</div>
			</div>

			{/* 4. Items Summary with Stock Notice */}
			<div className="card bg-base-100 shadow-sm border border-base-200 rounded-2xl">
				<div className="card-body p-4 space-y-3">
					<div className="flex items-center justify-between">
						<span className="text-xs font-bold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
							<ShoppingBag className="w-3.5 h-3.5 text-primary" />
							Items Summary ({cart.length})
						</span>
						<button
							type="button"
							onClick={() => setStep("menu")}
							className="text-primary hover:underline text-[11px] font-semibold">
							Edit Order
						</button>
					</div>

					<div className="divide-y divide-base-200 text-xs">
						{cart.map((item) => {
							const extra = Number(
								item.extra_price !== undefined
									? item.extra_price
									: itemExtraPrices[item.cart_id] || 0
							);
							const unitPrice = (Number(item.price) || 0) + extra;
							const note = (item.notes || itemNotes[item.cart_id] || "").trim();
							const needsCheck = Boolean(item.requires_stock_check);

							return (
								<div
									key={item.cart_id}
									className="py-2.5 flex items-start justify-between gap-2">
									<div className="min-w-0 flex-1 space-y-1">
										<div className="font-bold text-base-content leading-tight flex items-center gap-1.5">
											<span>
												{item.quantity}x {item.name_english || item.name_burmese}
											</span>
											{needsCheck && (
												<span className="badge badge-warning text-[9px] font-extrabold px-1.5 py-0">
													Stock Check
												</span>
											)}
										</div>
										{note && (
											<div className="text-[11px] text-primary bg-primary/10 px-2 py-0.5 rounded-md font-medium inline-block leading-snug">
												📝 {note}
											</div>
										)}
									</div>
									<span className="font-mono font-bold text-base-content shrink-0">
										฿{(unitPrice * (item.quantity || 1)).toFixed(2)}
									</span>
								</div>
							);
						})}
					</div>

					{/* Notice if stock check will be triggered */}
					{hasUncertainItems && (
						<div className="p-2.5 rounded-xl bg-warning/10 border border-warning/30 flex items-start gap-2 text-xs text-warning-content/90">
							<Clock className="w-4 h-4 text-warning shrink-0 mt-0.5" />
							<p className="text-[11px] leading-snug">
								Some items in your order require a brief kitchen availability confirmation (under 2 mins) before payment.
							</p>
						</div>
					)}
				</div>
			</div>

			{/* 6. Total & Action Button */}
			<div className="card bg-base-100 shadow-sm border border-base-200 rounded-2xl">
				<div className="card-body p-4 space-y-2.5">
					<div className="space-y-1.5 text-xs">
						<div className="flex justify-between text-base-content/70">
							<span>Food Subtotal ({cart.reduce((sum, i) => sum + (i.quantity || 1), 0)} items)</span>
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
						className="btn btn-primary w-full shadow-lg font-bold text-primary-content rounded-xl mt-2 flex items-center justify-between"
						disabled={isSubmitting || !name.trim() || !phone.trim() || phone.replace(/\D/g, "").length < 9}
						onClick={handleSubmitRequest}>
						{isSubmitting ? (
							<div className="w-full flex items-center justify-center gap-2">
								<span className="loading loading-spinner loading-xs"></span>
								<span>Submitting Request...</span>
							</div>
						) : hasUncertainItems ? (
							<>
								<span className="flex items-center gap-1.5">
									<Clock className="w-4 h-4" />
									Check Availability &amp; Continue
								</span>
								<span className="font-mono">฿{totalAmount.toFixed(2)}</span>
							</>
						) : (
							<>
								<span className="flex items-center gap-1.5">
									Proceed to Payment
									<ArrowRight className="w-4 h-4 ml-1" />
								</span>
								<span className="font-mono">฿{totalAmount.toFixed(2)}</span>
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	);
};

export default ContactDetailsSection;
