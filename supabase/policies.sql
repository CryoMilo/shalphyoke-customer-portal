-- Run this in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS table_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  table_number integer NOT NULL,
  session_token text UNIQUE NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'abandoned')),
  created_at timestamptz DEFAULT now(),
  last_activity timestamptz DEFAULT now(),
  expires_at timestamptz,
  total_bills integer DEFAULT 0,
  total_amount numeric DEFAULT 0
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_source text DEFAULT 'pos' CHECK (order_source IN ('pos', 'qr'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS session_token text;

ALTER TABLE table_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "qr_select_orders" ON orders FOR SELECT USING (order_source = 'qr' AND table_number = current_setting('app.current_table', true)::int);
CREATE POLICY "qr_insert_orders" ON orders FOR INSERT WITH CHECK (order_source = 'qr' AND EXISTS (SELECT 1 FROM table_sessions WHERE session_token = current_setting('app.session_token', true)::text AND table_number = NEW.table_number AND status = 'active'));
CREATE POLICY "qr_no_update_orders" ON orders FOR UPDATE USING (false);
CREATE POLICY "qr_no_delete_orders" ON orders FOR DELETE USING (false);
CREATE POLICY "qr_select_sessions" ON table_sessions FOR SELECT USING (session_token = current_setting('app.session_token', true)::text OR table_number = current_setting('app.current_table', true)::int);
CREATE POLICY "qr_insert_sessions" ON table_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "public_read_menu" ON menu_items FOR SELECT USING (is_active = true);
