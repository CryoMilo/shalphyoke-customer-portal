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
