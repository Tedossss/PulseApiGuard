import { RefreshCw } from 'lucide-react';

import { filterLogs } from '../dashboardUtils';
import type { MonitoringLog } from '../types';

type Props = {
  error: string;
  formatDateTime: (value?: string | null) => string;
  isDemoMode: boolean;
  isLoading: boolean;
  logs: MonitoringLog[];
  nextCursor: string | null;
  onLoadMore: () => void;
  onRefresh: () => void;
  search: string;
};

export function CheckHistoryPanel({
  error,
  formatDateTime,
  isDemoMode,
  isLoading,
  logs,
  nextCursor,
  onLoadMore,
  onRefresh,
  search,
}: Props) {
  const query = search.trim().toLowerCase();
  const visibleLogs = filterLogs(logs, search);

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-[#0d1117]/90 p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-sm font-black text-white">Check History</h3>
          <p className="mt-1 text-xs text-slate-500">
            {isDemoMode ? 'Sample check results for the product preview.' : 'Persisted monitor results, newest first. Records expire after 30 days.'}
          </p>
        </div>
        {!isDemoMode && (
          <button type="button" disabled={isLoading} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/5 disabled:opacity-60" onClick={onRefresh}>
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        )}
      </div>
      {error && <p className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">{error}</p>}
      <div className="mt-5 space-y-3">
        {visibleLogs.map((log) => {
          const monitor = typeof log.monitor === 'object' && log.monitor ? log.monitor : null;
          return (
            <div key={log._id} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[1.2fr_0.7fr_0.7fr_0.7fr] md:items-center">
              <div>
                <p className="text-sm font-bold text-white">{monitor?.name ?? 'Deleted monitor'}</p>
                <p className="mt-1 break-all font-mono text-[11px] text-slate-500">{monitor?.url ?? log.message ?? 'No target metadata'}</p>
              </div>
              <HistoryMetric label="Checked" value={formatDateTime(log.createdAt)} />
              <HistoryMetric label="Response" value={log.responseTime === null ? '—' : `${log.responseTime}ms`} />
              <span className={`w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase ring-1 ${log.success ? 'text-emerald-300 bg-emerald-500/10 ring-emerald-500/20' : 'text-red-300 bg-red-500/10 ring-red-500/20'}`}>
                {log.statusCode ?? 'Network error'}
              </span>
            </div>
          );
        })}
        {!isLoading && visibleLogs.length === 0 && <div className="rounded-2xl border border-white/10 p-8 text-center text-sm text-slate-500">No check records match the current view.</div>}
        {isLoading && logs.length === 0 && <div className="rounded-2xl border border-white/10 p-8 text-center text-sm text-slate-500">Loading check history...</div>}
      </div>
      {nextCursor && !query && (
        <button type="button" disabled={isLoading} className="mt-5 w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/5 disabled:opacity-60" onClick={onLoadMore}>
          {isLoading ? 'Loading...' : 'Load older checks'}
        </button>
      )}
    </div>
  );
}

function HistoryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-white">{value}</p>
      <p className="text-[10px] uppercase tracking-widest text-slate-600">{label}</p>
    </div>
  );
}
