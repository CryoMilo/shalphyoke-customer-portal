import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSessionStore } from "../stores/useSessionStore";
import { sessionAPI } from "../api/session";

const OrderLanding = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const { setSession, setBills, setLoading } = useSessionStore();

	useEffect(() => {
		const init = async () => {
			const table = searchParams.get("table");
			const token = searchParams.get("token");

			if (!table || !token) {
				navigate("/order/invalid");
				return;
			}

			try {
				setLoading(true);
				const result = await sessionAPI.validate(parseInt(table), token);
				setSession(result.session);

				const bills = await sessionAPI.getTableBills(parseInt(table));
				setBills(bills);

				navigate(`/order/${table}/${token}`);
			} catch (error) {
				console.error("Session error:", error);
				navigate("/order/invalid");
			} finally {
				setLoading(false);
			}
		};

		init();
	}, [searchParams, navigate, setSession, setBills, setLoading]);

	return (
		<div className="min-h-screen flex items-center justify-center bg-base-200">
			<div className="text-center">
				<span className="loading loading-spinner loading-lg text-primary"></span>
				<p className="mt-4 text-sm text-base-content/50">
					Loading your table...
				</p>
			</div>
		</div>
	);
};

export default OrderLanding;
