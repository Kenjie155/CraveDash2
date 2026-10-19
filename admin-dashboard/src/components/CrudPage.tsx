import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../lib/toast';

export type FieldDef = {
  key: string; label: string; type?: 'text' | 'number' | 'bool' | 'textarea' | 'ref';
  ref?: string; required?: boolean; hideInList?: boolean; step?: string;
};
type Row = Record<string, any>;

export default function CrudPage({ table, title, fields, orderBy = 'created_at' }: {
  table: string; title: string; fields: FieldDef[]; orderBy?: string;
}) {
  const toast = useToast();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [refs, setRefs] = useState<Record<string, Row[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const { data, error: e } = await supabase.from(table).select('*').order(orderBy, { ascending: orderBy === 'sort_order' });
    if (e) return setError(e.message);
    setRows(data);
    const next: Record<string, Row[]> = {};
    for (const f of fields.filter((x) => x.type === 'ref' && x.ref)) {
      const r = await supabase.from(f.ref!).select('id,name').order('name');
      next[f.key] = r.data ?? [];
    }
    setRefs(next);
  }, [table, orderBy]);
  useEffect(() => { setRows(null); load(); }, [load]);

  const label = (f: FieldDef, v: any) => {
    if (f.type === 'bool') return v ? 'Yes' : 'No';
    if (f.type === 'ref') return refs[f.key]?.find((x) => x.id === v)?.name ?? '—';
    return v ?? '—';
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault(); if (!form) return;
    const payload: Row = {};
    for (const f of fields) {
      let v = form[f.key];
      if (f.type === 'number') v = v === '' || v == null ? null : Number(v);
      else if (f.type === 'bool') v = !!v;
      else if (v === '' || v === undefined) v = null;
      // Blank values: let database defaults apply on insert; never null-out numbers on update.
      if (v === null && (!form.id || f.type === 'number')) continue;
      payload[f.key] = v;
    }
    setSaving(true);
    const q = form.id ? supabase.from(table).update(payload).eq('id', form.id) : supabase.from(table).insert(payload);
    const { error: err } = await q;
    setSaving(false);
    if (err) return toast(err.message, true);
    toast(form.id ? 'Saved' : 'Created'); setForm(null); load();
  };

  const del = async (r: Row) => {
    if (!confirm(`Delete "${r.name ?? r.full_name}"? This cannot be undone.`)) return;
    const { error: err } = await supabase.from(table).delete().eq('id', r.id);
    if (err) toast(err.message, true); else { toast('Deleted'); load(); }
  };

  const listFields = fields.filter((f) => !f.hideInList && f.type !== 'textarea');
  const blank = Object.fromEntries(fields.map((f) => [f.key, f.type === 'bool' ? true : '']));

  return (
    <div>
      <div className="head"><h1>{title}</h1><button onClick={() => setForm({ ...blank })}>Add new</button></div>
      {error ? <div className="state bad">{error} <button onClick={load}>Retry</button></div>
        : rows === null ? <div className="state">Loading…</div>
          : rows.length === 0 ? <div className="state">Nothing here yet. Click “Add new” to create the first one.</div>
            : (
              <div className="scroll"><table>
                <thead><tr>{listFields.map((f) => <th key={f.key}>{f.label}</th>)}<th /></tr></thead>
                <tbody>{rows.map((r) => (
                  <tr key={r.id}>
                    {listFields.map((f) => <td key={f.key}>{String(label(f, r[f.key]))}</td>)}
                    <td className="actions"><button className="ghost" onClick={() => setForm({ ...r })}>Edit</button>
                      <button className="danger" onClick={() => del(r)}>Delete</button></td>
                  </tr>))}</tbody>
              </table></div>
            )}

      {form ? (
        <div className="modal" onClick={() => setForm(null)}>
          <form className="card" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
            <h2>{form.id ? 'Edit' : 'Add'} {title.toLowerCase()}</h2>
            {fields.map((f) => (
              <label key={f.key}>{f.label}{f.required ? ' *' : ''}
                {f.type === 'bool' ? <input type="checkbox" checked={!!form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })} />
                  : f.type === 'textarea' ? <textarea value={form[f.key] ?? ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                    : f.type === 'ref' ? (
                      <select required={f.required} value={form[f.key] ?? ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}>
                        <option value="">Select…</option>{(refs[f.key] ?? []).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                      </select>)
                      : <input type={f.type === 'number' ? 'number' : 'text'} step={f.step ?? (f.type === 'number' ? 'any' : undefined)}
                        required={f.required} value={form[f.key] ?? ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />}
              </label>
            ))}
            <div className="row"><button type="button" className="ghost" onClick={() => setForm(null)}>Cancel</button>
              <button disabled={saving}>{saving ? 'Saving…' : 'Save'}</button></div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
