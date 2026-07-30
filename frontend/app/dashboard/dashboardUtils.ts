import type { Monitor, MonitoringLog } from './types';

export const formatInterval = (seconds?: number) => {
  const interval = seconds ?? 60;
  if (interval < 60) return `${interval}s`;
  if (interval % 3600 === 0) return `${interval / 3600}h`;
  if (interval % 60 === 0) return `${interval / 60}m`;
  return `${interval}s`;
};

export const monitorIsUp = (monitor: Monitor) => {
  const state = String(monitor.status ?? monitor.lastStatus ?? '').toLowerCase();
  if (state === 'up') return true;
  if (state === 'down') return false;
  return typeof monitor.lastStatus === 'number' && monitor.lastStatus >= 200 && monitor.lastStatus < 400;
};

export const monitorStateLabel = (monitor: Monitor) => {
  const state = String(monitor.status ?? '').toUpperCase();
  if (state === 'UP' || state === 'DOWN' || state === 'PENDING') return state;
  if (typeof monitor.lastStatus === 'number') return String(monitor.lastStatus);
  return String(monitor.lastStatus ?? 'PENDING').toUpperCase();
};

export const filterMonitors = (monitors: Monitor[], search: string) => {
  const query = search.trim().toLowerCase();
  if (!query) return monitors;
  return monitors.filter((monitor) => (
    `${monitor.name} ${monitor.url} ${monitor.lastStatus ?? ''}`.toLowerCase().includes(query)
  ));
};

export const filterLogs = (logs: MonitoringLog[], search: string) => {
  const query = search.trim().toLowerCase();
  if (!query) return logs;

  return logs.filter((log) => {
    const monitor = typeof log.monitor === 'object' && log.monitor ? log.monitor : null;
    return `${monitor?.name ?? ''} ${monitor?.url ?? ''} ${log.statusCode ?? ''} ${log.message ?? ''}`
      .toLowerCase()
      .includes(query);
  });
};
