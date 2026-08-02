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
