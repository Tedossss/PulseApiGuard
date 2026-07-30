import { Activity, Plus, ShieldCheck } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import type { TrendPoint } from '../types';

const incidentPlaybook = [
  'Verify failing region',
  'Check auth and DNS',
  'Notify channel owner',
  'Confirm recovery signal',
];

export function TrendPanel({
  trendData,
  isDemoMode,
  onOpenCreate,
}: {
  trendData: TrendPoint[];
  isDemoMode: boolean;
  onOpenCreate: () => void;
}) {
  const hasTrendData = trendData.length > 0;

  return (
    <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
      <div className="rounded-[1.75rem] border border-white/10 bg-[#0d1117]/90 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-white">Uptime & Latency Trend</h3>
            <p className="mt-1 text-xs text-slate-500">
              {hasTrendData
                ? isDemoMode ? 'Sample endpoint health for the product preview.' : 'Live monitor data from configured endpoint checks.'
                : 'Create an endpoint monitor to start collecting uptime and latency data.'}
            </p>
          </div>
          <ShieldCheck className="text-indigo-300" size={20} />
        </div>
        <div className="h-72 w-full">
          {hasTrendData ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="uptimeFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" domain={[0, 100]} stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16 }} />
                <Area yAxisId="left" type="monotone" dataKey="uptime" stroke="#818cf8" fill="url(#uptimeFill)" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="latency" stroke="#22d3ee" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.025] text-center">
              <Activity className="mb-3 text-slate-500" size={24} />
              <p className="text-sm font-bold text-white">No endpoint data yet</p>
              <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">Uptime and latency trends appear after the first monitor is created and checked.</p>
              <button type="button" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-400" onClick={onOpenCreate}>
                <Plus size={16} />
                Add endpoint
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-[#0d1117]/90 p-6">
        <h3 className="text-sm font-black text-white">Incident Playbook</h3>
        <p className="mt-1 text-xs text-slate-500">Fast checklist for the next production issue.</p>
        <div className="mt-5 space-y-3">
          {incidentPlaybook.map((item, index) => (
            <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-indigo-500/10 text-xs font-black text-indigo-300">{index + 1}</span>
              <span className="text-sm font-semibold text-slate-300">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
