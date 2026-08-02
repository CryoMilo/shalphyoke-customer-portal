import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSessionStore } from "../stores/useSessionStore";
import { sessionAPI } from "../api/session";
import LoadingSpinner from "../components/Shared/LoadingSpinner";

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
				setSession(result.session); // ← This should work now
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

	return <LoadingSpinner />;
};

export default OrderLanding;
