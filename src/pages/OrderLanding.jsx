import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSessionStore } from "../stores/useSessionStore";
import { sessionAPI } from "../api/session";
import LoadingSpinner from "../components/Shared/LoadingSpinner";
const OrderLanding = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const { setSession, setBills } = useSessionStore();
	useEffect(() => {
		const init = async () => {
			const table = searchParams.get("table");
			const token = searchParams.get("token");
			if (!table || !token) {
				navigate("/order/invalid");
				return;
			}
			try {
				const result = await sessionAPI.validate(parseInt(table), token);
				setSession(result.session);
				const bills = await sessionAPI.getTableBills(parseInt(table));
				setBills(bills);
				navigate(`/order/${table}/${token}`);
			} catch (error) {
				console.error("Session error:", error);
				navigate("/order/invalid");
			}
		};
		init();
	}, [searchParams, navigate, setSession, setBills]);
	return <LoadingSpinner />;
};
export default OrderLanding;
