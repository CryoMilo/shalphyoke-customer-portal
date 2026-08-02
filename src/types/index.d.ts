export interface MenuItem {
  id: string;
  name_burmese: string;
  name_english: string;
  price: number;
  category: string;
  image_url?: string;
  is_active: boolean;
  is_regular: boolean;
  is_combo: boolean;
}
export interface OrderItem {
  id: string;
  name_burmese: string;
  quantity: number;
  price: number;
  final_price: number;
  cart_id: string;
}
export interface Order {
  id: string;
  order_number: string;
  table_number: number;
  customer_name?: string;
  customer_phone?: string;
  order_items: OrderItem[];
  subtotal: number;
  total_amount: number;
  payment_status: 'unpaid' | 'paid' | 'refunded';
  pos_order_status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'completed';
  created_at: string;
}
export interface TableSession {
  id: string;
  table_number: number;
  session_token: string;
  status: 'active' | 'expired' | 'abandoned';
  created_at: string;
  expires_at: string;
}
