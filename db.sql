-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.weekly_menu (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  week_from date NOT NULL,
  week_to date NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  status USER-DEFINED NOT NULL DEFAULT 'Draft'::weekly_menu_status,
  CONSTRAINT weekly_menu_pkey PRIMARY KEY (id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_number text NOT NULL,
  order_type USER-DEFINED NOT NULL DEFAULT 'dine_in'::order_type,
  customer_name text,
  customer_phone text,
  delivery_address text,
  table_number integer,
  order_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  payment_method USER-DEFINED DEFAULT 'unpaid'::payment_method,
  payment_status USER-DEFINED NOT NULL DEFAULT 'unpaid'::payment_status,
  pos_order_status USER-DEFINED NOT NULL DEFAULT 'pending'::pos_order_status,
  notes text,
  item_notes jsonb DEFAULT '{}'::jsonb,
  served_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  selected_extras jsonb DEFAULT '[]'::jsonb,
  item_extra_prices jsonb DEFAULT '{}'::jsonb,
  delivery_fee numeric,
  order_source text DEFAULT 'pos'::text CHECK (order_source = ANY (ARRAY['pos'::text, 'qr'::text])),
  session_token text,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_served_by_fkey FOREIGN KEY (served_by) REFERENCES auth.users(id)
);
CREATE TABLE public.menu_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name_burmese text NOT NULL,
  name_english text NOT NULL,
  name_thai text,
  price numeric NOT NULL,
  taste_profile text,
  category USER-DEFINED NOT NULL,
  image_url text,
  description text,
  sensitive_ingredients ARRAY,
  is_active boolean DEFAULT true,
  is_regular boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  is_combo boolean NOT NULL DEFAULT false,
  combo_type text CHECK (combo_type = ANY (ARRAY['fixed'::text, 'rotating'::text])),
  combo_members jsonb,
  combo_slots jsonb,
  combo_note_summary text,
  is_vegan boolean NOT NULL DEFAULT false,
  quick_note_ids ARRAY DEFAULT '{}'::uuid[],
  CONSTRAINT menu_items_pkey PRIMARY KEY (id)
);
CREATE TABLE public.weekly_menu_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  weekly_menu_id uuid NOT NULL,
  weekday text NOT NULL,
  menu_item_id uuid NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'Pending'::menu_completion,
  CONSTRAINT weekly_menu_items_pkey PRIMARY KEY (id),
  CONSTRAINT weekly_menu_items_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id),
  CONSTRAINT weekly_menu_items_weekly_menu_id_fkey FOREIGN KEY (weekly_menu_id) REFERENCES public.weekly_menu(id)
);
CREATE TABLE public.monthly_sales (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sale_date date NOT NULL,
  sale_timestamp timestamp with time zone NOT NULL,
  menu_item_id uuid NOT NULL,
  menu_item_name_burmese text NOT NULL,
  menu_item_name_english text,
  menu_item_category USER-DEFINED,
  menu_item_price numeric NOT NULL,
  quantity_sold integer NOT NULL DEFAULT 0,
  total_revenue numeric NOT NULL DEFAULT 0,
  order_id uuid NOT NULL,
  order_number text NOT NULL,
  order_type USER-DEFINED,
  payment_method USER-DEFINED,
  payment_status USER-DEFINED,
  created_at timestamp with time zone DEFAULT now(),
  item_notes text,
  delivery_fee numeric,
  CONSTRAINT monthly_sales_pkey PRIMARY KEY (id),
  CONSTRAINT monthly_sales_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id)
);
CREATE TABLE public.sales_archive (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sale_date date NOT NULL,
  sale_timestamp timestamp with time zone NOT NULL,
  menu_item_id uuid NOT NULL,
  menu_item_name_burmese text NOT NULL,
  menu_item_name_english text,
  menu_item_category USER-DEFINED,
  menu_item_price numeric NOT NULL,
  quantity_sold integer NOT NULL DEFAULT 0,
  total_revenue numeric NOT NULL DEFAULT 0,
  order_id uuid NOT NULL,
  order_number text NOT NULL,
  order_type USER-DEFINED,
  payment_method USER-DEFINED,
  payment_status USER-DEFINED,
  created_at timestamp with time zone DEFAULT now(),
  archived_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sales_archive_pkey PRIMARY KEY (id)
);
CREATE TABLE public.daily_cash (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE UNIQUE,
  opening_balance numeric NOT NULL DEFAULT 0,
  closing_balance numeric NOT NULL DEFAULT 0,
  cash_sales numeric NOT NULL DEFAULT 0,
  card_sales numeric NOT NULL DEFAULT 0,
  online_sales numeric NOT NULL DEFAULT 0,
  cash_collected numeric NOT NULL DEFAULT 0,
  cash_deposited numeric NOT NULL DEFAULT 0,
  cash_shortage numeric DEFAULT (cash_collected - cash_deposited),
  notes text,
  verified_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT daily_cash_pkey PRIMARY KEY (id),
  CONSTRAINT daily_cash_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES auth.users(id)
);
CREATE TABLE public.monthly_overheads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  month date NOT NULL,
  category USER-DEFINED NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  due_date date,
  paid_date date,
  is_recurring boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT monthly_overheads_pkey PRIMARY KEY (id)
);
CREATE TABLE public.additional_income (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  category USER-DEFINED NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  payment_method USER-DEFINED NOT NULL DEFAULT 'cash'::payment_method,
  notes text,
  recorded_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT additional_income_pkey PRIMARY KEY (id),
  CONSTRAINT additional_income_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES auth.users(id)
);
CREATE TABLE public.daily_expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL,
  amount numeric NOT NULL,
  paid_by text NOT NULL DEFAULT 'cash_drawer'::text,
  notes text,
  recorded_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT daily_expenses_pkey PRIMARY KEY (id),
  CONSTRAINT daily_expenses_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES auth.users(id)
);
CREATE TABLE public.vendors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  line_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vendors_pkey PRIMARY KEY (id)
);
CREATE TABLE public.inventory_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Other'::text,
  default_vendor_id uuid,
  unit text NOT NULL DEFAULT 'piece'::text,
  image_url text,
  is_regular boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  quantity numeric DEFAULT 0,
  threshold numeric DEFAULT 0,
  CONSTRAINT inventory_items_pkey PRIMARY KEY (id),
  CONSTRAINT inventory_items_default_vendor_id_fkey FOREIGN KEY (default_vendor_id) REFERENCES public.vendors(id)
);
CREATE TABLE public.market_list (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  inventory_item_id uuid,
  custom_item_name text,
  vendor_id uuid,
  quantity numeric NOT NULL DEFAULT 1,
  unit text NOT NULL,
  notes text,
  added_by uuid,
  added_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_ordered boolean DEFAULT false,
  order_id uuid,
  ordered_at timestamp with time zone,
  CONSTRAINT market_list_pkey PRIMARY KEY (id),
  CONSTRAINT market_list_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id),
  CONSTRAINT market_list_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id),
  CONSTRAINT market_list_added_by_fkey FOREIGN KEY (added_by) REFERENCES auth.users(id)
);
CREATE TABLE public.procurement_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_number text UNIQUE,
  vendor_id uuid,
  status text NOT NULL DEFAULT 'ordered'::text,
  estimated_arrival timestamp with time zone,
  notes text,
  total_items integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  confirmed_at timestamp with time zone DEFAULT now(),
  arrived_at timestamp with time zone,
  CONSTRAINT procurement_orders_pkey PRIMARY KEY (id),
  CONSTRAINT procurement_orders_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id)
);
CREATE TABLE public.procurement_order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid,
  market_list_item_id uuid,
  inventory_item_id uuid,
  custom_item_name text,
  vendor_id uuid,
  quantity numeric NOT NULL,
  unit text NOT NULL,
  notes text,
  received boolean DEFAULT false,
  received_quantity numeric,
  is_missed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT procurement_order_items_pkey PRIMARY KEY (id),
  CONSTRAINT procurement_order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.procurement_orders(id),
  CONSTRAINT procurement_order_items_market_list_item_id_fkey FOREIGN KEY (market_list_item_id) REFERENCES public.market_list(id),
  CONSTRAINT procurement_order_items_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id),
  CONSTRAINT procurement_order_items_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id)
);
CREATE TABLE public.menu_item_extras (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  menu_item_id uuid,
  extra_item_id uuid,
  additional_price numeric NOT NULL DEFAULT 0,
  sort_order integer DEFAULT 0,
  is_default boolean DEFAULT false,
  max_quantity integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT menu_item_extras_pkey PRIMARY KEY (id),
  CONSTRAINT menu_item_extras_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id),
  CONSTRAINT menu_item_extras_extra_item_id_fkey FOREIGN KEY (extra_item_id) REFERENCES public.menu_items(id)
);
CREATE TABLE public.quick_note_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  type text NOT NULL,
  group_name text,
  applicable_categories ARRAY,
  options jsonb DEFAULT '["No", "Low", "Med", "High"]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  scope text NOT NULL DEFAULT 'all'::text CHECK (scope = ANY (ARRAY['all'::text, 'rotating'::text, 'regular'::text, 'combo'::text])),
  label text NOT NULL,
  CONSTRAINT quick_note_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.print_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'printing'::text, 'done'::text, 'failed'::text])),
  order_no text NOT NULL,
  table_no text,
  items jsonb NOT NULL,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  printed_at timestamp with time zone,
  customer_name text,
  delivery_address text,
  customer_phone text,
  payment_method USER-DEFINED,
  discount_amount numeric,
  subtotal numeric,
  total_amount numeric,
  delivery_fee numeric,
  CONSTRAINT print_jobs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.quick_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  label text NOT NULL,
  type text NOT NULL,
  options jsonb DEFAULT '["No", "Low", "Med", "High"]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quick_notes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.app_settings (
  key text NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT app_settings_pkey PRIMARY KEY (key)
);
CREATE TABLE public.employees (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  address text,
  position text,
  daily_rate numeric,
  salary numeric,
  hire_date date NOT NULL DEFAULT CURRENT_DATE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT employees_pkey PRIMARY KEY (id)
);
CREATE TABLE public.employee_absences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  absence_date date NOT NULL DEFAULT CURRENT_DATE,
  points numeric NOT NULL DEFAULT 1.0 CHECK (points = ANY (ARRAY[0.5, 1.0])),
  reason text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT employee_absences_pkey PRIMARY KEY (id),
  CONSTRAINT employee_absences_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id)
);
CREATE TABLE public.bonus_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pool_percentage numeric NOT NULL DEFAULT 10.0 CHECK (pool_percentage >= 0::numeric AND pool_percentage <= 100::numeric),
  allowed_absences numeric NOT NULL DEFAULT 4.0 CHECK (allowed_absences >= 0::numeric),
  penalty_tiers jsonb NOT NULL DEFAULT '{"2": 50, "3": 75, "4": 100}'::jsonb,
  effective_from date NOT NULL,
  effective_to date,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  CONSTRAINT bonus_config_pkey PRIMARY KEY (id),
  CONSTRAINT bonus_config_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.employee_bonus_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  bonus_month date NOT NULL,
  total_bonus_pool numeric NOT NULL CHECK (total_bonus_pool >= 0::numeric),
  employee_share_percentage numeric NOT NULL CHECK (employee_share_percentage >= 0::numeric),
  base_bonus_amount numeric NOT NULL CHECK (base_bonus_amount >= 0::numeric),
  absence_points numeric NOT NULL DEFAULT 0 CHECK (absence_points >= 0::numeric),
  penalty_percentage numeric DEFAULT 0 CHECK (penalty_percentage = ANY (ARRAY[0::numeric, 50::numeric, 75::numeric, 100::numeric])),
  final_bonus_amount numeric NOT NULL CHECK (final_bonus_amount >= 0::numeric),
  bonus_paid boolean DEFAULT false,
  paid_date date,
  config_snapshot jsonb NOT NULL,
  calculated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT employee_bonus_log_pkey PRIMARY KEY (id),
  CONSTRAINT employee_bonus_log_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id)
);
CREATE TABLE public.table_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  table_number integer NOT NULL,
  session_token text NOT NULL UNIQUE,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'expired'::text, 'abandoned'::text])),
  created_at timestamp with time zone DEFAULT now(),
  last_activity timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  total_bills integer DEFAULT 0,
  total_amount numeric DEFAULT 0,
  CONSTRAINT table_sessions_pkey PRIMARY KEY (id)
);