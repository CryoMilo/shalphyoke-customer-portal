export const getCartTotal = (cart) => {
	if (!Array.isArray(cart)) return 0;
	return cart.reduce((sum, item) => {
		const unitPrice =
			item.final_price !== undefined
				? Number(item.final_price)
				: (Number(item.price) || 0) + (Number(item.extra_price) || 0);
		return sum + unitPrice * (Number(item.quantity) || 1);
	}, 0);
};

export const getCartItemCount = (cart) => {
	if (!Array.isArray(cart)) return 0;
	return cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
};
