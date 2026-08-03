import { useEffect } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { useProximity } from "../hooks/useProximity";

const OrderLanding = () => {
	const [searchParams] = useSearchParams();
	const { table: tableRouteParam } = useParams();
	const navigate = useNavigate();
	const { isWithinRadius, isLoading, checkProximity } = useProximity();
	
	const table = tableRouteParam || searchParams.get("table");

	useEffect(() => {
		if (!table) {
			navigate("/order/invalid");
			return;
		}

		checkProximity();
	}, [table]);

	useEffect(() => {
		if (isWithinRadius === true) {
			navigate(`/order/${table}/menu`);
		} else if (isWithinRadius === false) {
			navigate("/order/invalid");
		} else if (!isLoading && isWithinRadius === null) {
			// This means error or not triggered yet (could be permission denied or needing manual trigger)
			// But since we just triggered it, if it failed, it goes here
			navigate(`/order/${table}/location`);
		}
	}, [isWithinRadius, isLoading, navigate, table]);

	return (
		<div className="min-h-screen flex items-center justify-center bg-base-200">
			<div className="text-center">
				<span className="loading loading-spinner loading-lg text-primary"></span>
				<p className="mt-4 text-sm text-base-content/50">
					Verifying your location...
				</p>
			</div>
		</div>
	);
};

export default OrderLanding;
