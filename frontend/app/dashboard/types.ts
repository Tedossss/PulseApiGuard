export type Monitor = {
  _id: string;
  name: string;
  url: string;
  status?: string;
  lastStatus?: string | number | null;
  responseTime?: number;
  interval?: number;
  expectedStatus?: number;
  method?: string;
  lastChecked?: string | null;
  downSince?: string | null;
};

export type TrendPoint = {
  name: string;
  uptime: number;
  latency: number;
};

export type TrendResponsePoint = {
  checkedAt: string;
  uptime: number;
  latency: number;
};

export type MonitoringLog = {
  _id: string;
  monitor: { _id: string; name: string; url: string } | string | null;
  statusCode: number | null;
  success: boolean;
  responseTime: number | null;
  message?: string;
  createdAt: string;
};

export type LogsResponse = {
  logs: MonitoringLog[];
  nextCursor: string | null;
};

export type MonitorForm = {
  name: string;
  url: string;
  method: string;
  expectedStatus: string;
  interval: string;
};

export type MonitorPayload = {
  name: string;
  url: string;
  method: string;
  expectedStatus: number;
  interval: number;
};

export type NavKey = 'overview' | 'endpoints' | 'logs' | 'settings';

export type TelegramStatus = {
  configured: boolean;
  connected: boolean;
  username: string | null;
  linkedAt: string | null;
};

export type TelegramLinkResponse = {
  link: string;
  expiresAt: string;
};
