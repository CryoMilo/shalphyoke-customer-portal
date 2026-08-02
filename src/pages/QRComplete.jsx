import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle } from "lucide-react";
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
		<div className="max-w-md mx-auto p-4 min-h-screen flex items-center justify-center bg-base-100">
			<div className="card bg-base-200 shadow-xl w-full">
				<div className="card-body items-center text-center">
					<div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-4">
						<CheckCircle className="w-12 h-12 text-success" />
					</div>
					<h2 className="card-title text-2xl">Order Complete!</h2>
					<p className="text-base-content/70">Thank you for dining with us.</p>
					<div className="divider">What would you like to do?</div>
					<div className="flex flex-col gap-2 w-full">
						<button
							className="btn btn-primary w-full"
							onClick={() => navigate(`/order/${tableNumber}`)}>
							Order More Food
						</button>
						<button
							className="btn btn-ghost w-full"
							onClick={() => window.close()}>
							Close
						</button>
					</div>
					<p className="text-xs opacity-40 mt-4">
						Redirecting to menu in 10 seconds...
					</p>
				</div>
			</div>
		</div>
	);
};
export default QRComplete;
