const StatusBadge = ({ status, size = "xs" }) => {
	const statusMap = {
		pending: { label: "Pending", className: "badge-pending" },
		preparing: { label: "Preparing", className: "badge-preparing" },
		ready: { label: "Ready", className: "badge-ready" },
		completed: { label: "Completed", className: "badge-completed" },
		cancelled: { label: "Cancelled", className: "badge-cancelled" },
		refunded: { label: "Refunded", className: "badge-refunded" },
		paid: { label: "Paid", className: "badge-paid" },
		unpaid: { label: "Unpaid", className: "badge-unpaid" },
	};

	const statusInfo = statusMap[status] || {
		label: status,
		className: "badge-ghost",
	};
	const sizeClass = size === "xs" ? "badge-xs" : "badge-sm";

	return (
		<span
			className={`badge ${sizeClass} ${statusInfo.className} font-medium border-none`}>
			{statusInfo.label}
		</span>
	);
};

export default StatusBadge;
