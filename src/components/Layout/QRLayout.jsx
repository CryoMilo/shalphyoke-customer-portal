import { Outlet } from "react-router-dom";
import QRHeader from "./QRHeader";
import QRFooter from "./QRFooter";
import { useCart } from "../../context/CartContext";

const QRLayout = () => {
	const { openCart } = useCart();

	return (
		<div className="min-h-screen bg-base-200 flex flex-col">
			<QRHeader onCartClick={openCart} />
			<main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 pb-24">
				<Outlet />
			</main>
			<QRFooter />
		</div>
	);
};

export default QRLayout;
