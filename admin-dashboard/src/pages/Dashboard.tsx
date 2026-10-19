import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { peso } from '../lib/format';

type Recent = { id: string; order_number: number; status: string; total: number; contact_name: string; created_at: string };

export default function Dashboard() {
  const [s, setS] = useState<{ orders: number; revenue: number; pending: number; customers: number; recent: Recent[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    const [o, c, rec] = await Promise.all([
      supabase.from('orders').select('total,status,payment_status'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id,order_number,status,total,contact_name,created_at').order('created_at', { ascending: false }).limit(6),
    ]);
    const err = o.error ?? c.error ?? rec.error;
    if (err) return setError(err.message);
    const rows = o.data ?? [];
    setS({
      orders: rows.length,
      revenue: rows.filter((r) => r.payment_status === 'paid').reduce((n, r) => n + Number(r.total), 0),
      pending: rows.filter((r) => ['placed', 'confirmed', 'preparing'].includes(r.status)).length,
      customers: c.count ?? 0, recent: rec.data as Recent[],
    });
  };
  useEffect(() => { load(); }, []);

  if (error) return <div className="state bad">{error} <button onClick={load}>Retry</button></div>;
  if (!s) return <div className="state">Loading…</div>;
  return (
    <div>
      <div className="head"><h1>Dashboard</h1><button className="ghost" onClick={load}>Refresh</button></div>
      <div className="stats">
        <div className="stat"><b>{s.orders}</b>Total orders</div>
        <div className="stat"><b>{peso(s.revenue)}</b>Revenue collected</div>
        <div className="stat"><b>{s.pending}</b>Pending orders</div>
        <div className="stat"><b>{s.customers}</b>Registered customers</div>
      </div>
      <h2>Recent orders</h2>
      {s.recent.length === 0 ? <div className="state">No orders yet.</div> : (
        <div className="scroll"><table><thead><tr><th>#</th><th>Customer</th><th>Status</th><th>Total</th><th>Placed</th></tr></thead>
          <tbody>{s.recent.map((r) => <tr key={r.id}><td>{r.order_number}</td><td>{r.contact_name}</td><td>{r.status.replace(/_/g, ' ')}</td>
            <td>{peso(r.total)}</td><td>{new Date(r.created_at).toLocaleString()}</td></tr>)}</tbody></table></div>
      )}
    </div>
  );
}
