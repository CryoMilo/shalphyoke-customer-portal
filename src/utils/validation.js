export const validatePhone = (phone) => {
  if (!phone) return true;
  return /^[0-9]{9,10}$/.test(phone.replace(/\s/g, ''));
};
export const validateOrder = (cart) => {
  if (!cart || cart.length === 0) return { valid: false, error: 'Cart is empty' };
  if (cart.length > 50) return { valid: false, error: 'Too many items' };
  const invalidItems = cart.filter(item => !item.id || !item.price);
  if (invalidItems.length > 0) return { valid: false, error: 'Invalid items in cart' };
  return { valid: true };
};
