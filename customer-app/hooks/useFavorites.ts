import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useFavorites() {
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const reload = useCallback(async () => {
    const { data } = await supabase.from('favorites').select('restaurant_id');
    setFavs(new Set((data ?? []).map((d: { restaurant_id: string }) => d.restaurant_id)));
  }, []);
  const toggle = useCallback(async (restaurantId: string) => {
    const on = favs.has(restaurantId);
    setFavs((s) => { const n = new Set(s); if (on) n.delete(restaurantId); else n.add(restaurantId); return n; });
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    if (on) await supabase.from('favorites').delete().eq('restaurant_id', restaurantId).eq('user_id', u.user.id);
    else await supabase.from('favorites').insert({ restaurant_id: restaurantId, user_id: u.user.id });
  }, [favs]);
  return { favs, toggle, reload };
}
