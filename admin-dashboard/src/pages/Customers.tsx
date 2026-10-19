import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type P = { id: string; full_name: string; phone: string | null; created_at: string };
// Privacy: phone numbers are masked here. Full contact details appear only on an order the customer placed.
const mask = (p: string | null) => (p ? `••••${p.slice(-3)}` : '—');

export default function Customers() {
  const [rows, setRows] = useState<P[] | null>(null); const [error, setError] = useState<string | null>(null);
  const load = async () => {
    setError(null);
    const { data, error: e } = await supabase.from('profiles').select('id,full_name,phone,created_at').order('created_at', { ascending: false });
    if (e) setError(e.message); else setRows(data as P[]);
  };
  useEffect(() => { load(); }, []);
  if (error) return <div className="state bad">{error} <button onClick={load}>Retry</button></div>;
  if (!rows) return <div className="state">Loading…</div>;
  return (
    <div>
      <div className="head"><h1>Customers</h1></div>
      {rows.length === 0 ? <div className="state">No customers yet.</div> : (
        <div className="scroll"><table><thead><tr><th>Name</th><th>Phone</th><th>Joined</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.id}><td>{r.full_name || '—'}</td><td>{mask(r.phone)}</td><td>{new Date(r.created_at).toLocaleDateString()}</td></tr>)}</tbody></table></div>
      )}
    </div>
  );
}
