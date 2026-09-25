import { Outlet } from "react-router-dom";
import QRHeader from "./QRHeader";
import QRFooter from "./QRFooter";
import { useCart } from "../../context/CartContext";
import { useOrderFlowStore } from "../../stores/useOrderFlowStore";
import toast from "react-hot-toast";

const QRLayout = () => {
	const { openCart } = useCart();
	const { step, setStep, activeOrderRequest } = useOrderFlowStore();

	const isStockChecking =
		step === "stock_check" ||
		(activeOrderRequest?.status === "stock_checking" &&
			activeOrderRequest?.stock_status === "pending_check");

	const handleCartClick = () => {
		if (isStockChecking) {
			toast("Kitchen is currently verifying your items. Please wait or cancel the request first.", {
				icon: "⏳",
			});
			return;
		}
		openCart();
	};

	const handleLocationClick = () => {
		if (isStockChecking) {
			toast("Cannot change location while checking item availability.", {
				icon: "🔒",
			});
			return;
		}
		setStep("location");
	};

	return (
		<div className="min-h-screen bg-base-200 flex flex-col">
			<QRHeader
				isLocked={isStockChecking}
				onCartClick={handleCartClick}
				onLocationClick={handleLocationClick}
			/>
			<main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 pb-24">
				<Outlet />
			</main>
			<QRFooter />
		</div>
	);
};

export default QRLayout;
