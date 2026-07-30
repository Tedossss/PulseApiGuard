import type { FormEvent } from 'react';
import { Pencil, Plus } from 'lucide-react';

import { MONITOR_INTERVAL_OPTIONS, MONITOR_METHODS } from '../monitorConfig';
import type { MonitorForm } from '../types';

type Props = {
  editing: boolean;
  error: string;
  form: MonitorForm;
  isSaving: boolean;
  onCancel: () => void;
  onChange: (field: keyof MonitorForm, value: string) => void;
  onSubmit: (event: FormEvent) => void;
};

export function MonitorEditor({
  editing,
  error,
  form,
  isSaving,
  onCancel,
  onChange,
  onSubmit,
}: Props) {
  return (
    <form className="rounded-[1.75rem] border border-indigo-300/20 bg-[#0d1117]/90 p-5" onSubmit={onSubmit}>
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-sm font-black text-white">{editing ? 'Edit Endpoint Monitor' : 'Create Endpoint Monitor'}</h3>
          <p className="mt-1 text-xs text-slate-500">{editing ? 'Update the target, method, expected status, or frequency.' : 'Add a URL, expected status, and check frequency.'}</p>
        </div>
        <button type="button" className="text-sm font-bold text-slate-400 transition hover:text-white" onClick={onCancel}>
          Cancel
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_1.5fr_0.7fr_0.7fr_0.7fr]">
        <input className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none focus:border-indigo-400/60" placeholder="Name" value={form.name} onChange={(event) => onChange('name', event.target.value)} />
        <input className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none focus:border-indigo-400/60" placeholder="https://api.example.com/health" type="url" value={form.url} onChange={(event) => onChange('url', event.target.value)} required />
        <select className="rounded-xl border border-white/10 bg-[#111827] px-3 py-3 text-sm text-white outline-none focus:border-indigo-400/60" value={form.method} onChange={(event) => onChange('method', event.target.value)}>
          {MONITOR_METHODS.map((method) => <option key={method}>{method}</option>)}
        </select>
        <input className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none focus:border-indigo-400/60" inputMode="numeric" placeholder="200" value={form.expectedStatus} onChange={(event) => onChange('expectedStatus', event.target.value)} />
        <select className="rounded-xl border border-white/10 bg-[#111827] px-3 py-3 text-sm text-white outline-none focus:border-indigo-400/60" value={form.interval} onChange={(event) => onChange('interval', event.target.value)}>
          {MONITOR_INTERVAL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      {error && <p className="mt-3 text-sm font-semibold text-red-300" role="alert">{error}</p>}
      <button type="submit" disabled={isSaving} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60">
        {editing ? <Pencil size={17} /> : <Plus size={17} />}
        {isSaving ? 'Saving...' : editing ? 'Save changes' : 'Create monitor'}
      </button>
    </form>
  );
}
