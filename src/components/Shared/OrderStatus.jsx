import {
	CheckCircle,
	Clock,
	CookingPot,
	Utensils,
	XCircle,
} from "lucide-react";

const OrderStatus = ({ status }) => {
	// Check if order is cancelled or refunded
	if (status === "cancelled" || status === "refunded") {
		return (
			<div className="w-full max-w-md mx-auto p-4">
				<div className="alert alert-error">
					<XCircle className="w-6 h-6" />
					<span>This order has been {status}</span>
				</div>
			</div>
		);
	}

	const steps = [
		{ key: "pending", label: "Order Received", icon: Clock },
		{ key: "preparing", label: "Preparing", icon: CookingPot },
		{ key: "ready", label: "Ready to Serve", icon: Utensils },
		{ key: "completed", label: "Completed", icon: CheckCircle },
	];

	const currentStep = steps.findIndex((s) => s.key === status);
	const isComplete = status === "completed";

	return (
		<div className="w-full max-w-md mx-auto p-4">
			<div className="steps steps-vertical">
				{steps.map((step, index) => {
					const Icon = step.icon;
					const isActive = index <= currentStep;
					const isCurrent = index === currentStep;

					return (
						<div
							key={step.key}
							className={`step ${isActive ? "step-primary" : "step-neutral"}`}>
							<div className="flex items-center gap-2">
								<Icon
									className={`w-4 h-4 ${
										isActive ? "text-primary" : "opacity-50"
									}`}
								/>
								<span className={isActive ? "font-medium" : "opacity-50"}>
									{step.label}
								</span>
								{isCurrent && !isComplete && (
									<span className="loading loading-spinner loading-xs ml-2" />
								)}
								{isComplete && index === steps.length - 1 && (
									<CheckCircle className="w-4 h-4 text-success ml-2" />
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default OrderStatus;
