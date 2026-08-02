import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import OrderLanding from './pages/OrderLanding';
import QROrder from './pages/QROrder';
import QRStatus from './pages/QRStatus';
import QRComplete from './pages/QRComplete';
const InvalidQR = () => (
  <div className="max-w-md mx-auto p-4 min-h-screen flex items-center justify-center bg-base-100">
    <div className="card bg-base-200 shadow-xl w-full">
      <div className="card-body text-center">
        <div className="text-6xl mb-4">🔴</div>
        <h2 className="card-title text-2xl justify-center">Invalid QR Code</h2>
        <p className="text-base-content/70">This QR code is invalid or has expired. Please scan a valid QR code at your table.</p>
        <button className="btn btn-primary mt-4" onClick={() => window.location.reload()}>Try Again</button>
      </div>
    </div>
  </div>
);
function App() {
  return (
    <BrowserRouter>
      <Toaster position="bottom-center" toastOptions={{ duration: 3000, style: { maxWidth: '400px' } }} />
      <Routes>
        <Route path="/" element={<Navigate to="/order" />} />
        <Route path="/order" element={<OrderLanding />} />
        <Route path="/order/:table/:token" element={<QROrder />} />
        <Route path="/order/status/:orderId" element={<QRStatus />} />
        <Route path="/order/complete/:tableNumber" element={<QRComplete />} />
        <Route path="/order/invalid" element={<InvalidQR />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
