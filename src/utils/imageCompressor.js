/**
 * Client-Side Image Compression Utility
 * Resizes and compresses payment transfer slips before upload.
 * Reduces 3-5MB phone screenshots to ~100-150KB while keeping text and account numbers crisp.
 */
export const compressPaymentSlip = async (file, maxWidth = 1200, quality = 0.8) => {
	if (!file || !file.type.startsWith("image/")) {
		return file;
	}

	// If already smaller than 150KB, no compression needed
	if (file.size <= 150 * 1024) {
		return file;
	}

	return new Promise((resolve) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);

		reader.onload = (event) => {
			const img = new Image();
			img.src = event.target.result;

			img.onload = () => {
				let width = img.width;
				let height = img.height;

				// Scale down if larger than maxWidth
				if (width > maxWidth) {
					height = Math.round((height * maxWidth) / width);
					width = maxWidth;
				}

				const canvas = document.createElement("canvas");
				canvas.width = width;
				canvas.height = height;

				const ctx = canvas.getContext("2d");
				// Use high-quality image smoothing
				ctx.imageSmoothingEnabled = true;
				ctx.imageSmoothingQuality = "high";
				ctx.drawImage(img, 0, 0, width, height);

				canvas.toBlob(
					(blob) => {
						if (!blob) {
							resolve(file); // Fallback to original
							return;
						}

						const cleanFileName = file.name.replace(/\.[^/.]+$/, ".jpg");
						const compressedFile = new File([blob], cleanFileName, {
							type: "image/jpeg",
							lastModified: Date.now(),
						});

						resolve(compressedFile);
					},
					"image/jpeg",
					quality
				);
			};

			img.onerror = () => resolve(file); // Fallback on image load error
		};

		reader.onerror = () => resolve(file); // Fallback on file read error
	});
};

/**
 * Format bytes to readable string (e.g. 1.2 MB or 120 KB)
 */
export const formatFileSize = (bytes) => {
	if (!bytes || bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};
