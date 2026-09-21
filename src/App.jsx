import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { CartProvider } from "./context/CartContext";
import QRLayout from "./components/Layout/QRLayout";
import QROrder from "./pages/QROrder";
import QRStatus from "./pages/QRStatus";

function App() {
	return (
		<BrowserRouter>
			<CartProvider>
				<Toaster
					position="bottom-center"
					toastOptions={{
						duration: 3500,
						style: {
							maxWidth: "420px",
							borderRadius: "14px",
							padding: "14px 18px",
							fontWeight: "600",
							fontSize: "14px",
						},
						success: {
							style: {
								background: "#16a34a",
								color: "white",
							},
						},
						error: {
							style: {
								background: "#dc2626",
								color: "white",
							},
						},
					}}
				/>
				<Routes>
					{/* Main Customer Web Delivery Portal */}
					<Route path="/" element={<QRLayout />}>
						<Route index element={<QROrder />} />
					</Route>

					{/* Live Order & Delivery Tracking */}
					<Route path="/order/status/:orderId" element={<QRStatus />} />

					{/* Graceful Fallbacks for any legacy QR links */}
					<Route path="/order" element={<Navigate to="/" replace />} />
					<Route path="/order/:table" element={<Navigate to="/" replace />} />
					<Route path="/order/:table/*" element={<Navigate to="/" replace />} />
					<Route path="/menu" element={<Navigate to="/" replace />} />

					{/* Catch-all */}
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
			</CartProvider>
		</BrowserRouter>
	);
}

export default App;
