import { useState } from "react";
import {
	MapPin,
	Building2,
	Check,
	ArrowRight,
	ShieldCheck,
} from "lucide-react";
import { FIXED_APARTMENTS } from "../../utils/deliveryLocations";
import { useOrderFlowStore } from "../../stores/useOrderFlowStore";
import OrderStepper from "../Shared/OrderStepper";
import logo from "../../../src/assets/logo.png";

const LocationPromptPage = () => {
	const { selectedLocation, setLocation, setStep } = useOrderFlowStore();

	const [apartmentId, setApartmentId] = useState(
		selectedLocation.apartmentId || null
	);
	const [building, setBuilding] = useState(
		selectedLocation.building || ""
	);

	const selectedApt =
		FIXED_APARTMENTS.find((apt) => apt.id === apartmentId) || null;

	const handleApartmentSelect = (apt) => {
		setApartmentId(apt.id);
		if (apt.buildings?.length > 0) {
			// Keep previous building if valid for this apartment, else default to first
			if (!apt.buildings.includes(building)) {
				setBuilding(apt.buildings[0]);
			}
		} else {
			setBuilding("");
		}
	};

	const handleConfirm = () => {
		if (!selectedApt) return;
		setLocation({
			apartmentId: selectedApt.id,
			apartmentName: selectedApt.name,
			building: building,
			fee: selectedApt.fee,
			isConfirmed: true,
		});
		setStep("menu");
	};

	return (
		<div className="max-w-md mx-auto py-2 px-1 space-y-5 animate-fadeIn pb-16">
			{/* Stepped Horizontal Progress Line */}
			<div className="bg-base-100 border border-base-200 rounded-2xl p-3 sm:p-4 shadow-sm">
				<OrderStepper currentStep={1} />
			</div>

			{/* Welcome Hero Card */}
			<div className="bg-gradient-to-br from-primary/10 via-base-100 to-base-200/50 p-5 rounded-3xl border border-primary/20 shadow-sm text-center space-y-2">
				<div className="w-12 h-12 bg-primary text-primary-content rounded-2xl flex items-center justify-center mx-auto shadow-md">
					<MapPin className="w-6 h-6" />
				</div>
				<h1 className="text-xl font-extrabold text-base-content tracking-tight">
					Where should we deliver?
				</h1>
				<p className="text-xs text-base-content/70 max-w-xs mx-auto leading-relaxed">
					Choose your nearby apartment or hotel. Delivery prices are fixed and affordable.
				</p>
			</div>

			{/* 1. Apartments & Hotels List */}
			<div className="space-y-2.5">
				<label className="text-xs font-bold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5 px-1">
					<Building2 className="w-4 h-4 text-primary" />
					1. Select Your Place
				</label>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
					{FIXED_APARTMENTS.map((apt) => {
						const isSelected = apt.id === apartmentId;
						return (
							<button
								key={apt.id}
								type="button"
								onClick={() => handleApartmentSelect(apt)}
								className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
									isSelected
										? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/30"
										: "border-base-300/80 bg-base-100 hover:border-primary/50 shadow-sm"
								}`}>
								<div>
									<div className="font-extrabold text-sm text-base-content">
										{apt.name}
									</div>
									<div className="text-xs text-base-content/60 mt-0.5 flex items-center gap-1">
										<span>Delivery:</span>
										<span className="font-bold text-primary font-mono">฿{apt.fee}</span>
									</div>
								</div>

								{isSelected ? (
									<div className="w-6 h-6 rounded-full bg-primary text-primary-content flex items-center justify-center shrink-0 shadow-sm">
										<Check className="w-3.5 h-3.5 stroke-[3]" />
									</div>
								) : (
									<div className="w-5 h-5 rounded-full border-2 border-base-300 shrink-0"></div>
								)}
							</button>
						);
					})}
				</div>
			</div>

			{/* 2. Building / Tower Choice (Crisp, Solid, High-Contrast Visibility) */}
			{selectedApt && selectedApt.buildings?.length > 0 && (
				<div className="space-y-2.5 pt-2 border-t border-base-200">
					<label className="text-xs font-bold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5 px-1">
						<Building2 className="w-4 h-4 text-primary" />
						2. Select Building / Tower
					</label>

					<div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
						{selectedApt.buildings.map((bldg) => {
							const isSelected = bldg === building;
							return (
								<button
									key={bldg}
									type="button"
									onClick={() => setBuilding(bldg)}
									className={`py-3 px-4 rounded-2xl border-2 text-center font-extrabold text-sm transition-all cursor-pointer ${
										isSelected
											? "bg-primary text-primary-content border-primary shadow-md scale-[1.02]"
											: "bg-base-100 text-base-content border-base-300 hover:border-primary/60 shadow-sm"
									}`}>
									<div className="flex items-center justify-center gap-1.5">
										{isSelected && <Check className="w-4 h-4 stroke-[3]" />}
										<span>{bldg}</span>
									</div>
								</button>
							);
						})}
					</div>
				</div>
			)}

			{/* 3. Delivery Fee Summary Card */}
			{selectedApt ? (
				<div className="bg-base-100 rounded-2xl p-4 border border-base-300/80 shadow-sm flex items-center justify-between animate-fadeIn">
					<div className="flex items-center gap-2.5">
						<div className="w-8 h-8 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
							<ShieldCheck className="w-4 h-4" />
						</div>
						<div>
							<div className="font-extrabold text-xs text-base-content">
								{selectedApt.name}
								{building ? ` (${building})` : ""}
							</div>
							<div className="text-[11px] text-base-content/60">
								Fixed delivery price
							</div>
						</div>
					</div>
					<div className="text-lg font-black text-primary font-mono">
						฿{selectedApt.fee}
					</div>
				</div>
			) : (
				<div className="bg-base-100/60 rounded-2xl p-4 border border-dashed border-base-300 text-center text-xs text-base-content/50">
					Select your apartment or hotel above to view delivery details
				</div>
			)}

			{/* 4. Continue Button */}
			<div className="pt-2">
				<button
					type="button"
					disabled={!selectedApt || (selectedApt.buildings?.length > 0 && !building)}
					className="btn btn-primary w-full shadow-xl font-extrabold text-primary-content gap-2 rounded-2xl py-4 h-auto text-base disabled:opacity-40 disabled:cursor-not-allowed"
					onClick={handleConfirm}>
					<span>Continue to Menu</span>
					<ArrowRight className="w-5 h-5" />
				</button>
			</div>
		</div>
	);
};

export default LocationPromptPage;
