import { Check, MapPin, UtensilsCrossed, CreditCard, Clock } from "lucide-react";
import { useOrderFlowStore } from "../../stores/useOrderFlowStore";

const OrderStepper = ({ currentStep = 2 }) => {
	const { selectedLocation, setStep } = useOrderFlowStore();

	const steps = [
		{
			id: 1,
			key: "location",
			label: "Location",
			sub: selectedLocation?.apartmentName
				? `${selectedLocation.apartmentName}${
						selectedLocation.building ? ` (${selectedLocation.building})` : ""
				  }`
				: "Select Place",
			icon: MapPin,
			clickable: true,
		},
		{
			id: 2,
			key: "menu",
			label: "Menu",
			sub: "Choose Items",
			icon: UtensilsCrossed,
			clickable: Boolean(selectedLocation?.isConfirmed),
		},
		{
			id: 3,
			key: "checkout",
			label: "Payment",
			sub: "Slip & Info",
			icon: CreditCard,
			clickable: false,
		},
		{
			id: 4,
			key: "waiting",
			label: "Approval",
			sub: "Admin Verify",
			icon: Clock,
			clickable: false,
		},
	];

	return (
		<div className="w-full py-1">
			<div className="flex items-center justify-between relative">
				{steps.map((s, idx) => {
					const isCompleted = s.id < currentStep;
					const isCurrent = s.id === currentStep;
					const Icon = s.icon;
					const canClick = Boolean(s.clickable || isCompleted) && !isCurrent;

					return (
						<div
							key={s.id}
							className="flex-1 flex flex-col items-center relative group">
							{/* Horizontal connecting line before this step */}
							{idx > 0 && (
								<div
									className={`absolute top-4 -translate-y-1/2 -left-1/2 w-full h-[3px] z-0 transition-all duration-300 ${
										isCompleted || isCurrent
											? "bg-primary"
											: "bg-base-300"
									}`}
								/>
							)}

							{/* Step Circle Button */}
							<button
								type="button"
								disabled={!canClick}
								onClick={() => {
									if (canClick) {
										setStep(s.key);
									}
								}}
								className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 z-10 shadow-sm ${
									isCompleted
										? "bg-primary text-primary-content ring-2 ring-primary/40 cursor-pointer hover:brightness-110 active:scale-95"
										: isCurrent
										? "bg-primary text-primary-content ring-4 ring-primary/20 scale-110 shadow-md font-extrabold"
										: canClick
										? "bg-base-200 text-base-content hover:bg-primary/20 hover:text-primary border border-base-300 cursor-pointer active:scale-95"
										: "bg-base-200 text-base-content/40 border border-base-300 cursor-not-allowed"
								}`}>
								{isCompleted ? (
									<Check className="w-4 h-4 stroke-[3]" />
								) : (
									<Icon className="w-3.5 h-3.5" />
								)}
							</button>

							{/* Labels (Clickable if step is accessible) */}
							<button
								type="button"
								disabled={!canClick}
								onClick={() => {
									if (canClick) {
										setStep(s.key);
									}
								}}
								className={`text-center mt-1.5 px-0.5 border-none bg-transparent transition-opacity ${
									canClick ? "cursor-pointer hover:opacity-80 active:scale-95" : "cursor-default"
								}`}>
								<div
									className={`text-[11px] font-extrabold tracking-tight leading-tight ${
										isCurrent
											? "text-primary"
											: isCompleted
											? "text-base-content font-bold hover:text-primary"
											: canClick
											? "text-base-content/70 hover:text-primary font-bold"
											: "text-base-content/40"
									}`}>
									{s.label}
								</div>
								<div
									className={`text-[9px] truncate max-w-[70px] sm:max-w-[90px] mt-0.5 ${
										isCurrent
											? "text-primary/80 font-semibold"
											: "text-base-content/40"
									}`}>
									{s.sub}
								</div>
							</button>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default OrderStepper;
