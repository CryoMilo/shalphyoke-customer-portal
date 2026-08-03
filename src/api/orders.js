import { supabase } from './supabase';
export const orderAPI = {
  create: async (orderData) => {
    const orderNumber = `QR-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const { data, error } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        order_type: 'dine_in',
        order_source: 'qr',
        table_number: orderData.tableNumber,
        customer_name: orderData.customerName || null,
        customer_phone: orderData.customerPhone || null,
        order_items: orderData.items,
        subtotal: orderData.subtotal,
        total_amount: orderData.total,
        payment_status: 'unpaid',
        pos_order_status: 'pending',
        notes: orderData.notes || null,
        item_notes: orderData.itemNotes || {},
        selected_extras: orderData.selectedExtras || [],
        item_extra_prices: orderData.itemExtraPrices || {}
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  getStatus: async (orderId) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    if (error) throw error;
    return data;
  },
  subscribe: (orderId, callback) => {
    return supabase
      .channel(`order-${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`
      }, (payload) => callback(payload.new))
      .subscribe();
  }
};
