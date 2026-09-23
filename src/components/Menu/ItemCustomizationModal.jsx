import { useState, useMemo } from "react";
import { X, Plus, Minus, Check, Sparkles, MessageSquare } from "lucide-react";
import { useLanguageStore, getItemName } from "../../stores/useLanguageStore";

// Moderate character limit on customer item notes (~15-20 words)
const MAX_NOTE_LENGTH = 100;

const parseInitialCustomization = (item, initialNote, initialQuantity) => {
	const availableExtras = item?.available_extras || [];
	const qty = Math.max(1, Number(initialQuantity) || 1);
	let extraIds = [];
	let custom = "";

	if (initialNote) {
		const noteParts = initialNote.split(",").map((s) => s.trim()).filter(Boolean);

		availableExtras.forEach((extra) => {
			const names = [
				extra.name_burmese,
				extra.name_english?.trim(),
				extra.name_thai?.trim(),
			].filter(Boolean);

			if (noteParts.some((part) => names.includes(part))) {
				extraIds.push(extra.id);
			}
		});

		noteParts.forEach((part) => {
			const isExtraName = availableExtras.some((extra) => {
				const names = [
					extra.name_burmese,
					extra.name_english?.trim(),
					extra.name_thai?.trim(),
				].filter(Boolean);
				return names.includes(part);
			});

			if (isExtraName) return;

			custom = custom ? `${custom}, ${part}` : part;
		});
	} else {
		extraIds = availableExtras.filter((e) => e.is_default).map((e) => e.id);
	}

	return {
		quantity: qty,
		selectedExtraIds: extraIds,
		customNote: custom.slice(0, MAX_NOTE_LENGTH),
	};
};

const ItemCustomizationModalContent = ({
	item,
	initialNote = "",
	initialQuantity = 1,
	isEditing = false,
	onClose,
	onConfirm,
}) => {
	const { currentLang } = useLanguageStore();

	const initialData = useMemo(
		() => parseInitialCustomization(item, initialNote, initialQuantity),
		[item, initialNote, initialQuantity]
	);

	const [quantity, setQuantity] = useState(initialData.quantity);
	const [selectedExtraIds, setSelectedExtraIds] = useState(initialData.selectedExtraIds);
	const [customNote, setCustomNote] = useState(initialData.customNote);

	const availableExtras = item?.available_extras || [];
	const requiresAddon = Boolean(item?.requires_addon);

	const primaryName = getItemName(item, currentLang);
	const secondaryName =
		currentLang === "en"
			? item.name_burmese || item.name_thai
			: item.name_english;

	// Toggle extra selection
	const handleToggleExtra = (extraId) => {
		setSelectedExtraIds((prev) => {
			if (prev.includes(extraId)) {
				return prev.filter((id) => id !== extraId);
			}
			return [...prev, extraId];
		});
	};

	// Calculate prices
	const selectedExtrasList = availableExtras.filter((e) =>
		selectedExtraIds.includes(e.id)
	);

	const unitExtraPrice = selectedExtrasList.reduce(
		(sum, e) => sum + (Number(e.additional_price) || 0),
		0
	);

	const unitTotalPrice = (Number(item.price) || 0) + unitExtraPrice;
	const lineTotalPrice = unitTotalPrice * quantity;

	const isAddonRequirementMet = !requiresAddon || selectedExtraIds.length > 0;

	// Handle Add to Cart / Save
	const handleSave = () => {
		if (!isAddonRequirementMet) return;

		// Compile clean unified note string: [Extras, Custom Note]
		const noteParts = [];

		selectedExtrasList.forEach((extra) => {
			const extraName =
				currentLang === "mm"
					? extra.name_burmese || extra.name_english
					: extra.name_english || extra.name_burmese;
			if (extraName) noteParts.push(extraName.trim());
		});

		const trimmedCustom = customNote.trim().slice(0, MAX_NOTE_LENGTH);
		if (trimmedCustom) {
			noteParts.push(trimmedCustom);
		}

		const combinedNote = noteParts.join(", ");

		onConfirm({
			item,
			note: combinedNote,
			extraPrice: unitExtraPrice,
			quantity,
		});

		onClose();
	};

	return (
		<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
			{/* Backdrop click to dismiss */}
			<div className="absolute inset-0" onClick={onClose} />

			{/* Modal Dialog Content */}
			<div className="relative bg-base-100 w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden z-10 animate-slideUp">
				{/* Header */}
				<div className="p-4 sm:p-5 border-b border-base-200 flex items-start justify-between gap-3 bg-base-100/90 backdrop-blur-md sticky top-0 z-20">
					<div className="space-y-0.5 max-w-[85%]">
						<h3 className="text-lg font-black text-base-content leading-tight">
							{primaryName}
						</h3>
						{secondaryName && secondaryName !== primaryName && (
							<p className="text-xs text-base-content/60 font-medium">
								{secondaryName}
							</p>
						)}
						<div className="pt-1 flex items-center gap-2">
							<span className="font-mono font-extrabold text-primary text-base">
								฿{item.price}
							</span>
							<span className="text-[11px] text-base-content/40 font-semibold">
								Base Price
							</span>
						</div>
					</div>

					<button
						type="button"
						onClick={onClose}
						className="btn btn-sm btn-ghost btn-circle text-base-content/60 hover:text-base-content shrink-0">
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Scrollable Body */}
				<div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
					{/* Item Description if present */}
					{item.description && (
						<p className="text-xs text-base-content/70 leading-relaxed bg-base-200/50 p-3 rounded-2xl border border-base-200/60">
							{item.description}
						</p>
					)}

					{/* 1. Add-ons & Toppings Selection */}
					{availableExtras.length > 0 && (
						<div className="space-y-2.5">
							<div className="flex items-center justify-between">
								<label className="text-xs font-black uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
									<Sparkles className="w-3.5 h-3.5 text-primary" />
									<span>Toppings &amp; Add-ons</span>
								</label>
								{requiresAddon ? (
									<span className="badge badge-warning font-extrabold text-[10px] px-2 py-0.5 shadow-xs">
										Required (Min 1)
									</span>
								) : (
									<span className="badge badge-ghost font-bold text-[10px] text-base-content/50">
										Optional
									</span>
								)}
							</div>

							<div className="grid grid-cols-1 gap-2">
								{availableExtras.map((extra) => {
									const isSelected = selectedExtraIds.includes(extra.id);
									const extraName =
										currentLang === "mm"
											? extra.name_burmese || extra.name_english
											: extra.name_english || extra.name_burmese;
									const subName =
										currentLang === "mm"
											? extra.name_english
											: extra.name_burmese;

									return (
										<button
											key={extra.id}
											type="button"
											onClick={() => handleToggleExtra(extra.id)}
											className={`p-3 rounded-2xl border-2 text-left transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] ${
												isSelected
													? "border-primary bg-primary/10 shadow-sm"
													: "border-base-200 bg-base-100 hover:border-primary/40"
											}`}>
											<div className="flex items-center gap-2.5">
												<div
													className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
														isSelected
															? "bg-primary text-primary-content border-primary"
															: "border-base-300 bg-base-200"
													}`}>
													{isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
												</div>
												<div>
													<div className="font-extrabold text-xs text-base-content leading-tight">
														{extraName}
													</div>
													{subName && subName !== extraName && (
														<div className="text-[10px] text-base-content/50">
															{subName}
														</div>
													)}
												</div>
											</div>

											<span className="font-mono font-extrabold text-xs text-primary">
												+฿{extra.additional_price}
											</span>
										</button>
									);
								})}
							</div>
						</div>
					)}

					{/* 2. Special Instructions / Custom Notes with Limit */}
					<div className="space-y-2 pt-1">
						<div className="flex items-center justify-between">
							<label className="text-xs font-black uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
								<MessageSquare className="w-3.5 h-3.5 text-primary" />
								<span>Special Instructions</span>
							</label>
							<span
								className={`text-[10px] font-mono font-bold ${
									customNote.length >= MAX_NOTE_LENGTH
										? "text-error font-extrabold"
										: "text-base-content/40"
								}`}>
								{customNote.length}/{MAX_NOTE_LENGTH}
							</span>
						</div>

						<textarea
							rows={2}
							maxLength={MAX_NOTE_LENGTH}
							value={customNote}
							onChange={(e) => setCustomNote(e.target.value)}
							placeholder="e.g. less spicy, soup on side, no coriander..."
							className="textarea textarea-bordered w-full rounded-2xl bg-base-200/50 border-base-300 text-xs font-medium focus:border-primary resize-none placeholder:text-base-content/40 leading-relaxed"
						/>
						<p className="text-[10px] text-base-content/45 font-medium">
							Max {MAX_NOTE_LENGTH} characters for kitchen instructions.
						</p>
					</div>
				</div>

				{/* Footer Bar: Quantity & Add to Cart Button */}
				<div className="p-4 sm:p-5 border-t border-base-200 bg-base-100 flex items-center gap-3">
					{/* Quantity Controls */}
					<div className="flex items-center gap-1.5 bg-base-200 p-1 rounded-2xl border border-base-300 shrink-0">
						<button
							type="button"
							onClick={() => setQuantity((q) => Math.max(1, q - 1))}
							className="btn btn-sm btn-ghost btn-circle w-8 h-8 min-h-0 text-base-content hover:bg-base-300">
							<Minus className="w-3.5 h-3.5" />
						</button>
						<span className="font-mono font-extrabold text-sm w-6 text-center">
							{quantity}
						</span>
						<button
							type="button"
							onClick={() => setQuantity((q) => q + 1)}
							className="btn btn-sm btn-ghost btn-circle w-8 h-8 min-h-0 text-base-content hover:bg-base-300">
							<Plus className="w-3.5 h-3.5" />
						</button>
					</div>

					{/* Confirm / Add to Cart Button */}
					<button
						type="button"
						disabled={!isAddonRequirementMet}
						onClick={handleSave}
						className="btn btn-primary flex-1 shadow-lg font-extrabold text-primary-content rounded-2xl h-11 min-h-0 text-sm flex items-center justify-between px-4 disabled:opacity-50">
						<span>{isEditing ? "Update Item" : "Add to Cart"}</span>
						<span className="font-mono font-black">
							฿{lineTotalPrice.toFixed(2)}
						</span>
					</button>
				</div>
			</div>
		</div>
	);
};

const ItemCustomizationModal = (props) => {
	if (!props.isOpen || !props.item) return null;
	const key = `${props.item.id}_${props.item.cart_id || "new"}_${props.initialNote || ""}_${props.initialQuantity || 1}`;
	return <ItemCustomizationModalContent key={key} {...props} />;
};

export default ItemCustomizationModal;
