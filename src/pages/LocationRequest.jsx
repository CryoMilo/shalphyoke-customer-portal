import { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useProximity } from "../hooks/useProximity";
import { MapPin } from "lucide-react";

const LocationRequest = () => {
	const { table } = useParams();
	const [searchParams] = useSearchParams();
	const tableParam = table || searchParams.get("table");
	const navigate = useNavigate();
	const { isWithinRadius, error, isLoading, checkProximity } = useProximity();

	useEffect(() => {
		if (isWithinRadius === true) {
			navigate(`/order/${tableParam}/menu`);
		} else if (isWithinRadius === false) {
			navigate("/order/invalid");
		}
	}, [isWithinRadius, navigate, tableParam]);

	const handleAllowLocation = () => {
		checkProximity();
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-base-200 px-4">
			<div className="max-w-md w-full bg-base-100 rounded-2xl shadow-xl p-8 text-center">
				<div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
					<MapPin className="w-10 h-10 text-primary" />
				</div>

				<h2 className="text-2xl font-bold mb-4">Enable Location to Order</h2>

				<p className="text-base-content/70 mb-8">
					To ensure you are at the restaurant, we need to verify your location.
					Please allow location access to continue viewing the menu and placing
					your order.
				</p>

				{error && (
					<div className="bg-error/10 text-error p-4 rounded-lg mb-6 text-sm">
						{error}
					</div>
				)}

				<button
					onClick={handleAllowLocation}
					disabled={isLoading}
					className="btn btn-primary w-full shadow-lg">
					{isLoading ? (
						<span className="loading loading-spinner"></span>
					) : (
						"Allow Location Access"
					)}
				</button>
			</div>
		</div>
	);
};

export default LocationRequest;
