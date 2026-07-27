"use client";

import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  Bell,
  CheckCircle2,
  Clock,
  Cpu,
  FileText,
  Gauge,
  Globe2,
  LayoutDashboard,
  Menu,
  MoreVertical,
  Plus,
  Radio,
  Search,
  Settings,
  ShieldCheck,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type Monitor = {
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

type TrendPoint = {
  name: string;
  uptime: number;
  latency: number;
};

type TrendResponsePoint = {
  checkedAt: string;
  uptime: number;
  latency: number;
};

type NavKey = 'overview' | 'endpoints' | 'logs' | 'alerts' | 'settings';

type MonitorForm = {
  name: string;
  url: string;
  method: string;
  expectedStatus: string;
  interval: string;
};

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

const incidentPlaybook = [
  'Verify failing region',
  'Check auth and DNS',
  'Notify channel owner',
  'Confirm recovery signal',
];

const navItems: Array<{ key: NavKey; label: string; icon: React.ReactNode }> = [
  { key: 'overview', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { key: 'endpoints', label: 'Endpoints', icon: <Activity size={20} /> },
  { key: 'logs', label: 'Logs', icon: <FileText size={20} /> },
  { key: 'alerts', label: 'Alerts', icon: <Bell size={20} /> },
  { key: 'settings', label: 'Settings', icon: <Settings size={20} /> },
];

const initialMonitorForm: MonitorForm = {
  name: '',
  url: '',
  method: 'GET',
  expectedStatus: '200',
  interval: '60',
};

const intervalOptions = [
  { value: 1, label: '1 sec' },
  { value: 30, label: '30 sec' },
  { value: 60, label: '1 min' },
  { value: 300, label: '5 min' },
  { value: 900, label: '15 min' },
  { value: 1800, label: '30 min' },
  { value: 3600, label: '1 hour' },
];

const normalizeIntervalValue = (value: string | number) => {
  const interval = Number(value);
  if (!Number.isFinite(interval)) return 60;
  return Math.min(86400, Math.max(1, Math.round(interval)));
};

const formatInterval = (seconds?: number) => {
  const interval = seconds ?? 60;
  if (interval < 60) return `${interval}s`;
  if (interval % 3600 === 0) return `${interval / 3600}h`;
  if (interval % 60 === 0) return `${interval / 60}m`;
  return `${interval}s`;
};

const formatTrendLabel = (value: string) => {
  return new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

export default function Dashboard() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [activeView, setActiveView] = useState<NavKey>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showCreateMonitor, setShowCreateMonitor] = useState(false);
  const [monitorForm, setMonitorForm] = useState<MonitorForm>(initialMonitorForm);
  const [formError, setFormError] = useState('');
  const [isSavingMonitor, setIsSavingMonitor] = useState(false);
  const [savingIntervalId, setSavingIntervalId] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/dashboard/summary', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setMonitors(Array.isArray(data) ? data : []);
      } else {
        setMonitors((current) => current.length > 0 ? current : []);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setMonitors((current) => current.length > 0 ? current : demoMonitors);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTrend = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/dashboard/trend', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setTrendData([]);
        return;
      }

      const data = await res.json();
      const nextTrendData = Array.isArray(data)
        ? data.map((point: TrendResponsePoint) => ({
            name: formatTrendLabel(point.checkedAt),
            uptime: point.uptime,
            latency: point.latency,
          }))
        : [];

      setTrendData(nextTrendData);
    } catch (err) {
      console.error('Trend fetch error:', err);
      setTrendData([]);
    }
  }, []);

  useEffect(() => {
    const demoMode = new URLSearchParams(window.location.search).get('demo') === '1';

    if (demoMode) {
      const demoSetupTimer = window.setTimeout(() => {
        setIsDemoMode(true);
        setMonitors(demoMonitors);
        setTrendData(demoTrendData);
        setLoading(false);
      }, 0);

      return () => window.clearTimeout(demoSetupTimer);
    }

    const initialFetchTimer = window.setTimeout(() => {
      fetchSummary();
      fetchTrend();
    }, 0);
    const interval = setInterval(() => {
      fetchSummary();
      fetchTrend();
    }, 60000);
    return () => {
      window.clearTimeout(initialFetchTimer);
      clearInterval(interval);
    };
  }, [fetchSummary, fetchTrend]);

  const handleNavChange = (view: NavKey) => {
    setActiveView(view);
    setMobileNavOpen(false);
    setActiveMenu(null);
  };

  const handleCreateMonitor = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');

    const url = monitorForm.url.trim();
    if (!url) {
      setFormError('Endpoint URL is required.');
      return;
    }

    setIsSavingMonitor(true);
    const payload = {
      name: monitorForm.name.trim() || url,
      url,
      method: monitorForm.method,
      expectedStatus: Number(monitorForm.expectedStatus) || 200,
      interval: normalizeIntervalValue(monitorForm.interval),
    };

    if (isDemoMode) {
      setMonitors((current) => [
        {
          _id: `demo-${Date.now()}`,
          ...payload,
          status: 'PENDING',
          lastStatus: null,
          responseTime: undefined,
          lastChecked: null,
        },
        ...current,
      ]);
      setMonitorForm(initialMonitorForm);
      setShowCreateMonitor(false);
      setActiveView('endpoints');
      setIsSavingMonitor(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setFormError('Sign in again to create endpoint monitors.');
        return;
      }

      const res = await fetch('/api/monitor/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || data.message || 'Monitor could not be created.');
        return;
      }

      setMonitors((current) => [data.endpoint, ...current]);
      setMonitorForm(initialMonitorForm);
      setShowCreateMonitor(false);
      setActiveView('endpoints');
    } catch {
      setFormError('Backend is not reachable. Start the API server and try again.');
    } finally {
      setIsSavingMonitor(false);
    }
  };

  const handleUpdateMonitorInterval = async (monitor: Monitor, intervalValue: string) => {
    const interval = normalizeIntervalValue(intervalValue);

    if (isDemoMode) {
      setMonitors((current) => current.map((item) => (
        item._id === monitor._id ? { ...item, interval } : item
      )));
      return;
    }

    setSavingIntervalId(monitor._id);

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`/api/monitor/${monitor._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ interval }),
      });
      const data = await res.json();

      if (res.ok && data.endpoint) {
        setMonitors((current) => current.map((item) => (
          item._id === monitor._id ? { ...item, ...data.endpoint } : item
        )));
      }
    } catch {
      setFormError('Could not update check frequency. Confirm the API server is running.');
    } finally {
      setSavingIntervalId(null);
    }
  };

  const monitorIsUp = (monitor: Monitor) => {
    const state = String(monitor.status ?? monitor.lastStatus ?? '').toLowerCase();
    if (state === 'up') return true;
    if (state === 'down') return false;
    if (typeof monitor.lastStatus === 'number') return monitor.lastStatus >= 200 && monitor.lastStatus < 400;
    return false;
  };

  const monitorStateLabel = (monitor: Monitor) => {
    const state = String(monitor.status ?? '').toUpperCase();
    if (state === 'UP' || state === 'DOWN' || state === 'PENDING') return state;
    if (typeof monitor.lastStatus === 'number') return String(monitor.lastStatus);
    return String(monitor.lastStatus ?? 'PENDING').toUpperCase();
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
  const downEndpoints = totalEndpoints - onlineEndpoints;
  const uptimePercentage = totalEndpoints > 0 ? ((onlineEndpoints / totalEndpoints) * 100).toFixed(1) : '0';
  const filteredMonitors = monitors.filter((monitor) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return `${monitor.name} ${monitor.url} ${monitor.lastStatus ?? ''}`.toLowerCase().includes(query);
  });
  const healthTone = downEndpoints === 0
    ? 'text-emerald-300 bg-emerald-400/10 ring-emerald-400/20'
    : 'text-amber-300 bg-amber-400/10 ring-amber-400/20';
  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a12] flex items-center justify-center text-indigo-400 font-medium">
        <Activity className="animate-spin mr-3" />
        Loading PulseGuard...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#070a12] text-slate-300 font-sans" onClick={() => setActiveMenu(null)}>
      <aside className="hidden w-72 border-r border-white/10 bg-[#0b0f19]/90 lg:flex flex-col h-screen sticky top-0">
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
          <p className="mt-2 text-xs leading-5 text-slate-400">Create monitors first, then connect Telegram alerts for downtime routing.</p>
        </div>
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileNavOpen(false)}>
          <aside className="h-full w-72 border-r border-white/10 bg-[#0b0f19] p-4" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-center gap-3 text-white font-black text-lg">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-300/20">
                <Activity size={22} />
              </span>
              PulseGuard
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
        <header className="h-16 border-b border-white/10 flex items-center justify-between gap-4 px-5 md:px-8 bg-[#070a12]/80 backdrop-blur-md sticky top-0 z-20">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white lg:hidden"
            onClick={(event) => {
              event.stopPropagation();
              setMobileNavOpen(true);
            }}
            aria-label="Open dashboard navigation"
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
            {downEndpoints === 0 ? 'All systems nominal' : `${downEndpoints} incident${downEndpoints > 1 ? 's' : ''}`}
          </div>
          <button
            type="button"
            className="hidden items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-400 sm:inline-flex"
            onClick={(event) => {
              event.stopPropagation();
              setShowCreateMonitor(true);
              setActiveView('endpoints');
            }}
          >
            <Plus size={17} />
            Add endpoint
          </button>
        </header>

        <div className="p-5 md:p-8 max-w-7xl mx-auto space-y-8">
          <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.24),transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.055),rgba(255,255,255,0.02))] p-6 md:p-8">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.24em] text-indigo-300">Command center</p>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">
                  {navItems.find((item) => item.key === activeView)?.label}
                </h1>
                <p className="mt-2 text-slate-400">
                  {isDemoMode
                    ? 'Demo monitoring overview with sample endpoints, latency, and incident priorities.'
                    : 'Real-time monitoring overview with live health, latency, and incident priorities.'}
                </p>
              </div>
              <div className="space-y-4">
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-400 sm:hidden"
                  onClick={(event) => {
                    event.stopPropagation();
                    setShowCreateMonitor(true);
                    setActiveView('endpoints');
                  }}
                >
                  <Plus size={17} />
                  Add endpoint
                </button>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {isDemoMode && <MiniSignal icon={<Gauge size={16} />} label="Mode" value="Demo" />}
                  <MiniSignal icon={<Globe2 size={16} />} label="Regions" value="3" />
                  <MiniSignal icon={<Cpu size={16} />} label="Checks/min" value={String(Math.max(totalEndpoints, 1))} />
                  {!isDemoMode && <MiniSignal icon={<Clock size={16} />} label="Refresh" value="60s" />}
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <DashboardStatCard icon={<Activity className="text-indigo-400" />} label="Active Endpoints" value={totalEndpoints} sub="Total" accent="from-indigo-500/20" />
            <DashboardStatCard icon={<TrendingUp className="text-emerald-400" />} label="Current Uptime" value={`${uptimePercentage}%`} sub="Live" accent="from-emerald-500/20" />
            <DashboardStatCard icon={<AlertCircle className="text-amber-400" />} label="Incidents" value={downEndpoints} sub="Down now" accent="from-amber-500/20" />
          </div>

          {showCreateMonitor && (
            <MonitorCreateForm
              error={formError}
              form={monitorForm}
              isSaving={isSavingMonitor}
              onCancel={() => {
                setShowCreateMonitor(false);
                setFormError('');
              }}
              onChange={(field, value) => setMonitorForm((current) => ({ ...current, [field]: value }))}
              onSubmit={handleCreateMonitor}
            />
          )}

          {activeView === 'overview' && (
            <>
              <TrendAndPlaybook
                trendData={trendData}
                isDemoMode={isDemoMode}
                onOpenCreate={() => {
                  setShowCreateMonitor(true);
                  setActiveView('endpoints');
                }}
              />
              <EndpointList
                activeMenu={activeMenu}
                filteredMonitors={filteredMonitors}
                formatDateTime={formatDateTime}
                monitorIsUp={monitorIsUp}
                monitorStateLabel={monitorStateLabel}
                onOpenCreate={() => {
                  setShowCreateMonitor(true);
                  setActiveView('endpoints');
                }}
                onUpdateInterval={handleUpdateMonitorInterval}
                savingIntervalId={savingIntervalId}
                setActiveMenu={setActiveMenu}
                totalEndpoints={totalEndpoints}
              />
            </>
          )}

          {activeView === 'endpoints' && (
            <EndpointList
              activeMenu={activeMenu}
              filteredMonitors={filteredMonitors}
              formatDateTime={formatDateTime}
              monitorIsUp={monitorIsUp}
              monitorStateLabel={monitorStateLabel}
              onOpenCreate={() => setShowCreateMonitor(true)}
              onUpdateInterval={handleUpdateMonitorInterval}
              savingIntervalId={savingIntervalId}
              setActiveMenu={setActiveMenu}
              totalEndpoints={totalEndpoints}
            />
          )}

          {activeView === 'logs' && (
            <LogsPanel formatDateTime={formatDateTime} monitors={filteredMonitors} monitorIsUp={monitorIsUp} />
          )}

          {activeView === 'alerts' && (
            <AlertsPanel downEndpoints={downEndpoints} totalEndpoints={totalEndpoints} />
          )}

          {activeView === 'settings' && (
            <SettingsPanel isDemoMode={isDemoMode} totalEndpoints={totalEndpoints} />
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
      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${active ? 'bg-indigo-600/10 text-indigo-300 font-bold ring-1 ring-indigo-500/10' : 'hover:bg-white/[0.04] text-slate-400 hover:text-slate-200'}`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}

function DashboardStatCard({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub: string; accent: string }) {
  return (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0d1117] p-5 space-y-3">
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

function TrendAndPlaybook({
  trendData,
  isDemoMode,
  onOpenCreate,
}: {
  trendData: Array<{ name: string; uptime: number; latency: number }>;
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

function MonitorCreateForm({
  error,
  form,
  isSaving,
  onCancel,
  onChange,
  onSubmit,
}: {
  error: string;
  form: MonitorForm;
  isSaving: boolean;
  onCancel: () => void;
  onChange: (field: keyof MonitorForm, value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  return (
    <form className="rounded-[1.75rem] border border-indigo-300/20 bg-[#0d1117]/90 p-5" onSubmit={onSubmit}>
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-sm font-black text-white">Create Endpoint Monitor</h3>
          <p className="mt-1 text-xs text-slate-500">Add a URL, expected status, and check frequency.</p>
        </div>
        <button type="button" className="text-sm font-bold text-slate-400 transition hover:text-white" onClick={onCancel}>
          Cancel
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_1.5fr_0.7fr_0.7fr_0.7fr]">
        <input className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none focus:border-indigo-400/60" placeholder="Name" value={form.name} onChange={(event) => onChange('name', event.target.value)} />
        <input className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none focus:border-indigo-400/60" placeholder="https://api.example.com/health" type="url" value={form.url} onChange={(event) => onChange('url', event.target.value)} required />
        <select className="rounded-xl border border-white/10 bg-[#111827] px-3 py-3 text-sm text-white outline-none focus:border-indigo-400/60" value={form.method} onChange={(event) => onChange('method', event.target.value)}>
          <option>GET</option>
          <option>POST</option>
          <option>PUT</option>
          <option>DELETE</option>
        </select>
        <input className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none focus:border-indigo-400/60" inputMode="numeric" placeholder="200" value={form.expectedStatus} onChange={(event) => onChange('expectedStatus', event.target.value)} />
        <select className="rounded-xl border border-white/10 bg-[#111827] px-3 py-3 text-sm text-white outline-none focus:border-indigo-400/60" value={form.interval} onChange={(event) => onChange('interval', event.target.value)}>
          {intervalOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      {error && <p className="mt-3 text-sm font-semibold text-red-300">{error}</p>}
      <button type="submit" disabled={isSaving} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60">
        <Plus size={17} />
        {isSaving ? 'Creating...' : 'Create monitor'}
      </button>
    </form>
  );
}

function EndpointList({
  activeMenu,
  filteredMonitors,
  formatDateTime,
  monitorIsUp,
  monitorStateLabel,
  onOpenCreate,
  onUpdateInterval,
  savingIntervalId,
  setActiveMenu,
  totalEndpoints,
}: {
  activeMenu: string | null;
  filteredMonitors: Monitor[];
  formatDateTime: (value?: string | null) => string;
  monitorIsUp: (monitor: Monitor) => boolean;
  monitorStateLabel: (monitor: Monitor) => string;
  onOpenCreate: () => void;
  onUpdateInterval: (monitor: Monitor, intervalValue: string) => void;
  savingIntervalId: string | null;
  setActiveMenu: (value: string | null) => void;
  totalEndpoints: number;
}) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0d1117]/90">
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-sm font-black text-white">Endpoint Activity</h3>
          <p className="mt-1 text-xs text-slate-500">{filteredMonitors.length} visible from {totalEndpoints} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-400" onClick={onOpenCreate}>
            <Plus size={16} />
            Add endpoint
          </button>
          <button
            type="button"
            className="rounded-full p-2 text-slate-500 transition hover:bg-white/5 hover:text-white"
            onClick={(event) => {
              event.stopPropagation();
              setActiveMenu(activeMenu === 'activity' ? null : 'activity');
            }}
            aria-label="Endpoint activity options"
          >
            <MoreVertical size={20} />
          </button>
        </div>
      </div>
      <div className="divide-y divide-white/5">
        {filteredMonitors.length > 0 ? (
          filteredMonitors.map((monitor) => {
            const isUp = monitorIsUp(monitor);
            const currentInterval = monitor.interval ?? 60;
            const hasPresetInterval = intervalOptions.some((option) => option.value === currentInterval);
            return (
              <div key={monitor._id} className="grid gap-4 p-5 transition hover:bg-white/[0.025] lg:grid-cols-[1.2fr_0.75fr_0.9fr_0.7fr] lg:items-center">
                <div className="flex items-center gap-3">
                  <div className={`grid h-11 w-11 place-items-center rounded-2xl ${isUp ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>
                    {isUp ? <CheckCircle2 size={19} /> : <X size={19} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{monitor.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono break-all">{monitor.url}</p>
                  </div>
                </div>
                <MetricPair label="Last checked" value={formatDateTime(monitor.lastChecked)} />
                <div>
                  <select
                    className="w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-xs font-bold text-white outline-none transition focus:border-indigo-400/60 disabled:cursor-not-allowed disabled:opacity-60"
                    value={String(monitor.interval ?? 60)}
                    disabled={savingIntervalId === monitor._id}
                    onChange={(event) => onUpdateInterval(monitor, event.target.value)}
                    onClick={(event) => event.stopPropagation()}
                    aria-label={`Check frequency for ${monitor.name}`}
                  >
                    {!hasPresetInterval && <option value={currentInterval}>{formatInterval(currentInterval)}</option>}
                    {intervalOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-[10px] uppercase tracking-widest text-slate-600">
                    {savingIntervalId === monitor._id ? 'Saving' : `Every ${formatInterval(monitor.interval)}`}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4 lg:justify-end">
                  <MetricPair label="Latency" value={`${monitor.responseTime ?? '-'}ms`} />
                  <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ring-1 ${isUp ? 'text-emerald-300 bg-emerald-500/10 ring-emerald-500/20' : 'text-red-300 bg-red-500/10 ring-red-500/20'}`}>
                    {monitorStateLabel(monitor)}
                  </span>
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

function LogsPanel({ formatDateTime, monitors, monitorIsUp }: { formatDateTime: (value?: string | null) => string; monitors: Monitor[]; monitorIsUp: (monitor: Monitor) => boolean }) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-[#0d1117]/90 p-5">
      <h3 className="text-sm font-black text-white">Incident & Check Logs</h3>
      <p className="mt-1 text-xs text-slate-500">Recent monitor checks from available endpoint data.</p>
      <div className="mt-5 space-y-3">
        {monitors.map((monitor) => (
          <div key={monitor._id} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[1fr_0.6fr_0.6fr] md:items-center">
            <div>
              <p className="text-sm font-bold text-white">{monitor.name}</p>
              <p className="mt-1 break-all font-mono text-[11px] text-slate-500">{monitor.url}</p>
            </div>
            <MetricPair label="Last checked" value={formatDateTime(monitor.lastChecked)} />
            <span className={`w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase ring-1 ${monitorIsUp(monitor) ? 'text-emerald-300 bg-emerald-500/10 ring-emerald-500/20' : 'text-amber-300 bg-amber-500/10 ring-amber-500/20'}`}>
              {monitorIsUp(monitor) ? 'Recovered / healthy' : 'Needs attention'}
            </span>
          </div>
        ))}
        {monitors.length === 0 && <div className="rounded-2xl border border-white/10 p-8 text-center text-sm text-slate-500">No check logs yet.</div>}
      </div>
    </div>
  );
}

function AlertsPanel({ downEndpoints, totalEndpoints }: { downEndpoints: number; totalEndpoints: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-[1.75rem] border border-white/10 bg-[#0d1117]/90 p-5">
        <h3 className="text-sm font-black text-white">Alert Routing</h3>
        <p className="mt-1 text-xs text-slate-500">Operational alert state based on current monitors.</p>
        <div className="mt-5 grid gap-3">
          <MetricPair label="Monitors watched" value={String(totalEndpoints)} />
          <MetricPair label="Open incidents" value={String(downEndpoints)} />
          <MetricPair label="Default channel" value="Telegram" />
        </div>
      </div>
      <div className="rounded-[1.75rem] border border-white/10 bg-[#0d1117]/90 p-5">
        <h3 className="text-sm font-black text-white">Notification Rules</h3>
        <div className="mt-5 space-y-3 text-sm text-slate-300">
          {['Alert after confirmed failed check', 'Include URL, status, latency, and last checked time', 'Send recovery notice when endpoint returns healthy'].map((rule) => (
            <div key={rule} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <Bell size={16} className="text-indigo-300" />
              {rule}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsPanel({ isDemoMode, totalEndpoints }: { isDemoMode: boolean; totalEndpoints: number }) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-[#0d1117]/90 p-5">
      <h3 className="text-sm font-black text-white">Workspace Settings</h3>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <MetricPair label="Mode" value={isDemoMode ? 'Demo preview' : 'Authenticated workspace'} />
        <MetricPair label="Default refresh" value="60s" />
        <MetricPair label="Configured monitors" value={String(totalEndpoints)} />
      </div>
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      <p className="mt-2 text-lg font-black text-white">{value}</p>
    </div>
  );
}
