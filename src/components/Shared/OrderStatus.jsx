import {
	CheckCircle,
	Clock,
	CookingPot,
	Utensils,
	XCircle,
} from "lucide-react";

const OrderStatus = ({ status }) => {
	if (status === "cancelled" || status === "refunded") {
		return (
			<div className="bg-error/10 rounded-xl p-4 flex items-center gap-3 text-error">
				<XCircle className="w-5 h-5 shrink-0" />
				<span className="font-medium text-sm">
					This order has been {status}
				</span>
			</div>
		);
	}

	const steps = [
		{ key: "pending", label: "Order Received", icon: Clock },
		{ key: "preparing", label: "Preparing", icon: CookingPot },
		{ key: "ready", label: "Ready to Serve", icon: Utensils },
		{ key: "completed", label: "Completed", icon: CheckCircle },
	];

	const currentStepIndex = steps.findIndex((s) => s.key === status);
	const isComplete = status === "completed";

	return (
		<div className="py-2">
			<div className="relative">
				{steps.map((step, index) => {
					const Icon = step.icon;
					const isActive = index <= currentStepIndex;
					const isCurrent = index === currentStepIndex;

					return (
						<div key={step.key} className="order-status-step">
							<div className="order-status-step-connector">
								{/* Vertical line */}
								{index < steps.length - 1 && (
									<div
										className={`order-status-step-line ${
											isActive ? "order-status-step-line-active" : ""
										}`}
									/>
								)}

								{/* Dot */}
								<div
									className={`order-status-step-dot ${
										isComplete && index === steps.length - 1
											? "order-status-step-dot-completed"
											: isActive
											? "order-status-step-dot-active"
											: "order-status-step-dot-inactive"
									}`}>
									{isComplete && index === steps.length - 1 ? (
										<CheckCircle className="w-3 h-3" />
									) : isActive ? (
										<span className="text-[8px]">✓</span>
									) : (
										<span className="text-[8px]">{index + 1}</span>
									)}
								</div>
							</div>

							<div className="order-status-step-content">
								<div className="flex items-center gap-2">
									<Icon
										className={`w-4 h-4 ${
											isActive ? "text-primary" : "text-base-content/30"
										}`}
									/>
									<span
										className={`order-status-step-label ${
											!isActive ? "text-base-content/30" : ""
										}`}>
										{step.label}
									</span>
									{isCurrent && !isComplete && (
										<span className="loading loading-spinner loading-xs text-primary" />
									)}
								</div>
								{isActive && (
									<div className="order-status-step-time">
										{isComplete && index === steps.length - 1
											? "Done"
											: "In progress..."}
									</div>
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
