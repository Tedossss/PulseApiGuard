import { CheckCircle2, Clock3, Pencil, Plus, Trash2, X } from 'lucide-react';

import { formatInterval } from '../dashboardUtils';
import { MONITOR_INTERVAL_OPTIONS } from '../monitorConfig';
import type { Monitor } from '../types';

type Props = {
  deletingMonitorId: string | null;
  filteredMonitors: Monitor[];
  formatDateTime: (value?: string | null) => string;
  monitorIsUp: (monitor: Monitor) => boolean;
  monitorStateLabel: (monitor: Monitor) => string;
  onDelete: (monitor: Monitor) => void;
  onEdit: (monitor: Monitor) => void;
  onOpenCreate: () => void;
  onUpdateInterval: (monitor: Monitor, intervalValue: string) => void;
  savingIntervalId: string | null;
  totalEndpoints: number;
};

export function EndpointList({
  deletingMonitorId,
  filteredMonitors,
  formatDateTime,
  monitorIsUp,
  monitorStateLabel,
  onDelete,
  onEdit,
  onOpenCreate,
  onUpdateInterval,
  savingIntervalId,
  totalEndpoints,
}: Props) {
  return (
    <div className="dashboard-panel overflow-hidden border-2 border-black bg-white">
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-sm font-black text-white">Endpoint Activity</h3>
          <p className="mt-1 text-xs text-slate-500">{filteredMonitors.length} visible from {totalEndpoints} total</p>
        </div>
        <button type="button" className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-400" onClick={onOpenCreate}>
          <Plus size={16} />
          Add endpoint
        </button>
      </div>
      <div className="divide-y divide-white/5">
        {filteredMonitors.length > 0 ? (
          filteredMonitors.map((monitor) => {
            const isUp = monitorIsUp(monitor);
            const stateLabel = monitorStateLabel(monitor);
            const isPending = stateLabel === 'PENDING';
            const currentInterval = monitor.interval ?? 60;
            const hasPresetInterval = MONITOR_INTERVAL_OPTIONS.some((option) => option.value === currentInterval);
            return (
              <div key={monitor._id} className="grid gap-4 p-5 transition hover:bg-white/[0.025] xl:grid-cols-[1.2fr_0.75fr_0.9fr_0.7fr_auto] xl:items-center">
                <div className="flex items-center gap-3">
                  <div className={`grid h-11 w-11 place-items-center ${isUp ? 'bg-emerald-500/10 text-emerald-700' : isPending ? 'bg-blue-500/10 text-blue-700' : 'bg-red-500/10 text-red-700'}`}>
                    {isUp ? <CheckCircle2 size={19} /> : isPending ? <Clock3 size={19} /> : <X size={19} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{monitor.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono break-all">{monitor.url}</p>
                  </div>
                </div>
                <EndpointMetric label="Last checked" value={formatDateTime(monitor.lastChecked)} />
                <div>
                  <select
                    className="w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-xs font-bold text-white outline-none transition focus:border-indigo-400/60 disabled:cursor-not-allowed disabled:opacity-60"
                    value={String(monitor.interval ?? 60)}
                    disabled={savingIntervalId === monitor._id}
                    onChange={(event) => onUpdateInterval(monitor, event.target.value)}
                    aria-label={`Check frequency for ${monitor.name}`}
                  >
                    {!hasPresetInterval && <option value={currentInterval}>{formatInterval(currentInterval)}</option>}
                    {MONITOR_INTERVAL_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-[10px] uppercase tracking-widest text-slate-600">
                    {savingIntervalId === monitor._id ? 'Saving' : `Every ${formatInterval(monitor.interval)}`}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4 lg:justify-end">
                  <EndpointMetric label="Latency" value={`${monitor.responseTime ?? '-'}ms`} />
                  <span className={`px-3 py-1 text-[10px] font-bold uppercase ring-1 ${isUp ? 'text-emerald-700 bg-emerald-500/10 ring-emerald-500/30' : isPending ? 'text-blue-700 bg-blue-500/10 ring-blue-500/30' : 'text-red-700 bg-red-500/10 ring-red-500/30'}`}>
                    {stateLabel}
                  </span>
                </div>
                <div className="flex items-center gap-2 xl:justify-end">
                  <button type="button" className="dashboard-secondary-action inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/5 hover:text-white" onClick={() => onEdit(monitor)}>
                    <Pencil size={14} />
                    Edit
                  </button>
                  <button type="button" disabled={deletingMonitorId === monitor._id} className="dashboard-danger-action inline-flex items-center gap-1.5 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60" onClick={() => onDelete(monitor)}>
                    <Trash2 size={14} />
                    {deletingMonitorId === monitor._id ? 'Deleting' : 'Delete'}
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-10 text-center text-sm text-slate-500">
            No monitors match the current view. Add endpoints or clear search.
          </div>
        )}
      </div>
    </div>
  );
}

function EndpointMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-white">{value}</p>
      <p className="text-[10px] uppercase tracking-widest text-slate-600">{label}</p>
    </div>
  );
}
