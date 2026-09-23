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

    // Fetch active menu_item_extras with extra_item details
    const { data: extrasData } = await supabase
      .from('menu_item_extras')
      .select('*, extra_item:extra_item_id(*)')
      .eq('is_active', true)
      .order('sort_order');

    // Group available extras by menu_item_id
    const extrasByItemId = {};
    extrasData?.forEach((extra) => {
      if (!extrasByItemId[extra.menu_item_id]) {
        extrasByItemId[extra.menu_item_id] = [];
      }
      extrasByItemId[extra.menu_item_id].push({
        id: extra.id,
        extra_item_id: extra.extra_item_id,
        additional_price: Number(extra.additional_price || 0),
        sort_order: extra.sort_order,
        is_default: extra.is_default,
        name_burmese: extra.extra_item?.name_burmese || '',
        name_english: extra.extra_item?.name_english || '',
        name_thai: extra.extra_item?.name_thai || '',
        image_url: extra.extra_item?.image_url || null,
      });
    });

    const attachExtras = (item) => ({
      ...item,
      available_extras: extrasByItemId[item.id] || [],
    });

    const mappedSpecials = (specials || []).map(attachExtras);
    const mappedRegulars = (regulars || []).map(attachExtras);
    const mappedCombos = (combos || []).map(attachExtras);

    return {
      specials: mappedSpecials,
      regulars: mappedRegulars,
      combos: mappedCombos,
      allItems: [...mappedSpecials, ...mappedRegulars, ...mappedCombos]
    };
  }
};
