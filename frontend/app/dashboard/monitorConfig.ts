export const MIN_MONITOR_INTERVAL_SECONDS = 30;
export const MAX_MONITOR_INTERVAL_SECONDS = 86_400;

export const MONITOR_METHODS = ["GET", "HEAD"] as const;

export const MONITOR_INTERVAL_OPTIONS = [
  { value: 30, label: "30 sec" },
  { value: 60, label: "1 min" },
  { value: 300, label: "5 min" },
  { value: 900, label: "15 min" },
  { value: 1800, label: "30 min" },
  { value: 3600, label: "1 hour" },
] as const;

export function parseMonitorInterval(value: string | number) {
  const interval = Number(value);
  if (
    !Number.isInteger(interval) ||
    interval < MIN_MONITOR_INTERVAL_SECONDS ||
    interval > MAX_MONITOR_INTERVAL_SECONDS
  ) {
    throw new Error(
      `Check frequency must be an integer from ${MIN_MONITOR_INTERVAL_SECONDS} to ${MAX_MONITOR_INTERVAL_SECONDS} seconds.`,
    );
  }
  return interval;
}

export function parseExpectedStatus(value: string | number) {
  const status = Number(value);
  if (!Number.isInteger(status) || status < 100 || status > 599) {
    throw new Error("Expected status must be an integer from 100 to 599.");
  }
  return status;
}
