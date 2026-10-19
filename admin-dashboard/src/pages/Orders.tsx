import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../lib/toast';
import { peso } from '../lib/format';

type Order = {
  id: string; order_number: number; status: string; payment_status: string; payment_method: string; total: number;
  subtotal: number; delivery_fee: number; contact_name: string; contact_phone: string; delivery_address: string;
  notes: string | null; rider_id: string | null; created_at: string;
  restaurants: { name: string } | null; riders: { full_name: string; phone?: string | null } | null;
  order_items: { id: string; name: string; quantity: number; line_total: number }[];
};
type Rider = { id: string; full_name: string; phone?: string | null; is_available: boolean };

// Mirrors public.is_valid_transition in the database (the database is the real enforcer).
const NEXT: Record<string, string[]> = {
  placed: ['confirmed', 'cancelled'], confirmed: ['preparing', 'cancelled'], preparing: ['ready_for_pickup', 'cancelled'],
  ready_for_pickup: ['picked_up'], picked_up: ['out_for_delivery'], out_for_delivery: ['delivered'], delivered: [], cancelled: [],
};
const nice = (s: string) => s.replace(/_/g, ' ');

export default function Orders() {
  const toast = useToast();
  const [rows, setRows] = useState<Order[] | null>(null); const [riders, setRiders] = useState<Rider[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState(''); const [status, setStatus] = useState('all'); const [sel, setSel] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    const [o, r] = await Promise.all([
      supabase.from('orders').select('*, restaurants(name), riders(full_name,phone), order_items(id,name,quantity,line_total)').order('created_at', { ascending: false }).limit(300),
      supabase.from('riders').select('id,full_name,phone,is_available').order('full_name'),
    ]);
    if (o.error) return setError(o.error.message);
    setRows(o.data as unknown as Order[]); setRiders((r.data ?? []) as Rider[]);
  };
  useEffect(() => { load(); }, []);

  const shown = useMemo(() => (rows ?? []).filter((o) =>
    (status === 'all' || o.status === status) &&
    (!q.trim() || String(o.order_number).includes(q.trim()) || o.contact_name.toLowerCase().includes(q.trim().toLowerCase()))), [rows, q, status]);
  const cur = rows?.find((o) => o.id === sel) ?? null;

  const rpc = async (fn: string, args: Record<string, unknown>, ok: string) => {
    const { error: e } = await supabase.rpc(fn, args);
    if (e) toast(e.message, true); else { toast(ok); load(); }
  };

  if (error) return <div className="state bad">{error} <button onClick={load}>Retry</button></div>;
  if (!rows) return <div className="state">Loading…</div>;

  return (
    <div>
      <div className="head"><h1>Orders</h1><button className="ghost" onClick={load}>Refresh</button></div>
      <div className="row filters">
        <input placeholder="Search order # or customer" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>{Object.keys(NEXT).map((s) => <option key={s} value={s}>{nice(s)}</option>)}
        </select>
      </div>
      {shown.length === 0 ? <div className="state">No orders match.</div> : (
        <div className="scroll"><table>
          <thead><tr><th>#</th><th>Customer</th><th>Restaurant</th><th>Status</th><th>Payment</th><th>Total</th><th>Rider</th></tr></thead>
          <tbody>{shown.map((o) => (
            <tr key={o.id} className="click" onClick={() => setSel(o.id)}>
              <td>{o.order_number}</td><td>{o.contact_name}</td><td>{o.restaurants?.name}</td><td>{nice(o.status)}</td>
              <td>{o.payment_method.toUpperCase()} · {o.payment_status}</td><td>{peso(o.total)}</td><td>{o.riders?.full_name ?? '—'}</td>
            </tr>))}</tbody>
        </table></div>
      )}

      {cur ? (
        <div className="modal" onClick={() => setSel(null)}>
          <div className="card wide" onClick={(e) => e.stopPropagation()}>
            <h2>Order #{cur.order_number}</h2>
            <p><b>{cur.contact_name}</b> · {cur.contact_phone}<br />{cur.delivery_address}{cur.notes ? <><br />Notes: {cur.notes}</> : null}</p>
            <ul>{cur.order_items.map((i) => <li key={i.id}>{i.quantity}× {i.name} — {peso(i.line_total)}</li>)}</ul>
            <p>Subtotal {peso(cur.subtotal)} · Delivery {peso(cur.delivery_fee)} · <b>Total {peso(cur.total)}</b></p>

            <label>Status: <b>{nice(cur.status)}</b>
              <select value="" disabled={NEXT[cur.status].length === 0}
                onChange={(e) => e.target.value && rpc('admin_update_order_status', { p_order_id: cur.id, p_status: e.target.value }, 'Status updated')}>
                <option value="">{NEXT[cur.status].length ? 'Move to…' : 'No further changes'}</option>
                {NEXT[cur.status].map((s) => <option key={s} value={s}>{nice(s)}</option>)}
              </select></label>

            <label>Rider
              <select value={cur.rider_id ?? ''} disabled={['delivered', 'cancelled'].includes(cur.status)}
                onChange={(e) => e.target.value && rpc('admin_assign_rider', { p_order_id: cur.id, p_rider_id: e.target.value }, 'Rider assigned')}>
                <option value="">Select rider…</option>
                {riders.map((r) => <option key={r.id} value={r.id} disabled={!r.is_available && r.id !== cur.rider_id}>{r.full_name}{r.phone ? ` (${r.phone})` : ''}{r.is_available ? '' : ' (unavailable)'}</option>)}
              </select></label>
            {cur.rider_id ? (
              <p style={{ marginTop: -6, marginBottom: 12, fontSize: 13, color: '#64748b' }}>
                Assigned Courier Contact: <b style={{ color: '#0f172a' }}>{cur.riders?.phone || riders.find((r) => r.id === cur.rider_id)?.phone || 'No phone recorded'}</b>
              </p>
            ) : null}

            <div className="row">
              <span>Cash on delivery: <b>{cur.payment_status}</b></span>
              <button onClick={() => rpc('admin_set_payment_status', { p_order_id: cur.id, p_status: cur.payment_status === 'paid' ? 'unpaid' : 'paid' }, 'Payment updated')}>
                {cur.payment_status === 'paid' ? 'Mark unpaid' : 'Mark paid (cash collected)'}</button>
            </div>
            <div className="row"><button className="ghost" onClick={() => setSel(null)}>Close</button></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
