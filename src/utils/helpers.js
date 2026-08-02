export const formatCurrency = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
export const generateOrderNumber = () => `QR-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
export const getTimeElapsed = (startTime) => {
  const diff = Math.floor((Date.now() - new Date(startTime)) / 60000);
  if (diff < 1) return 'Just now';
  if (diff === 1) return '1 minute ago';
  return `${diff} minutes ago`;
};
export const truncateText = (text, maxLength = 50) => text?.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
