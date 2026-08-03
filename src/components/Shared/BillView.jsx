import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, Clock, XCircle, Phone, MapPin } from "lucide-react";

const BillView = ({ bills }) => {
	const [isExpanded, setIsExpanded] = useState(true);
	const [selectedOrder, setSelectedOrder] = useState(null);

	const hasBills = bills && bills.length > 0;

	return (
		<>
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
										<div 
											key={bill.id} 
											className="bg-base-200 rounded-lg p-3 cursor-pointer hover:bg-base-300 transition-colors"
											onClick={(e) => {
												e.stopPropagation();
												setSelectedOrder(bill);
											}}
										>
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

			{/* Order Details Modal */}
			{selectedOrder && (
				<div className="modal modal-open">
					<div className="modal-box max-w-lg p-0 overflow-hidden relative">
						<div className="p-4 bg-base-200 border-b border-base-300 flex justify-between items-center">
							<h3 className="font-bold">Order Details</h3>
							{/* non-button close icon for accessibility/convenience */}
							<div 
								className="cursor-pointer opacity-50 hover:opacity-100 p-2" 
								onClick={() => setSelectedOrder(null)}
							>
								✕
							</div>
						</div>

						<div className="p-6 space-y-4">
							<div className="flex justify-between items-start">
								<div>
									<div className="text-xs font-bold opacity-40 uppercase">
										Order Number
									</div>
									<div className="flex items-center gap-3">
										<div className="font-mono font-bold text-lg">
											#{selectedOrder.order_number}
										</div>
									</div>
								</div>
								<div className="text-right">
									<div className="text-xs font-bold opacity-40 uppercase">
										Status
									</div>
									<div
										className={`badge gap-1 font-bold ${
											selectedOrder.pos_order_status === "cancelled"
												? "badge-error"
												: selectedOrder.pos_order_status === "refunded"
												? "badge-warning"
												: "badge-success"
										}`}>
										{selectedOrder.pos_order_status === "cancelled" ? (
											<XCircle className="w-3 h-3" />
										) : selectedOrder.pos_order_status === "refunded" ? (
											<Clock className="w-3 h-3" />
										) : (
											<CheckCircle2 className="w-3 h-3" />
										)}
										{selectedOrder.pos_order_status.toUpperCase()}
									</div>
								</div>
							</div>

							{/* Customer Details Section */}
							{(selectedOrder.customer_phone ||
								selectedOrder.delivery_address) && (
								<div className="bg-base-200/50 p-4 rounded-xl space-y-3">
									<div className="grid grid-cols-2 gap-1">
										{selectedOrder.customer_phone && (
											<div>
												<div className="text-[10px] opacity-40 mb-0.5 flex items-center gap-1">
													<Phone className="w-2.5 h-2.5" /> Phone
												</div>
												<div className="text-sm font-bold font-mono">
													{selectedOrder.customer_phone}
												</div>
											</div>
										)}
										{selectedOrder.delivery_address && (
											<div className="col-span-2 border-base-300/50">
												<div className="text-[10px] opacity-40 mb-0.5 flex items-center gap-1">
													<MapPin className="w-2.5 h-2.5" /> Delivery Address
												</div>
												<div className="text-sm font-medium leading-relaxed">
													{selectedOrder.delivery_address}
												</div>
											</div>
										)}
									</div>
								</div>
							)}

							<div className="space-y-3">
								<h4 className="text-xs font-bold opacity-40 uppercase">
									Items
								</h4>
								{selectedOrder.order_items?.map((item, idx) => (
									<div key={idx} className="flex flex-col gap-1">
										<div className="flex justify-between text-sm">
											<span className="font-medium">
												{item.quantity}x {item.name_burmese}
											</span>
											<span className="font-mono">
												฿{(item.final_price || item.price) * item.quantity}
											</span>
										</div>
										{(item.note ||
											selectedOrder.item_notes?.[item.cart_id]) && (
											<div className="ml-4 text-[10px] opacity-60 italic">
												{item.note || selectedOrder.item_notes?.[item.cart_id]}
											</div>
										)}
									</div>
								))}
							</div>

							<div className="divider my-0"></div>

							<div className="space-y-2">
								<div className="flex justify-between text-sm">
									<span className="opacity-60">Subtotal</span>
									<span className="font-mono text-sm">
										฿{selectedOrder.subtotal}
									</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="opacity-60">Discount</span>
									<span className="font-mono text-sm text-error">
										-฿{selectedOrder.discount_amount || 0}
									</span>
								</div>
								{selectedOrder.delivery_fee > 0 && (
									<div className="flex justify-between text-sm">
										<span className="opacity-60">Delivery Fee</span>
										<span className="font-mono text-sm text-accent">
											+฿{selectedOrder.delivery_fee}
										</span>
									</div>
								)}
								<div className="flex justify-between font-bold text-lg pt-2">
									<span>Total</span>
									<span className="text-primary">
										฿{selectedOrder.total_amount}
									</span>
								</div>
							</div>

							<div className="bg-base-200 p-3 rounded-lg grid grid-cols-2 gap-4">
								<div>
									<div className="text-[10px] font-bold opacity-40 uppercase mb-1">
										Payment Method
									</div>
									<div className="text-sm font-bold flex items-center gap-2">
										<CheckCircle2 className="w-4 h-4 text-success" />
										{selectedOrder.payment_method?.toUpperCase() || 'UNPAID'}
									</div>
								</div>
								<div>
									<div className="text-[10px] font-bold opacity-40 uppercase mb-1">
										Order Time
									</div>
									<div className="text-sm font-bold flex items-center gap-2">
										<Clock className="w-4 h-4 opacity-40" />
										{new Date(selectedOrder.created_at).toLocaleString()}
									</div>
								</div>
							</div>
						</div>
					</div>
					<div
						className="modal-backdrop bg-black/50 cursor-pointer"
						onClick={() => setSelectedOrder(null)}></div>
				</div>
			)}
		</>
	);
};

export default BillView;
