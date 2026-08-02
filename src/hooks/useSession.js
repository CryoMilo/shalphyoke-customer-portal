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
