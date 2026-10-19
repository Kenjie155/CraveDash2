import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

type Ctx = { session: Session | null; isAdmin: boolean; loading: boolean };
const AuthCtx = createContext<Ctx>({ session: null, isAdmin: false, loading: true });
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Admin status is always verified by the database (user_roles), never by browser state.
  useEffect(() => {
    let live = true;
    if (!session) { setIsAdmin(false); setLoading(false); return; }
    setLoading(true);
    supabase.rpc('is_admin').then(({ data }) => { if (live) { setIsAdmin(data === true); setLoading(false); } });
    return () => { live = false; };
  }, [session?.user.id]);

  return <AuthCtx.Provider value={{ session, isAdmin, loading }}>{children}</AuthCtx.Provider>;
}
