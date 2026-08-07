import { apiRequest } from '../../lib/api';
import type {
  LogsResponse,
  Monitor,
  MonitorPayload,
  TelegramLinkResponse,
  TelegramStatus,
  TrendResponsePoint,
} from './types';

type MonitorMutationResponse = {
  message: string;
  endpoint: Monitor;
};

export const getMonitorSummary = () => apiRequest<Monitor[]>('/api/dashboard/summary');

export const getMonitorTrend = () => apiRequest<TrendResponsePoint[]>('/api/dashboard/trend');

export const getMonitorLogs = (cursor?: string | null) => {
  const params = new URLSearchParams({ limit: '25' });
  if (cursor) params.set('cursor', cursor);
  return apiRequest<LogsResponse>(`/api/dashboard/logs?${params.toString()}`);
};

export const createMonitor = (payload: MonitorPayload) => apiRequest<MonitorMutationResponse>('/api/monitor/add', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

export const updateMonitor = (monitorId: string, payload: Partial<MonitorPayload>) => apiRequest<MonitorMutationResponse>(`/api/monitor/${monitorId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

export const deleteMonitor = (monitorId: string) => apiRequest<{ message: string }>(`/api/monitor/${monitorId}`, {
  method: 'DELETE',
});

export const logout = () => apiRequest<void>('/api/auth/logout', { method: 'POST' });

export const getTelegramStatus = () => apiRequest<TelegramStatus>('/api/telegram/status');

export const createTelegramLink = () => apiRequest<TelegramLinkResponse>('/api/telegram/link', {
  method: 'POST',
});

export const disconnectTelegram = () => apiRequest<void>('/api/telegram/link', {
  method: 'DELETE',
});
