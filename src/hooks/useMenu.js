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
