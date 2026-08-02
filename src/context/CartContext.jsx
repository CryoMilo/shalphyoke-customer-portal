import { createContext, useContext, useState } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
	const [isCartOpen, setIsCartOpen] = useState(false);

	const openCart = () => setIsCartOpen(true);
	const closeCart = () => setIsCartOpen(false);
	const toggleCart = () => setIsCartOpen(!isCartOpen);

	return (
		<CartContext.Provider
			value={{ isCartOpen, openCart, closeCart, toggleCart }}>
			{children}
		</CartContext.Provider>
	);
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
	const context = useContext(CartContext);
	if (!context) {
		throw new Error("useCart must be used within a CartProvider");
	}
	return context;
};
