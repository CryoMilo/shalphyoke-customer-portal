import { RefreshCw } from "lucide-react";

const InvalidQR = () => {
	return (
		<div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
			<div className="card bg-base-100 shadow-lg border border-base-200 max-w-md w-full">
				<div className="card-body items-center text-center p-8">
					<div className="text-6xl mb-4">🔴</div>
					<h2 className="card-title text-2xl">Invalid QR Code</h2>
					<p className="text-base-content/60 text-sm">
						This QR code is invalid or has expired.
						<br />
						Please scan a valid QR code at your table.
					</p>
					<button
						className="btn btn-primary mt-4 gap-2"
						onClick={() => window.location.reload()}>
						<RefreshCw className="w-4 h-4" />
						Try Again
					</button>
				</div>
			</div>
		</div>
	);
};

export default InvalidQR;
