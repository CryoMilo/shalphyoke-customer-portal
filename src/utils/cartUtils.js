export const getCartTotal = (cart) => {
	return cart.reduce(
		(sum, item) => sum + (item.final_price || item.price) * item.quantity,
		0
	);
};

export const getCartItemCount = (cart) => {
	return cart.reduce((sum, item) => sum + item.quantity, 0);
};
