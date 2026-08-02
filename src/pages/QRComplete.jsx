import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, ArrowRight, X } from "lucide-react";

const QRComplete = () => {
	const navigate = useNavigate();
	const { tableNumber } = useParams();

	useEffect(() => {
		const timer = setTimeout(() => {
			navigate(`/order/${tableNumber}`);
		}, 10000);

		return () => clearTimeout(timer);
	}, [navigate, tableNumber]);

	return (
		<div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
			<div className="card bg-base-100 shadow-lg border border-base-200 max-w-md w-full">
				<div className="card-body items-center text-center p-8">
					{/* Icon */}
					<div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-4">
						<CheckCircle className="w-10 h-10 text-success" />
					</div>

					<h2 className="card-title text-2xl">Order Complete! 🎉</h2>
					<p className="text-base-content/60 text-sm">
						Thank you for dining with us.
					</p>

					<div className="divider my-4 text-xs text-base-content/30">
						What would you like to do?
					</div>

					<div className="flex flex-col gap-3 w-full">
						<button
							className="btn btn-primary w-full gap-2"
							onClick={() => navigate(`/order/${tableNumber}`)}>
							<span>🍽️</span>
							Order More Food
							<ArrowRight className="w-4 h-4" />
						</button>
						<button
							className="btn btn-ghost w-full gap-2"
							onClick={() => window.close()}>
							<X className="w-4 h-4" />
							Close
						</button>
					</div>

					<p className="text-xs text-base-content/30 mt-4">
						Redirecting to menu in 10 seconds...
					</p>
				</div>
			</div>
		</div>
	);
};

export default QRComplete;
