#!/bin/zsh
set -e
echo "🚀 Setting up Shalphyoke Customer Portal..."
echo "📂 Current directory: $(pwd)"

# Install dependencies
echo "📥 Installing dependencies..."
npm install
npm install @supabase/supabase-js react-router-dom zustand react-hot-toast qrcode.react lucide-react
npm install -D @types/react @types/react-dom eslint @vitejs/plugin-react

# Create folders
echo "📁 Creating folder structure..."
mkdir -p src/api src/pages src/components/{Menu,Cart,Shared,Layout} src/stores src/hooks src/utils src/types

# Create .env files
echo "🔐 Creating environment files..."
cat > .env << 'EOF'
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_NAME=Shalphyoke Customer Portal
VITE_APP_URL=http://localhost:5173
VITE_SESSION_TIMEOUT=3600
EOF

cat > .env.example << 'EOF'
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_NAME=Shalphyoke Customer Portal
VITE_APP_URL=https://order.yourdomain.com
VITE_SESSION_TIMEOUT=3600
VITE_PROMPTPAY_ID=0812345678
EOF

# API Files
echo "📡 Creating API files..."
cat > src/api/supabase.js << 'EOF'
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  realtime: { params: { eventsPerSecond: 10 } }
});
EOF

cat > src/api/session.js << 'EOF'
import { supabase } from './supabase';
export const sessionAPI = {
  validate: async (tableNumber, token) => {
    const { data, error } = await supabase
      .from('table_sessions')
      .select('*')
      .eq('table_number', tableNumber)
      .eq('session_token', token)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .single();
    if (error && error.code === 'PGRST116') {
      return await sessionAPI.create(tableNumber);
    }
    if (error) throw error;
    await supabase
      .from('table_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', data.id);
    return { session: data, isNew: false };
  },
  create: async (tableNumber) => {
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(22, 0, 0, 0);
    const { data, error } = await supabase
      .from('table_sessions')
      .insert({
        table_number: tableNumber,
        session_token: token,
        expires_at: expiresAt.toISOString(),
        status: 'active'
      })
      .select()
      .single();
    if (error) throw error;
    return { session: data, isNew: true };
  },
  getTableBills: async (tableNumber) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('table_number', tableNumber)
      .eq('order_source', 'qr')
      .in('pos_order_status', ['pending', 'preparing', 'ready', 'delivered'])
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  }
};
EOF

cat > src/api/menu.js << 'EOF'
import { supabase } from './supabase';
const getTodayWeekday = () => {
  const d = new Date();
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return weekdays[d.getDay()];
};
export const menuAPI = {
  getActiveMenu: async () => {
    const today = getTodayWeekday();
    let specials = [];
    const { data: weeklyMenu } = await supabase
      .from('weekly_menu')
      .select('id')
      .eq('status', 'Published')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (weeklyMenu) {
      const { data } = await supabase
        .from('weekly_menu_items')
        .select(`menu_items:menu_item_id (*)`)
        .eq('weekly_menu_id', weeklyMenu.id)
        .eq('weekday', today);
      specials = data?.map(item => item.menu_items).filter(Boolean) || [];
    }
    const { data: regulars } = await supabase
      .from('menu_items')
      .select('*')
      .eq('is_active', true)
      .eq('is_regular', true)
      .eq('is_combo', false)
      .order('category');
    const { data: combos } = await supabase
      .from('menu_items')
      .select('*')
      .eq('is_active', true)
      .eq('is_combo', true)
      .order('name_burmese');
    return {
      specials: specials || [],
      regulars: regulars || [],
      combos: combos || [],
      allItems: [...(specials || []), ...(regulars || []), ...(combos || [])]
    };
  }
};
EOF

cat > src/api/orders.js << 'EOF'
import { supabase } from './supabase';
export const orderAPI = {
  create: async (orderData, sessionToken) => {
    const orderNumber = `QR-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const { data, error } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        order_type: 'dine_in',
        order_source: 'qr',
        table_number: orderData.tableNumber,
        session_token: sessionToken,
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
EOF

# Stores
echo "📦 Creating store files..."
cat > src/stores/useSessionStore.js << 'EOF'
import { create } from 'zustand';
export const useSessionStore = create((set) => ({
  session: null,
  bills: [],
  isLoading: false,
  setSession: (session) => set({ session }),
  setBills: (bills) => set({ bills }),
  setLoading: (isLoading) => set({ isLoading }),
  addBill: (bill) => set((state) => ({ bills: [...state.bills, bill] })),
  updateBill: (updatedBill) => set((state) => ({
    bills: state.bills.map(bill => bill.id === updatedBill.id ? updatedBill : bill)
  })),
  removeBill: (billId) => set((state) => ({
    bills: state.bills.filter(bill => bill.id !== billId)
  }))
}));
EOF

cat > src/stores/useCartStore.js << 'EOF'
import { create } from 'zustand';
export const useCartStore = create((set, get) => ({
  cart: [],
  addToCart: (item) => {
    set((state) => {
      const existing = state.cart.find(i => i.id === item.id);
      if (existing) {
        return {
          cart: state.cart.map(i =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          )
        };
      }
      return {
        cart: [...state.cart, { ...item, quantity: 1, cart_id: crypto.randomUUID() }]
      };
    });
  },
  removeFromCart: (cartId) => {
    set((state) => ({ cart: state.cart.filter(i => i.cart_id !== cartId) }));
  },
  updateQuantity: (cartId, delta) => {
    set((state) => {
      const item = state.cart.find(i => i.cart_id === cartId);
      if (!item) return state;
      const newQuantity = item.quantity + delta;
      if (newQuantity <= 0) {
        return { cart: state.cart.filter(i => i.cart_id !== cartId) };
      }
      return {
        cart: state.cart.map(i =>
          i.cart_id === cartId ? { ...i, quantity: newQuantity } : i
        )
      };
    });
  },
  clearCart: () => set({ cart: [] }),
  get total() {
    return get().cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }
}));
EOF

cat > src/stores/useMenuStore.js << 'EOF'
import { create } from 'zustand';
import { menuAPI } from '../api/menu';
export const useMenuStore = create((set) => ({
  menuItems: [],
  specials: [],
  regulars: [],
  combos: [],
  isLoading: false,
  error: null,
  fetchMenu: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await menuAPI.getActiveMenu();
      set({
        menuItems: data.allItems,
        specials: data.specials,
        regulars: data.regulars,
        combos: data.combos,
        isLoading: false
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  }
}));
EOF

cat > src/stores/useOrderStore.js << 'EOF'
import { create } from 'zustand';
export const useOrderStore = create((set) => ({
  currentOrder: null,
  orderStatus: null,
  isPlacingOrder: false,
  setCurrentOrder: (order) => set({ currentOrder: order }),
  setOrderStatus: (status) => set({ orderStatus: status }),
  setPlacingOrder: (isPlacing) => set({ isPlacingOrder: isPlacing }),
  resetOrder: () => set({ currentOrder: null, orderStatus: null, isPlacingOrder: false })
}));
EOF

# Components
echo "🎨 Creating component files..."
cat > src/components/Menu/MenuGrid.jsx << 'EOF'
import React, { useState } from 'react';
import MenuItemCard from './MenuItemCard';
import CategoryFilter from './CategoryFilter';
const MenuGrid = ({ items, onAddItem, categories }) => {
  const [activeCategory, setActiveCategory] = useState(categories?.[0] || 'All');
  const filteredItems = activeCategory === 'All' 
    ? items 
    : items.filter(item => item.category === activeCategory);
  return (
    <div>
      {categories && categories.length > 0 && (
        <CategoryFilter 
          categories={categories} 
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        {filteredItems.map((item) => (
          <MenuItemCard key={item.id} item={item} onAdd={() => onAddItem(item)} />
        ))}
      </div>
    </div>
  );
};
export default MenuGrid;
EOF

cat > src/components/Menu/MenuItemCard.jsx << 'EOF'
import React from 'react';
import { Plus } from 'lucide-react';
const MenuItemCard = ({ item, onAdd }) => {
  return (
    <div className="bg-base-100 border border-base-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {item.image_url && (
        <img src={item.image_url} alt={item.name_english} className="w-full h-24 object-cover rounded-lg mb-3" />
      )}
      <h3 className="font-semibold text-sm line-clamp-2">{item.name_burmese}</h3>
      {item.name_english && <p className="text-xs text-base-content/70 truncate">{item.name_english}</p>}
      <div className="flex justify-between items-center mt-3">
        <span className="font-bold text-primary">฿{item.price}</span>
        <button className="btn btn-primary btn-sm btn-circle" onClick={onAdd}>
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
export default MenuItemCard;
EOF

cat > src/components/Menu/CategoryFilter.jsx << 'EOF'
import React from 'react';
const CategoryFilter = ({ categories, activeCategory, onCategoryChange }) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {categories.map((category) => (
        <button
          key={category}
          className={`btn btn-sm whitespace-nowrap ${
            activeCategory === category ? 'btn-primary' : 'btn-ghost'
          }`}
          onClick={() => onCategoryChange(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
};
export default CategoryFilter;
EOF

cat > src/components/Cart/CartDrawer.jsx << 'EOF'
import React, { useState } from 'react';
import { X } from 'lucide-react';
import CartItem from './CartItem';
const CartDrawer = ({ isOpen, onClose, onPlaceOrder, cart, total }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    try {
      await onPlaceOrder({ name: customerName, phone: customerPhone, notes: notes });
      setCustomerName('');
      setCustomerPhone('');
      setNotes('');
      onClose();
    } catch (error) {
      console.error('Order error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <div className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      <div className={`absolute right-0 top-0 h-full w-full max-w-md bg-base-100 shadow-xl transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-4 border-b border-base-200">
            <h2 className="text-xl font-bold">Your Cart</h2>
            <button className="btn btn-sm btn-ghost btn-circle" onClick={onClose}><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-12 opacity-50">
                <p className="text-lg">Your cart is empty</p>
                <p className="text-sm">Add some delicious items!</p>
              </div>
            ) : (
              cart.map((item) => <CartItem key={item.cart_id} item={item} />)
            )}
          </div>
          {cart.length > 0 && (
            <div className="p-4 border-t border-base-200 space-y-3">
              <input type="text" placeholder="Your name (optional)" className="input input-bordered w-full" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              <input type="tel" placeholder="Phone number (optional)" className="input input-bordered w-full" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
              <textarea placeholder="Special instructions (optional)" className="textarea textarea-bordered w-full" rows="2" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          )}
          <div className="p-4 border-t border-base-200 bg-base-200">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-bold">Total</span>
              <span className="text-2xl font-bold text-primary">฿{total.toFixed(2)}</span>
            </div>
            <button className="btn btn-primary w-full" disabled={cart.length === 0 || isSubmitting} onClick={handleSubmit}>
              {isSubmitting ? <><span className="loading loading-spinner loading-xs"></span> Placing Order...</> : `Place Order - ฿${total.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CartDrawer;
EOF

cat > src/components/Cart/CartItem.jsx << 'EOF'
import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCartStore } from '../../stores/useCartStore';
const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCartStore();
  return (
    <div className="flex justify-between items-start bg-base-200 rounded-lg p-3">
      <div className="flex-1">
        <h4 className="font-medium text-sm">{item.name_burmese}</h4>
        <p className="text-xs opacity-60">฿{item.price} × {item.quantity}</p>
      </div>
      <div className="flex items-center gap-1">
        <button className="btn btn-xs btn-ghost btn-circle" onClick={() => updateQuantity(item.cart_id, -1)}><Minus className="w-3 h-3" /></button>
        <span className="font-mono text-sm w-6 text-center">{item.quantity}</span>
        <button className="btn btn-xs btn-ghost btn-circle" onClick={() => updateQuantity(item.cart_id, 1)}><Plus className="w-3 h-3" /></button>
        <button className="btn btn-xs btn-ghost btn-circle text-error" onClick={() => removeFromCart(item.cart_id)}><Trash2 className="w-3 h-3" /></button>
      </div>
    </div>
  );
};
export default CartItem;
EOF

cat > src/components/Shared/BillView.jsx << 'EOF'
import React, { useState } from 'react';
const BillView = ({ bills }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!bills || bills.length === 0) {
    return <div className="text-center py-4 opacity-50 text-sm">No active bills at this table</div>;
  }
  const statusColors = { pending: 'badge-secondary', preparing: 'badge-warning', ready: 'badge-success', delivered: 'badge-accent' };
  const statusLabels = { pending: 'Received', preparing: 'Preparing', ready: 'Ready', delivered: 'Delivered ✅' };
  const unpaidCount = bills.filter(b => b.payment_status === 'unpaid').length;
  return (
    <div className="bg-base-200/50 rounded-lg p-4 m-4">
      <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <h3 className="font-bold flex items-center gap-2">
          📋 Bills at this table
          {unpaidCount > 0 && <span className="badge badge-warning badge-sm">{unpaidCount} unpaid</span>}
        </h3>
        <button className="btn btn-xs btn-ghost">{isExpanded ? '▲' : '▼'}</button>
      </div>
      <div className={`space-y-3 mt-3 ${isExpanded ? '' : 'max-h-32 overflow-y-auto'}`}>
        {bills.map((bill) => (
          <div key={bill.id} className="bg-base-100 rounded-lg p-3 border border-base-200">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold">#{bill.order_number?.slice(-6) || 'NEW'}</span>
                  {bill.customer_name && <span className="text-xs opacity-60">• {bill.customer_name}</span>}
                </div>
                <div className="flex gap-1 mt-1">
                  <span className={`badge badge-xs ${statusColors[bill.pos_order_status] || 'badge-ghost'}`}>
                    {statusLabels[bill.pos_order_status] || bill.pos_order_status}
                  </span>
                  {bill.payment_status === 'paid' && <span className="badge badge-xs badge-success">Paid ✅</span>}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-primary">฿{bill.total_amount}</div>
                <div className="text-[10px] opacity-50">{bill.order_items?.length || 0} items</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default BillView;
EOF

cat > src/components/Shared/OrderStatus.jsx << 'EOF'
import React from 'react';
import { CheckCircle, Clock, CookingPot, Utensils } from 'lucide-react';
const OrderStatus = ({ status }) => {
  const steps = [
    { key: 'pending', label: 'Received', icon: Clock },
    { key: 'preparing', label: 'Preparing', icon: CookingPot },
    { key: 'ready', label: 'Ready', icon: Utensils },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle },
  ];
  const currentStep = steps.findIndex(s => s.key === status);
  const isComplete = status === 'delivered';
  return (
    <div className="w-full max-w-md mx-auto p-4">
      <div className="steps steps-vertical">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index <= currentStep;
          const isCurrent = index === currentStep;
          return (
            <div key={step.key} className={`step ${isActive ? 'step-primary' : 'step-neutral'}`}>
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'opacity-50'}`} />
                <span className={isActive ? 'font-medium' : 'opacity-50'}>{step.label}</span>
                {isCurrent && !isComplete && <span className="loading loading-spinner loading-xs ml-2" />}
                {isComplete && index === steps.length - 1 && <CheckCircle className="w-4 h-4 text-success ml-2" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default OrderStatus;
EOF

cat > src/components/Shared/LoadingSpinner.jsx << 'EOF'
import React from 'react';
const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <span className="loading loading-spinner loading-lg text-primary"></span>
      <p className="mt-4 text-base-content/60">Loading...</p>
    </div>
  );
};
export default LoadingSpinner;
EOF

cat > src/components/Layout/Header.jsx << 'EOF'
import React from 'react';
const Header = ({ tableNumber, billCount }) => {
  return (
    <header className="sticky top-0 bg-base-100 z-10 border-b border-base-200 p-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Table {tableNumber}</h1>
          <p className="text-sm opacity-60">{billCount} active bill{billCount > 1 ? 's' : ''}</p>
        </div>
        <div className="text-sm opacity-40">Shalphyoke</div>
      </div>
    </header>
  );
};
export default Header;
EOF

cat > src/components/Layout/Footer.jsx << 'EOF'
import React from 'react';
const Footer = () => {
  return <footer className="text-center py-4 text-xs opacity-40"><p>Order via QR • Enjoy your meal!</p></footer>;
};
export default Footer;
EOF

# Pages
echo "📄 Creating page files..."
cat > src/pages/OrderLanding.jsx << 'EOF'
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSessionStore } from '../stores/useSessionStore';
import { sessionAPI } from '../api/session';
import LoadingSpinner from '../components/Shared/LoadingSpinner';
const OrderLanding = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSession, setBills } = useSessionStore();
  useEffect(() => {
    const init = async () => {
      const table = searchParams.get('table');
      const token = searchParams.get('token');
      if (!table || !token) {
        navigate('/order/invalid');
        return;
      }
      try {
        const result = await sessionAPI.validate(parseInt(table), token);
        setSession(result.session);
        const bills = await sessionAPI.getTableBills(parseInt(table));
        setBills(bills);
        navigate(`/order/${table}/${token}`);
      } catch (error) {
        console.error('Session error:', error);
        navigate('/order/invalid');
      }
    };
    init();
  }, [searchParams, navigate, setSession, setBills]);
  return <LoadingSpinner />;
};
export default OrderLanding;
EOF

cat > src/pages/QROrder.jsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSessionStore } from '../stores/useSessionStore';
import { useMenuStore } from '../stores/useMenuStore';
import { useCartStore } from '../stores/useCartStore';
import { orderAPI } from '../api/orders';
import { sessionAPI } from '../api/session';
import MenuGrid from '../components/Menu/MenuGrid';
import CartDrawer from '../components/Cart/CartDrawer';
import BillView from '../components/Shared/BillView';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import LoadingSpinner from '../components/Shared/LoadingSpinner';
import toast from 'react-hot-toast';
const QROrder = () => {
  const { table, token } = useParams();
  const navigate = useNavigate();
  const { session, bills, setBills } = useSessionStore();
  const { menuItems, fetchMenu, isLoading: menuLoading } = useMenuStore();
  const { cart, total, clearCart } = useCartStore();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        if (!session) {
          await sessionAPI.validate(parseInt(table), token);
        }
        const bills = await sessionAPI.getTableBills(parseInt(table));
        setBills(bills);
        await fetchMenu();
      } catch (error) {
        console.error('Init error:', error);
        toast.error('Failed to load menu');
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [table, token]);
  const handlePlaceOrder = async (customerInfo) => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    try {
      const orderData = {
        tableNumber: parseInt(table),
        customerName: customerInfo?.name || null,
        customerPhone: customerInfo?.phone || null,
        items: cart,
        subtotal: total,
        total: total,
        notes: customerInfo?.notes || null,
        itemNotes: {},
        selectedExtras: [],
        itemExtraPrices: {}
      };
      const order = await orderAPI.create(orderData, session.session_token);
      toast.success('Order placed successfully! 🎉');
      clearCart();
      navigate(`/order/status/${order.id}`);
    } catch (error) {
      console.error('Order error:', error);
      toast.error('Failed to place order. Please try again.');
    }
  };
  if (isLoading || menuLoading) {
    return <LoadingSpinner />;
  }
  const categories = ['All', ...new Set(menuItems.map(item => item.category))];
  return (
    <div className="qr-order-page min-h-screen bg-base-100">
      <Header tableNumber={table} billCount={bills?.length || 0} />
      <main className="pb-32">
        <BillView bills={bills} />
        <div className="px-4">
          <MenuGrid items={menuItems} onAddItem={(item) => useCartStore.getState().addToCart(item)} categories={categories} />
        </div>
      </main>
      <div className="fixed bottom-4 left-4 right-4">
        <button className="btn btn-primary w-full shadow-lg flex justify-between items-center" onClick={() => setIsCartOpen(true)} disabled={cart.length === 0}>
          <span>🛒 View Cart</span>
          <span className="badge badge-neutral">{cart.length} items • ฿{total.toFixed(2)}</span>
        </button>
      </div>
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} onPlaceOrder={handlePlaceOrder} cart={cart} total={total} />
      <Footer />
    </div>
  );
};
export default QROrder;
EOF

cat > src/pages/QRStatus.jsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderAPI } from '../api/orders';
import OrderStatus from '../components/Shared/OrderStatus';
import LoadingSpinner from '../components/Shared/LoadingSpinner';
import toast from 'react-hot-toast';
const QRStatus = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('loading');
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await orderAPI.getStatus(orderId);
        setOrder(data);
        setStatus(data.pos_order_status);
      } catch (error) {
        console.error('Fetch order error:', error);
        toast.error('Order not found');
        navigate('/order/invalid');
      }
    };
    fetchOrder();
    const subscription = orderAPI.subscribe(orderId, (updatedOrder) => {
      setOrder(updatedOrder);
      setStatus(updatedOrder.pos_order_status);
      if (updatedOrder.pos_order_status === 'delivered') {
        toast.success('🍽️ Your food has been delivered!');
      }
      if (updatedOrder.payment_status === 'paid') {
        toast.success('✅ Payment complete! Thank you!');
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [orderId, navigate]);
  if (!order) {
    return <LoadingSpinner />;
  }
  return (
    <div className="max-w-md mx-auto p-4 min-h-screen bg-base-100">
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl">Order Status</h2>
          <div className="text-sm opacity-60 mb-4">Order #{order.order_number?.slice(-8) || order.id.slice(0, 8)}</div>
          <OrderStatus status={status} />
          <div className="mt-6">
            <h3 className="font-bold mb-2">Your Order</h3>
            <div className="space-y-1">
              {order.order_items?.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm py-1 border-b border-base-300/50">
                  <span>{item.quantity}x {item.name_burmese}</span>
                  <span>฿{(item.final_price || item.price) * item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-2 border-t border-base-300 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-primary">฿{order.total_amount}</span>
            </div>
          </div>
          {order.payment_status === 'unpaid' && order.pos_order_status === 'delivered' && (
            <div className="alert alert-warning mt-4"><span>💳 Please pay at the counter</span></div>
          )}
          {order.payment_status === 'paid' && (
            <div className="alert alert-success mt-4"><span>✅ Payment complete! Thank you for dining with us.</span></div>
          )}
          <div className="mt-4 flex gap-2">
            <button className="btn btn-ghost btn-sm flex-1" onClick={() => navigate(`/order/${order.table_number}`)}>← Back to Menu</button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default QRStatus;
EOF

cat > src/pages/QRComplete.jsx << 'EOF'
import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
const QRComplete = () => {
  const navigate = useNavigate();
  const { tableNumber } = useParams();
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(`/order/${tableNumber}`);
    }, 10000);
    return () => clearTimeout(timer);
  }, [navigate, tableNumber]);
  return (
    <div className="max-w-md mx-auto p-4 min-h-screen flex items-center justify-center bg-base-100">
      <div className="card bg-base-200 shadow-xl w-full">
        <div className="card-body items-center text-center">
          <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-4">
            <CheckCircle className="w-12 h-12 text-success" />
          </div>
          <h2 className="card-title text-2xl">Order Complete!</h2>
          <p className="text-base-content/70">Thank you for dining with us.</p>
          <div className="divider">What would you like to do?</div>
          <div className="flex flex-col gap-2 w-full">
            <button className="btn btn-primary w-full" onClick={() => navigate(`/order/${tableNumber}`)}>Order More Food</button>
            <button className="btn btn-ghost w-full" onClick={() => window.close()}>Close</button>
          </div>
          <p className="text-xs opacity-40 mt-4">Redirecting to menu in 10 seconds...</p>
        </div>
      </div>
    </div>
  );
};
export default QRComplete;
EOF

# Hooks
echo "🪝 Creating hook files..."
cat > src/hooks/useSession.js << 'EOF'
import { useEffect } from 'react';
import { useSessionStore } from '../stores/useSessionStore';
import { sessionAPI } from '../api/session';
export const useSession = (tableNumber, token) => {
  const { session, setSession, setBills } = useSessionStore();
  useEffect(() => {
    const init = async () => {
      if (!tableNumber || !token) return;
      try {
        const result = await sessionAPI.validate(parseInt(tableNumber), token);
        setSession(result.session);
        const bills = await sessionAPI.getTableBills(parseInt(tableNumber));
        setBills(bills);
      } catch (error) {
        console.error('Session error:', error);
      }
    };
    init();
  }, [tableNumber, token, setSession, setBills]);
  return { session };
};
EOF

cat > src/hooks/useRealtimeOrders.js << 'EOF'
import { useEffect } from 'react';
import { useSessionStore } from '../stores/useSessionStore';
import { sessionAPI } from '../api/session';
import { supabase } from '../api/supabase';
export const useRealtimeOrders = (tableNumber) => {
  const { setBills } = useSessionStore();
  useEffect(() => {
    if (!tableNumber) return;
    const channel = supabase
      .channel(`table-${tableNumber}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `table_number=eq.${tableNumber}`
      }, async () => {
        const bills = await sessionAPI.getTableBills(parseInt(tableNumber));
        setBills(bills);
      })
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [tableNumber, setBills]);
};
EOF

cat > src/hooks/useMenu.js << 'EOF'
import { useEffect } from 'react';
import { useMenuStore } from '../stores/useMenuStore';
export const useMenu = () => {
  const { menuItems, isLoading, error, fetchMenu } = useMenuStore();
  useEffect(() => {
    if (menuItems.length === 0) {
      fetchMenu();
    }
  }, []);
  return { menuItems, isLoading, error };
};
EOF

# Utils
echo "🔧 Creating utility files..."
cat > src/utils/constants.js << 'EOF'
export const ORDER_STATUSES = { PENDING: 'pending', PREPARING: 'preparing', READY: 'ready', DELIVERED: 'delivered', COMPLETED: 'completed', CANCELLED: 'cancelled' };
export const PAYMENT_STATUSES = { UNPAID: 'unpaid', PAID: 'paid', REFUNDED: 'refunded' };
export const ORDER_TYPES = { DINE_IN: 'dine_in', TAKEAWAY: 'takeaway', DELIVERY: 'delivery' };
export const SESSION_TIMEOUT = 3600;
export const MAX_ITEMS_PER_ORDER = 50;
EOF

cat > src/utils/helpers.js << 'EOF'
export const formatCurrency = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
export const generateOrderNumber = () => `QR-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
export const getTimeElapsed = (startTime) => {
  const diff = Math.floor((Date.now() - new Date(startTime)) / 60000);
  if (diff < 1) return 'Just now';
  if (diff === 1) return '1 minute ago';
  return `${diff} minutes ago`;
};
export const truncateText = (text, maxLength = 50) => text?.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
EOF

cat > src/utils/validation.js << 'EOF'
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
EOF

# Types
echo "📝 Creating type files..."
cat > src/types/index.d.ts << 'EOF'
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
EOF

# App files
echo "⚛️ Creating App files..."
cat > src/App.jsx << 'EOF'
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import OrderLanding from './pages/OrderLanding';
import QROrder from './pages/QROrder';
import QRStatus from './pages/QRStatus';
import QRComplete from './pages/QRComplete';
const InvalidQR = () => (
  <div className="max-w-md mx-auto p-4 min-h-screen flex items-center justify-center bg-base-100">
    <div className="card bg-base-200 shadow-xl w-full">
      <div className="card-body text-center">
        <div className="text-6xl mb-4">🔴</div>
        <h2 className="card-title text-2xl justify-center">Invalid QR Code</h2>
        <p className="text-base-content/70">This QR code is invalid or has expired. Please scan a valid QR code at your table.</p>
        <button className="btn btn-primary mt-4" onClick={() => window.location.reload()}>Try Again</button>
      </div>
    </div>
  </div>
);
function App() {
  return (
    <BrowserRouter>
      <Toaster position="bottom-center" toastOptions={{ duration: 3000, style: { maxWidth: '400px' } }} />
      <Routes>
        <Route path="/" element={<Navigate to="/order" />} />
        <Route path="/order" element={<OrderLanding />} />
        <Route path="/order/:table/:token" element={<QROrder />} />
        <Route path="/order/status/:orderId" element={<QRStatus />} />
        <Route path="/order/complete/:tableNumber" element={<QRComplete />} />
        <Route path="/order/invalid" element={<InvalidQR />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
EOF

cat > src/main.jsx << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

cat > src/index.css << 'EOF'
@import url('https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css');
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f8f9fa; }
.qr-order-page { max-width: 768px; margin: 0 auto; }
* { transition: all 0.2s ease; }
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; }
::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
.loading-pulse { animation: pulse 1.5s ease-in-out infinite; }
EOF

cat > .gitignore << 'EOF'
node_modules
dist
dist-ssr
*.local
.env
.env.local
.env.*.local
.DS_Store
.vscode
.idea
EOF

cat > README.md << 'EOF'
# Shalphyoke Customer Portal
QR ordering system for Shalphyoke Restaurant.

## Quick Start
1. `cp .env.example .env` and fill in Supabase credentials
2. `npm install`
3. `npm run dev`

## QR Format
`{APP_URL}/order?table={table}&token={token}`
EOF

mkdir -p supabase
cat > supabase/policies.sql << 'EOF'
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
EOF

echo ""
echo "✅ Setup complete! 🎉"
echo ""
echo "Next steps:"
echo "  1. Update .env with your Supabase credentials"
echo "  2. Run: npm run dev"
echo "  3. Visit: http://localhost:5173/order?table=5&token=test123"
