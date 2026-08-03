import { useBillsStore } from "../../stores/useBillsStore";
import { useCartStore } from "../../stores/useCartStore";
import { ShoppingBag, Users } from "lucide-react";
import logo from "../../../src/assets/logo.png";

const QRHeader = ({ onCartClick }) => {
	const { bills } = useBillsStore();
	const { cart } = useCartStore();

	const tableNumber = localStorage.getItem("tableNumber") || "--";
	const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

	return (
		<header className="sticky top-0 z-40 bg-base-100/80 backdrop-blur-lg border-b border-base-300 shadow-sm">
			<div className="navbar max-w-4xl mx-auto px-4 py-4">
				{/* Brand - Left */}
				<div className="navbar-start gap-3">
					<div className="avatar placeholder">
						<div className="w-14 rounded-full">
							<span className="text-lg">
								<img src={logo} alt="Shal Phyoke Logo" />
							</span>
						</div>
					</div>
					<div>
						<div className="text-sm font-bold text-secondary">Shal Phyoke</div>
						<div className="text-[10px] font-medium text-base-content/40 uppercase tracking-wider">
							Order via QR
						</div>
					</div>
				</div>

				{/* Right side */}
				<div className="navbar-end gap-2 sm:gap-3">
					{/* Table Badge */}
					<div className="badge badge-ghost gap-1.5 px-3 py-3.5 text-sm font-medium">
						<Users className="w-3.5 h-3.5" />
						<span>Table {tableNumber}</span>
						{bills && bills.length > 0 && (
							<span className="badge badge-primary badge-xs ml-0.5">
								{bills.length}
							</span>
						)}
					</div>

					{/* Cart Button */}
					<button
						className="btn btn-ghost btn-circle relative"
						onClick={onCartClick}
						aria-label="Open cart">
						<ShoppingBag className="w-5 h-5" />
						{cartCount > 0 && (
							<span className="badge badge-primary badge-xs absolute -top-1 -right-1 text-primary-content border-none">
								{cartCount}
							</span>
						)}
					</button>
				</div>
			</div>
		</header>
	);
};

export default QRHeader;
