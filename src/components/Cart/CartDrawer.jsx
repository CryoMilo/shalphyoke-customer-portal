import { useState, useEffect } from "react";
import { X, ShoppingBag, MapPin, Building, Phone, User, AlertCircle } from "lucide-react";
import CartItem from "./CartItem";
import { FIXED_APARTMENTS, formatDeliveryAddress } from "../../utils/deliveryLocations";
import toast from "react-hot-toast";

const CartDrawer = ({ isOpen, onClose, onPlaceOrder, cart, total }) => {
	// Form states initialized from localStorage if available
	const [selectedApartmentId, setSelectedApartmentId] = useState(() => {
		return localStorage.getItem("customer_apartment_id") || FIXED_APARTMENTS[0].id;
	});
	const [selectedBuilding, setSelectedBuilding] = useState(() => {
		return localStorage.getItem("customer_building") || "";
	});
	const [roomNumber, setRoomNumber] = useState(() => {
		return localStorage.getItem("customer_room") || "";
	});
	const [customerName, setCustomerName] = useState(() => {
		return localStorage.getItem("customer_name") || "";
	});
	const [customerPhone, setCustomerPhone] = useState(() => {
		return localStorage.getItem("customer_phone") || "";
	});
	const [dropoffNote, setDropoffNote] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const selectedApartment =
		FIXED_APARTMENTS.find((apt) => apt.id === selectedApartmentId) || FIXED_APARTMENTS[0];
	const deliveryFee = selectedApartment?.fee || 0;
	const grandTotal = total + deliveryFee;

	// Reset or default building when apartment changes
	const handleApartmentChange = (aptId) => {
		setSelectedApartmentId(aptId);
		localStorage.setItem("customer_apartment_id", aptId);
		const apt = FIXED_APARTMENTS.find((a) => a.id === aptId);
		if (apt?.buildings?.length > 0) {
			setSelectedBuilding(apt.buildings[0]);
			localStorage.setItem("customer_building", apt.buildings[0]);
		} else {
			setSelectedBuilding("");
			localStorage.removeItem("customer_building");
		}
	};

	// Save customer info to localStorage on change
	useEffect(() => {
		if (customerName) localStorage.setItem("customer_name", customerName);
		if (customerPhone) localStorage.setItem("customer_phone", customerPhone);
		if (roomNumber) localStorage.setItem("customer_room", roomNumber);
		if (selectedBuilding) localStorage.setItem("customer_building", selectedBuilding);
	}, [customerName, customerPhone, roomNumber, selectedBuilding]);

	const handleSubmit = async () => {
		if (cart.length === 0) {
			toast.error("Your cart is empty");
			return;
		}

		if (!customerPhone.trim()) {
			toast.error("Please enter your phone number so we can reach you");
			return;
		}

		// Phone validation: Thai mobile numbers are typically 9-10 digits
		const cleanPhone = customerPhone.replace(/\D/g, "");
		if (cleanPhone.length < 9 || cleanPhone.length > 10) {
			toast.error("Please enter a valid phone number (e.g. 0812345678)");
			return;
		}

		if (!roomNumber.trim()) {
			toast.error("Please specify your Room or Floor number for delivery");
			return;
		}

		const formattedAddress = formatDeliveryAddress({
			apartment: selectedApartment,
			building: selectedBuilding,
			roomNumber: roomNumber.trim(),
			dropoffNote: dropoffNote.trim(),
		});

		setIsSubmitting(true);
		try {
			await onPlaceOrder({
				name: customerName.trim() || "Customer",
				phone: cleanPhone,
				apartment: selectedApartment.name,
				building: selectedBuilding || null,
				room: roomNumber.trim(),
				deliveryAddress: formattedAddress,
				deliveryFee: deliveryFee,
				notes: dropoffNote.trim() || null,
				subtotal: total,
				totalAmount: grandTotal,
			});
			onClose();
		} catch (error) {
			console.error("Order submit error:", error);
			toast.error("Failed to place order. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			{/* Overlay */}
			<div
				className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 ${
					isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
				}`}
				onClick={onClose}
			/>

			{/* Drawer */}
			<div
				className={`fixed right-0 top-0 h-full w-full max-w-md bg-base-100 shadow-2xl z-50 flex flex-col transition-transform duration-300 ${
					isOpen ? "translate-x-0" : "translate-x-full"
				}`}>
				{/* Drawer Header */}
				<div className="flex items-center justify-between p-4 border-b border-base-200 bg-base-200/50">
					<div className="flex items-center gap-2">
						<ShoppingBag className="w-5 h-5 text-primary" />
						<h2 className="font-bold text-lg">Delivery Checkout</h2>
					</div>
					<button className="btn btn-sm btn-ghost btn-circle" onClick={onClose}>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Drawer Scrollable Content */}
				<div className="flex-1 overflow-y-auto p-4 space-y-5">
					{/* Delivery Mode Banner */}
					<div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-start gap-2.5">
						<MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
						<div>
							<h4 className="text-xs font-bold text-primary uppercase tracking-wider">
								Nearby Apartment Delivery
							</h4>
							<p className="text-xs text-base-content/70 mt-0.5">
								Delivering straight to your building entrance or room door.
							</p>
						</div>
					</div>

					{/* Cart Items List */}
					<div className="space-y-2">
						<div className="flex justify-between items-center text-xs font-bold text-base-content/70 uppercase">
							<span>Your Items ({cart.length})</span>
						</div>
						{cart.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-8 text-center text-base-content/40">
								<ShoppingBag className="w-12 h-12 stroke-[1.5] mb-2 opacity-40" />
								<p className="text-sm font-medium">Your cart is empty</p>
							</div>
						) : (
							<div className="space-y-2 max-h-48 overflow-y-auto pr-1">
								{cart.map((item) => (
									<CartItem key={item.cart_id} item={item} />
								))}
							</div>
						)}
					</div>

					{cart.length > 0 && (
						<>
							{/* Delivery Location Section */}
							<div className="space-y-3 pt-3 border-t border-base-200">
								<h3 className="text-xs font-bold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
									<Building className="w-4 h-4 text-primary" />
									Delivery Address
								</h3>

								{/* Apartment Selector */}
								<div>
									<label className="label label-text text-xs font-semibold py-1">
										Select Condo / Apartment *
									</label>
									<select
										className="select select-bordered select-sm w-full font-medium"
										value={selectedApartmentId}
										onChange={(e) => handleApartmentChange(e.target.value)}>
										{FIXED_APARTMENTS.map((apt) => (
											<option key={apt.id} value={apt.id}>
												{apt.name} (Delivery fee: ฿{apt.fee})
											</option>
										))}
									</select>
								</div>

								{/* Building Info Selector (if apartment has buildings A, B, C) */}
								{selectedApartment.buildings?.length > 0 && (
									<div>
										<label className="label label-text text-xs font-semibold py-1">
											Building / Tower *
										</label>
										<div className="grid grid-cols-2 gap-2">
											{selectedApartment.buildings.map((bldg) => (
												<button
													key={bldg}
													type="button"
													className={`btn btn-sm ${
														selectedBuilding === bldg
															? "btn-primary font-bold"
															: "btn-outline border-base-300"
													}`}
													onClick={() => setSelectedBuilding(bldg)}>
													{bldg}
												</button>
											))}
										</div>
									</div>
								)}

								{/* Room / Floor Number */}
								<div>
									<label className="label label-text text-xs font-semibold py-1">
										Room & Floor Number *
									</label>
									<input
										type="text"
										placeholder="e.g. Room 512, 5th Floor"
										className="input input-bordered input-sm w-full"
										value={roomNumber}
										onChange={(e) => setRoomNumber(e.target.value)}
										required
									/>
								</div>
							</div>

							{/* Contact Information Section */}
							<div className="space-y-3 pt-3 border-t border-base-200">
								<h3 className="text-xs font-bold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
									<User className="w-4 h-4 text-primary" />
									Customer Contact
								</h3>

								<div>
									<label className="label label-text text-xs font-semibold py-1">
										Your Name
									</label>
									<input
										type="text"
										placeholder="e.g. Aung Aung / Sarah"
										className="input input-bordered input-sm w-full"
										value={customerName}
										onChange={(e) => setCustomerName(e.target.value)}
									/>
								</div>

								<div>
									<label className="label label-text text-xs font-semibold py-1">
										Phone Number (for rider) *
									</label>
									<div className="relative">
										<Phone className="w-4 h-4 absolute left-3 top-2.5 text-base-content/40" />
										<input
											type="tel"
											placeholder="08X-XXX-XXXX"
											className="input input-bordered input-sm w-full pl-9"
											value={customerPhone}
											onChange={(e) => setCustomerPhone(e.target.value)}
											required
										/>
									</div>
								</div>

								{/* Dropoff Instructions */}
								<div>
									<label className="label label-text text-xs font-semibold py-1">
										Delivery Note (optional)
									</label>
									<textarea
										placeholder="e.g. Leave with lobby security / Call upon arrival"
										className="textarea textarea-bordered textarea-xs w-full"
										rows="2"
										value={dropoffNote}
										onChange={(e) => setDropoffNote(e.target.value)}
									/>
								</div>
							</div>

							{/* Future Expansion Notice */}
							<div className="bg-base-200/50 rounded-lg p-2.5 border border-dashed border-base-300 flex items-center gap-2 text-xs text-base-content/60">
								<AlertCircle className="w-4 h-4 text-info shrink-0" />
								<span>
									Bangkok-wide Grab/Bolt delivery expansion coming soon!
								</span>
							</div>
						</>
					)}
				</div>

				{/* Drawer Footer / Bill Summary */}
				{cart.length > 0 && (
					<div className="border-t border-base-200 bg-base-200/50 p-4 space-y-3">
						<div className="space-y-1.5 text-xs">
							<div className="flex justify-between text-base-content/70">
								<span>Food Subtotal</span>
								<span className="font-semibold">฿{total.toFixed(2)}</span>
							</div>
							<div className="flex justify-between text-base-content/70">
								<span>
									Delivery Fee ({selectedApartment?.name})
								</span>
								<span className="font-semibold text-primary">
									฿{deliveryFee.toFixed(2)}
								</span>
							</div>
							<div className="flex justify-between items-center pt-2 border-t border-base-300 font-bold text-sm">
								<span>Total Amount</span>
								<span className="text-lg text-primary">
									฿{grandTotal.toFixed(2)}
								</span>
							</div>
						</div>

						<button
							className="btn btn-primary w-full shadow-lg font-bold text-primary-content"
							disabled={isSubmitting || !customerPhone || !roomNumber}
							onClick={handleSubmit}>
							{isSubmitting ? (
								<>
									<span className="loading loading-spinner loading-xs"></span>
									Placing Order...
								</>
							) : (
								`Place Order • ฿${grandTotal.toFixed(2)}`
							)}
						</button>
					</div>
				)}
			</div>
		</>
	);
};

export default CartDrawer;
