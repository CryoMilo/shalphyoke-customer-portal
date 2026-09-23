import { useParams } from "react-router-dom";
import WaitingForApproval from "../components/Checkout/WaitingForApproval";

const QRStatus = () => {
	const { orderId } = useParams();

	return (
		<div className="min-h-screen bg-base-200 py-4 px-4">
			<WaitingForApproval orderIdProp={orderId} />
		</div>
	);
};

export default QRStatus;
