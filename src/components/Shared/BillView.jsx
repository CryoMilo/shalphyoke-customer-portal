import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const BillView = ({ bills }) => {
	const [isExpanded, setIsExpanded] = useState(true);

	const hasBills = bills && bills.length > 0;

	return (
		<div className="card bg-base-100 shadow-sm border border-base-300 mb-4">
			<div
				className="card-body p-4 cursor-pointer"
				onClick={() => setIsExpanded(!isExpanded)}>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span className="text-lg">📋</span>
						<h3 className="card-title text-sm">Bills at this table</h3>
						{hasBills && (
							<span className="badge badge-warning badge-sm">
								{bills.filter((b) => b.payment_status === "unpaid").length}{" "}
								unpaid
							</span>
						)}
					</div>
					<button className="btn btn-xs btn-ghost">
						{isExpanded ? (
							<ChevronUp className="w-4 h-4" />
						) : (
							<ChevronDown className="w-4 h-4" />
						)}
					</button>
				</div>

				{isExpanded && (
					<div className="mt-2">
						{!hasBills ? (
							<div className="text-center py-6">
								<p className="text-sm text-base-content/40">
									No active bills at this table
								</p>
							</div>
						) : (
							<div className="space-y-2">
								{bills.map((bill) => (
									<div key={bill.id} className="bg-base-200 rounded-lg p-3">
										<div className="flex items-center justify-between">
											<div>
												<div className="font-mono text-sm font-bold">
													#{bill.order_number?.slice(-6) || "NEW"}
													{bill.order_source === "qr" && (
														<span className="badge badge-accent badge-xs ml-1 font-bold">
															QR
														</span>
													)}
												</div>
												{bill.customer_name && (
													<div className="text-xs text-base-content/60">
														{bill.customer_name}
													</div>
												)}
											</div>
											<div className="text-right">
												<div className="font-bold text-primary">
													฿{bill.total_amount}
												</div>
												<div className="flex gap-1 mt-0.5 justify-end">
													<span
														className={`badge badge-xs ${
															bill.pos_order_status === "ready"
																? "badge-success"
																: bill.pos_order_status === "preparing"
																? "badge-warning"
																: bill.pos_order_status === "completed"
																? "badge-ghost"
																: bill.pos_order_status === "cancelled"
																? "badge-error"
																: bill.pos_order_status === "refunded"
																? "badge-error"
																: "badge-ghost"
														}`}>
														{bill.pos_order_status}
													</span>
													{bill.payment_status === "paid" && (
														<span className="badge badge-xs badge-success">
															Paid
														</span>
													)}
												</div>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default BillView;
