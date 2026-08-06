"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertCircle,
  Clock,
  Cpu,
  FileText,
  Gauge,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Radio,
  Search,
  Settings,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { parseExpectedStatus, parseMonitorInterval } from './monitorConfig';
import { ApiError } from '../../lib/api';
import {
  createMonitor,
  deleteMonitor,
  getMonitorLogs,
  getMonitorSummary,
  getMonitorTrend,
  logout,
  updateMonitor,
} from './dashboardApi';
import {
  filterMonitors,
  monitorIsUp,
  monitorStateLabel,
} from './dashboardUtils';
import { CheckHistoryPanel } from './components/CheckHistoryPanel';
import { EndpointList } from './components/EndpointList';
import { MonitorEditor } from './components/MonitorEditor';
import { TrendPanel } from './components/TrendPanel';
import { TelegramSettings } from './components/TelegramSettings';
import type {
  Monitor,
  MonitoringLog,
  MonitorForm,
  MonitorPayload,
  NavKey,
  TrendPoint,
} from './types';

const demoMonitors: Monitor[] = [
  { _id: 'demo-auth', name: 'Auth API', url: 'https://api.pulseguard.dev/auth/health', lastStatus: 'up', responseTime: 42, interval: 60 },
  { _id: 'demo-payments', name: 'Payments API', url: 'https://api.pulseguard.dev/payments/status', lastStatus: 'up', responseTime: 68, interval: 300 },
  { _id: 'demo-webhooks', name: 'Webhook Relay', url: 'https://hooks.pulseguard.dev/events', lastStatus: 'down', responseTime: 184, interval: 30 },
  { _id: 'demo-search', name: 'Search Gateway', url: 'https://api.pulseguard.dev/search/ping', lastStatus: 'up', responseTime: 31, interval: 900 },
];

const demoTrendData: TrendPoint[] = [
  { name: '09:00', uptime: 100, latency: 41 },
  { name: '09:05', uptime: 100, latency: 48 },
  { name: '09:10', uptime: 75, latency: 132 },
  { name: '09:15', uptime: 75, latency: 184 },
  { name: '09:20', uptime: 100, latency: 62 },
  { name: '09:25', uptime: 100, latency: 44 },
];

const demoLogs: MonitoringLog[] = [
  {
    _id: 'demo-log-1',
    monitor: { _id: 'demo-auth', name: 'Auth API', url: 'https://api.pulseguard.dev/auth/health' },
    statusCode: 200,
    success: true,
    responseTime: 42,
    message: 'Expected status received',
    createdAt: '2026-07-29T09:25:00.000Z',
  },
  {
    _id: 'demo-log-2',
    monitor: { _id: 'demo-webhooks', name: 'Webhook Relay', url: 'https://hooks.pulseguard.dev/events' },
    statusCode: 503,
    success: false,
    responseTime: 184,
    message: 'Expected 200, received 503',
    createdAt: '2026-07-29T09:20:00.000Z',
  },
];

const navItems: Array<{ key: NavKey; label: string; icon: React.ReactNode }> = [
  { key: 'overview', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { key: 'endpoints', label: 'Endpoints', icon: <Activity size={20} /> },
  { key: 'logs', label: 'Check history', icon: <FileText size={20} /> },
  { key: 'settings', label: 'Settings', icon: <Settings size={20} /> },
];

const initialMonitorForm: MonitorForm = {
  name: '',
  url: '',
  method: 'GET',
  expectedStatus: '200',
  interval: '60',
};

const formatTrendLabel = (value: string) => {
  return new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

export default function Dashboard() {
  const router = useRouter();
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [logs, setLogs] = useState<MonitoringLog[]>([]);
  const [logsCursor, setLogsCursor] = useState<string | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [activeView, setActiveView] = useState<NavKey>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showCreateMonitor, setShowCreateMonitor] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState<Monitor | null>(null);
  const [monitorForm, setMonitorForm] = useState<MonitorForm>(initialMonitorForm);
  const [formError, setFormError] = useState('');
  const [isSavingMonitor, setIsSavingMonitor] = useState(false);
  const [savingIntervalId, setSavingIntervalId] = useState<string | null>(null);
  const [deletingMonitorId, setDeletingMonitorId] = useState<string | null>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileNavRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!mobileNavOpen) return;

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : mobileMenuButtonRef.current;
    const dialog = mobileNavRef.current;
    const focusable = dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])');
    focusable?.[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMobileNavOpen(false);
        return;
      }

      if (event.key !== 'Tab' || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [mobileNavOpen]);

  const redirectToAuth = useCallback(() => {
    router.replace('/auth');
  }, [router]);

  const fetchSummary = useCallback(async () => {
    try {
      const data = await getMonitorSummary();
      setMonitors(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        redirectToAuth();
        return;
      }
      console.error('Fetch error:', err);
      setFormError(err instanceof ApiError ? err.message : 'Backend is not reachable. Live monitor data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [redirectToAuth]);

  const fetchTrend = useCallback(async () => {
    try {
      const data = await getMonitorTrend();
      const nextTrendData = Array.isArray(data)
        ? data.map((point) => ({
            name: formatTrendLabel(point.checkedAt),
            uptime: point.uptime,
            latency: point.latency,
          }))
        : [];
      setTrendData(nextTrendData);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        redirectToAuth();
        return;
      }
      console.error('Trend fetch error:', err);
      setTrendData([]);
    }
  }, [redirectToAuth]);

  const fetchLogs = useCallback(async ({ append = false, cursor = null }: { append?: boolean; cursor?: string | null } = {}) => {
    setLogsLoading(true);
    setLogsError('');

    try {
      const data = await getMonitorLogs(cursor);
      const nextLogs = Array.isArray(data.logs) ? data.logs : [];
      setLogs((current) => append ? [...current, ...nextLogs] : nextLogs);
      setLogsCursor(typeof data.nextCursor === 'string' ? data.nextCursor : null);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        redirectToAuth();
        return;
      }
      console.error('Check history fetch error:', error);
      setLogsError(error instanceof ApiError ? error.message : 'Backend is not reachable. Check history could not be loaded.');
    } finally {
      setLogsLoading(false);
    }
  }, [redirectToAuth]);

  useEffect(() => {
    const demoMode = new URLSearchParams(window.location.search).get('demo') === '1';

    if (demoMode) {
      const demoSetupTimer = window.setTimeout(() => {
        setIsDemoMode(true);
        setMonitors(demoMonitors);
        setTrendData(demoTrendData);
        setLogs(demoLogs);
        setLoading(false);
      }, 0);

      return () => window.clearTimeout(demoSetupTimer);
    }

    const initialFetchTimer = window.setTimeout(() => {
      fetchSummary();
      fetchTrend();
      fetchLogs();
    }, 0);
    const interval = setInterval(() => {
      fetchSummary();
      fetchTrend();
      fetchLogs();
    }, 60000);
    return () => {
      window.clearTimeout(initialFetchTimer);
      clearInterval(interval);
    };
  }, [fetchLogs, fetchSummary, fetchTrend]);

  const handleNavChange = (view: NavKey) => {
    setActiveView(view);
    setMobileNavOpen(false);
  };

  const openCreateMonitor = () => {
    setEditingMonitor(null);
    setMonitorForm(initialMonitorForm);
    setFormError('');
    setShowCreateMonitor(true);
    setActiveView('endpoints');
  };

  const openEditMonitor = (monitor: Monitor) => {
    setEditingMonitor(monitor);
    setMonitorForm({
      name: monitor.name,
      url: monitor.url,
      method: monitor.method || 'GET',
      expectedStatus: String(monitor.expectedStatus ?? 200),
      interval: String(monitor.interval ?? 60),
    });
    setFormError('');
    setShowCreateMonitor(true);
    setActiveView('endpoints');
  };

  const closeMonitorEditor = () => {
    setShowCreateMonitor(false);
    setEditingMonitor(null);
    setMonitorForm(initialMonitorForm);
    setFormError('');
  };

  const handleSaveMonitor = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');

    const url = monitorForm.url.trim();
    if (!url) {
      setFormError('Endpoint URL is required.');
      return;
    }

    let interval: number;
    let expectedStatus: number;
    try {
      interval = parseMonitorInterval(monitorForm.interval);
      expectedStatus = parseExpectedStatus(monitorForm.expectedStatus);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Invalid check frequency.');
      return;
    }

    setIsSavingMonitor(true);
    const payload: MonitorPayload = {
      name: monitorForm.name.trim() || url,
      url,
      method: monitorForm.method,
      expectedStatus,
      interval,
    };

    if (isDemoMode) {
      setMonitors((current) => editingMonitor
        ? current.map((monitor) => monitor._id === editingMonitor._id ? { ...monitor, ...payload } : monitor)
        : [{
            _id: `demo-${Date.now()}`,
            ...payload,
            status: 'PENDING',
            lastStatus: null,
            responseTime: undefined,
            lastChecked: null,
          }, ...current]);
      closeMonitorEditor();
      setActiveView('endpoints');
      setIsSavingMonitor(false);
      return;
    }

    try {
      const data = editingMonitor
        ? await updateMonitor(editingMonitor._id, payload)
        : await createMonitor(payload);
      setMonitors((current) => editingMonitor
        ? current.map((monitor) => monitor._id === editingMonitor._id ? data.endpoint : monitor)
        : [data.endpoint, ...current]);
      closeMonitorEditor();
      setActiveView('endpoints');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        redirectToAuth();
        return;
      }
      setFormError(error instanceof ApiError ? error.message : 'Backend is not reachable. Start the API server and try again.');
    } finally {
      setIsSavingMonitor(false);
    }
  };

  const handleUpdateMonitorInterval = async (monitor: Monitor, intervalValue: string) => {
    let interval: number;
    try {
      interval = parseMonitorInterval(intervalValue);
      setFormError('');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Invalid check frequency.');
      return;
    }

    if (isDemoMode) {
      setMonitors((current) => current.map((item) => (
        item._id === monitor._id ? { ...item, interval } : item
      )));
      return;
    }

    setSavingIntervalId(monitor._id);

    try {
      const data = await updateMonitor(monitor._id, { interval });
      if (data.endpoint) {
        setMonitors((current) => current.map((item) => (
          item._id === monitor._id ? { ...item, ...data.endpoint } : item
        )));
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        redirectToAuth();
        return;
      }
      setFormError(error instanceof ApiError ? error.message : 'Could not update check frequency. Confirm the API server is running.');
    } finally {
      setSavingIntervalId(null);
    }
  };

  const handleDeleteMonitor = async (monitor: Monitor) => {
    if (!window.confirm(`Delete “${monitor.name}” and its check history?`)) return;

    if (isDemoMode) {
      setMonitors((current) => current.filter((item) => item._id !== monitor._id));
      setLogs((current) => current.filter((log) => (
        typeof log.monitor === 'object' ? log.monitor?._id !== monitor._id : log.monitor !== monitor._id
      )));
      return;
    }

    setDeletingMonitorId(monitor._id);
    setFormError('');
    try {
      await deleteMonitor(monitor._id);
      setMonitors((current) => current.filter((item) => item._id !== monitor._id));
      setLogs((current) => current.filter((log) => (
        typeof log.monitor === 'object' ? log.monitor?._id !== monitor._id : log.monitor !== monitor._id
      )));
      if (editingMonitor?._id === monitor._id) closeMonitorEditor();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        redirectToAuth();
        return;
      }
      setFormError(error instanceof ApiError ? error.message : 'Monitor could not be deleted.');
    } finally {
      setDeletingMonitorId(null);
    }
  };

  const handleLogout = async () => {
    if (isDemoMode) {
      router.replace('/');
      return;
    }

    try {
      await logout();
    } finally {
      redirectToAuth();
    }
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return 'Not checked yet';
    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  };

  const totalEndpoints = monitors.length;
  const onlineEndpoints = monitors.filter(monitorIsUp).length;
  const downEndpoints = monitors.filter((monitor) => monitorStateLabel(monitor) === 'DOWN').length;
  const pendingEndpoints = monitors.filter((monitor) => monitorStateLabel(monitor) === 'PENDING').length;
  const checkedEndpoints = totalEndpoints - pendingEndpoints;
  const uptimePercentage = checkedEndpoints > 0 ? ((onlineEndpoints / checkedEndpoints) * 100).toFixed(1) : '0';
  const filteredMonitors = filterMonitors(monitors, search);
  const healthTone = downEndpoints > 0
    ? 'text-amber-700 bg-amber-400/20 ring-amber-600/30'
    : pendingEndpoints > 0
      ? 'text-blue-700 bg-blue-400/15 ring-blue-600/25'
      : 'text-emerald-700 bg-emerald-400/15 ring-emerald-600/25';
  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a12] flex items-center justify-center text-indigo-400 font-medium">
        <Activity className="animate-spin mr-3" />
        Loading PulseGuard...
      </div>
    );
  }

  return (
    <div className="dashboard-v2 flex min-h-screen bg-[#f2f0e8] text-[#11110f] font-sans">
      <aside className="dashboard-sidebar hidden w-72 border-r-2 border-black bg-[#11110f] lg:flex flex-col h-screen sticky top-0">
        <div className="p-6 flex items-center gap-3 text-white font-black text-xl tracking-tight">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-300/20">
            <Activity size={24} className="stroke-[3px]" />
          </span>
          <span>PulseGuard</span>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <NavItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              active={activeView === item.key}
              onClick={() => handleNavChange(item.key)}
            />
          ))}
        </nav>
        <div className="m-4 rounded-2xl border border-indigo-300/20 bg-white/[0.035] p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-indigo-200">
            <Zap size={19} />
          </div>
          <p className="text-sm font-black text-white">Next check</p>
          <p className="mt-2 text-xs leading-5 text-slate-400">Checks run through BullMQ workers and logs expire automatically after 30 days.</p>
        </div>
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileNavOpen(false)}>
          <aside id="dashboard-mobile-navigation" ref={mobileNavRef} role="dialog" aria-modal="true" aria-label="Dashboard navigation" className="dashboard-sidebar h-full w-72 border-r-2 border-black bg-[#11110f] p-4" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between gap-3 text-white font-black text-lg">
              <span className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-300/20">
                  <Activity size={22} />
                </span>
                PulseGuard
              </span>
              <button type="button" className="grid h-10 w-10 place-items-center border border-white/40 text-white" onClick={() => setMobileNavOpen(false)} aria-label="Close dashboard navigation">
                <X size={19} />
              </button>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavItem
                  key={item.key}
                  icon={item.icon}
                  label={item.label}
                  active={activeView === item.key}
                  onClick={() => handleNavChange(item.key)}
                />
              ))}
            </nav>
          </aside>
        </div>
      )}

      <main className="flex-1 overflow-y-auto">
        <header className="dashboard-topbar h-16 border-b-2 border-black flex items-center justify-between gap-4 px-5 md:px-8 bg-[#f2f0e8]/90 backdrop-blur-md sticky top-0 z-20">
          <button
            ref={mobileMenuButtonRef}
            type="button"
            className="dashboard-icon-button grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white lg:hidden"
            onClick={(event) => {
              event.stopPropagation();
              setMobileNavOpen(true);
            }}
            aria-label="Open dashboard navigation"
            aria-controls="dashboard-mobile-navigation"
            aria-expanded={mobileNavOpen}
          >
            <Menu size={20} />
          </button>
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search endpoints..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>
          <div className={`hidden items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 md:inline-flex ${healthTone}`}>
            <Radio size={15} />
            {downEndpoints > 0
              ? `${downEndpoints} incident${downEndpoints > 1 ? 's' : ''}`
              : pendingEndpoints > 0
                ? `${pendingEndpoints} awaiting first check`
                : 'All systems nominal'}
          </div>
          <button
            type="button"
            className="hidden items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-400 sm:inline-flex"
            onClick={openCreateMonitor}
          >
            <Plus size={17} />
            Add endpoint
          </button>
        </header>

        <div className="p-5 md:p-8 max-w-7xl mx-auto space-y-8">
          <section className="dashboard-hero overflow-hidden border-2 border-black bg-[#b7ff3c] p-6 md:p-8">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.24em] text-indigo-300">Command center</p>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">
                  {navItems.find((item) => item.key === activeView)?.label}
                </h1>
                <p className="mt-2 text-slate-400">
                  {isDemoMode
                    ? 'Demo monitoring overview with sample endpoints, latency, and incident priorities.'
                    : 'Monitoring overview with current health, latency, and incident priorities.'}
                </p>
              </div>
              <div className="space-y-4">
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-400 sm:hidden"
                  onClick={openCreateMonitor}
                >
                  <Plus size={17} />
                  Add endpoint
                </button>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {isDemoMode && <MiniSignal icon={<Gauge size={16} />} label="Mode" value="Demo" />}
                  <MiniSignal icon={<Cpu size={16} />} label="Execution" value="BullMQ" />
                  {!isDemoMode && <MiniSignal icon={<Clock size={16} />} label="Refresh" value="60s" />}
                </div>
              </div>
            </div>
          </section>

          {formError && !showCreateMonitor && (
            <p className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200" role="alert">
              {formError}
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <DashboardStatCard icon={<Activity className="text-indigo-400" />} label="Active Endpoints" value={totalEndpoints} sub="Total" accent="from-indigo-500/20" />
            <DashboardStatCard icon={<TrendingUp className="text-emerald-400" />} label="Current Uptime" value={`${uptimePercentage}%`} sub="Live" accent="from-emerald-500/20" />
            <DashboardStatCard icon={<AlertCircle className="text-amber-400" />} label="Incidents" value={downEndpoints} sub="Down now" accent="from-amber-500/20" />
          </div>

          {showCreateMonitor && (
            <MonitorEditor
              editing={Boolean(editingMonitor)}
              error={formError}
              form={monitorForm}
              isSaving={isSavingMonitor}
              onCancel={closeMonitorEditor}
              onChange={(field, value) => setMonitorForm((current) => ({ ...current, [field]: value }))}
              onSubmit={handleSaveMonitor}
            />
          )}

          {activeView === 'overview' && (
            <>
              <TrendPanel
                trendData={trendData}
                isDemoMode={isDemoMode}
                onOpenCreate={openCreateMonitor}
              />
              <EndpointList
                deletingMonitorId={deletingMonitorId}
                filteredMonitors={filteredMonitors}
                formatDateTime={formatDateTime}
                monitorIsUp={monitorIsUp}
                monitorStateLabel={monitorStateLabel}
                onDelete={handleDeleteMonitor}
                onEdit={openEditMonitor}
                onOpenCreate={openCreateMonitor}
                onUpdateInterval={handleUpdateMonitorInterval}
                savingIntervalId={savingIntervalId}
                totalEndpoints={totalEndpoints}
              />
            </>
          )}

          {activeView === 'endpoints' && (
            <EndpointList
              deletingMonitorId={deletingMonitorId}
              filteredMonitors={filteredMonitors}
              formatDateTime={formatDateTime}
              monitorIsUp={monitorIsUp}
              monitorStateLabel={monitorStateLabel}
              onDelete={handleDeleteMonitor}
              onEdit={openEditMonitor}
              onOpenCreate={openCreateMonitor}
              onUpdateInterval={handleUpdateMonitorInterval}
              savingIntervalId={savingIntervalId}
              totalEndpoints={totalEndpoints}
            />
          )}

          {activeView === 'logs' && (
            <CheckHistoryPanel
              error={logsError}
              formatDateTime={formatDateTime}
              isDemoMode={isDemoMode}
              isLoading={logsLoading}
              logs={logs}
              nextCursor={logsCursor}
              onLoadMore={() => fetchLogs({ append: true, cursor: logsCursor })}
              onRefresh={() => isDemoMode ? undefined : fetchLogs()}
              search={search}
            />
          )}

          {activeView === 'settings' && (
            <SettingsPanel
              isDemoMode={isDemoMode}
              onLogout={handleLogout}
              onUnauthorized={redirectToAuth}
              totalEndpoints={totalEndpoints}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`dashboard-nav-item flex w-full items-center gap-3 px-3 py-2.5 text-left transition ${active ? 'active bg-indigo-600/10 text-indigo-300 font-bold' : 'hover:bg-white/[0.04] text-slate-400 hover:text-slate-200'}`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}

function DashboardStatCard({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub: string; accent: string }) {
  return (
    <div className="dashboard-stat relative overflow-hidden border-2 border-black bg-white p-5 space-y-3">
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${accent} to-transparent`} />
      <div className="flex justify-between items-start">
        <div className="relative p-2 bg-white/[0.04] rounded-xl ring-1 ring-white/10">{icon}</div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{sub}</span>
      </div>
      <div className="relative">
        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
      </div>
    </div>
  );
}

function SettingsPanel({
  isDemoMode,
  onLogout,
  onUnauthorized,
  totalEndpoints,
}: {
  isDemoMode: boolean;
  onLogout: () => void;
  onUnauthorized: () => void;
  totalEndpoints: number;
}) {
  return (
    <div className="space-y-5">
      <div className="dashboard-panel border-2 border-black bg-white p-5">
        <h3 className="text-sm font-black text-white">Workspace Settings</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <MetricPair label="Mode" value={isDemoMode ? 'Demo preview' : 'Authenticated workspace'} />
          <MetricPair label="Default refresh" value="60s" />
          <MetricPair label="Configured monitors" value={String(totalEndpoints)} />
        </div>
        <button type="button" className="dashboard-danger-action mt-6 inline-flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2.5 text-sm font-bold text-red-200 transition hover:bg-red-500/20" onClick={onLogout}>
          <LogOut size={16} />
          {isDemoMode ? 'Exit demo' : 'Sign out'}
        </button>
      </div>
      <TelegramSettings isDemoMode={isDemoMode} onUnauthorized={onUnauthorized} />
    </div>
  );
}

function MetricPair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-white">{value}</p>
      <p className="text-[10px] uppercase tracking-widest text-slate-600">{label}</p>
    </div>
  );
}

function MiniSignal({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="dashboard-mini border-2 border-black bg-white p-3">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      <p className="mt-2 text-lg font-black text-white">{value}</p>
    </div>
  );
}
