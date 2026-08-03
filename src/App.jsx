import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { CartProvider } from "./context/CartContext";
import QRLayout from "./components/Layout/QRLayout";
import OrderLanding from "./pages/OrderLanding";
import QROrder from "./pages/QROrder";
import QRStatus from "./pages/QRStatus";
import QRComplete from "./pages/QRComplete";
import InvalidQR from "./components/Shared/InvalidQR";
import LocationRequest from "./pages/LocationRequest";

function App() {
	return (
		<BrowserRouter>
			<CartProvider>
				<Toaster
					position="bottom-center"
					toastOptions={{
						duration: 3000,
						style: {
							maxWidth: "400px",
							borderRadius: "12px",
							padding: "16px",
							fontWeight: "500",
						},
						success: {
							style: {
								background: "#22c55e",
								color: "white",
							},
						},
						error: {
							style: {
								background: "#ef4444",
								color: "white",
							},
						},
					}}
				/>
				<Routes>
					<Route path="/" element={<Navigate to="/order" />} />
					<Route path="/order" element={<OrderLanding />} />
					<Route path="/order/:table" element={<OrderLanding />} />
					<Route path="/order/:table/location" element={<LocationRequest />} />
					<Route path="/order/:table/menu" element={<QRLayout />}>
						<Route index element={<QROrder />} />
					</Route>
					<Route path="/order/status/:orderId" element={<QRStatus />} />
					<Route path="/order/complete/:tableNumber" element={<QRComplete />} />
					<Route path="/order/invalid" element={<InvalidQR />} />
				</Routes>
			</CartProvider>
		</BrowserRouter>
	);
}

export default App;
