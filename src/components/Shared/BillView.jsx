import { useState } from "react";

const BillView = ({ bills }) => {
	const [isExpanded, setIsExpanded] = useState(false);

	if (!bills || bills.length === 0) {
		return (
			<div className="text-center py-4 opacity-50 text-sm">
				No active bills at this table
			</div>
		);
	}

	const statusColors = {
		pending: "badge-secondary",
		preparing: "badge-warning",
		ready: "badge-success",
		completed: "badge-ghost",
		cancelled: "badge-error",
		refunded: "badge-error",
	};

	const statusLabels = {
		pending: "Received",
		preparing: "Preparing",
		ready: "Ready ✅",
		completed: "Completed",
		cancelled: "Cancelled",
		refunded: "Refunded",
	};

	const unpaidCount = bills.filter((b) => b.payment_status === "unpaid").length;

	return (
		<div className="bg-base-200/50 rounded-lg p-4 m-4">
			<div
				className="flex justify-between items-center cursor-pointer"
				onClick={() => setIsExpanded(!isExpanded)}>
				<h3 className="font-bold flex items-center gap-2">
					📋 Bills at this table
					{unpaidCount > 0 && (
						<span className="badge badge-warning badge-sm">
							{unpaidCount} unpaid
						</span>
					)}
				</h3>
				<button className="btn btn-xs btn-ghost">
					{isExpanded ? "▲" : "▼"}
				</button>
			</div>

			<div
				className={`space-y-3 mt-3 ${
					isExpanded ? "" : "max-h-32 overflow-y-auto"
				}`}>
				{bills.map((bill) => (
					<div
						key={bill.id}
						className="bg-base-100 rounded-lg p-3 border border-base-200">
						<div className="flex justify-between items-start">
							<div>
								<div className="flex items-center gap-2">
									<span className="font-mono text-sm font-bold">
										#{bill.order_number?.slice(-6) || "NEW"}
									</span>
									{bill.customer_name && (
										<span className="text-xs opacity-60">
											• {bill.customer_name}
										</span>
									)}
								</div>
								<div className="flex gap-1 mt-1">
									<span
										className={`badge badge-xs ${
											statusColors[bill.pos_order_status] || "badge-ghost"
										}`}>
										{statusLabels[bill.pos_order_status] ||
											bill.pos_order_status}
									</span>
									{bill.payment_status === "paid" && (
										<span className="badge badge-xs badge-success">
											Paid ✅
										</span>
									)}
								</div>
							</div>
							<div className="text-right">
								<div className="font-bold text-primary">
									฿{bill.total_amount}
								</div>
								<div className="text-[10px] opacity-50">
									{bill.order_items?.length || 0} items
								</div>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default BillView;
