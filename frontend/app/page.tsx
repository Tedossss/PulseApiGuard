import Link from 'next/link';
import { Activity, ArrowRight, BellRing, CheckCircle2, Gauge, Globe2, LockKeyhole, Radar, ShieldCheck, Sparkles, Zap } from 'lucide-react';

const metrics = [
  { value: '99.98%', label: 'average uptime', tone: 'text-emerald-300' },
  { value: '28ms', label: 'median probe time', tone: 'text-cyan-300' },
  { value: '14k+', label: 'checks per day', tone: 'text-violet-300' },
];

const features = [
  {
    icon: <Radar size={22} />,
    title: 'Smart endpoint checks',
    text: 'Group critical APIs, tune intervals, and spot slow routes before users report them.',
  },
  {
    icon: <BellRing size={22} />,
    title: 'Noise-aware alerts',
    text: 'Escalate only confirmed incidents with clear context: status, latency, and last healthy check.',
  },
  {
    icon: <ShieldCheck size={22} />,
    title: 'Reliability cockpit',
    text: 'A focused dashboard for uptime, incidents, response time, and operational priorities.',
  },
];

const timeline = ['Probe', 'Validate', 'Alert', 'Recover'];

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070a12] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(99,102,241,0.32),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(168,85,247,0.22),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0)_0%,#070a12_82%)]" />
      <div className="pointer-events-none absolute left-1/2 top-8 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />

      <section className="relative mx-auto flex w-full max-w-7xl flex-col px-6 pb-20 pt-6 lg:px-8">
        <nav className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-2 text-lg font-black tracking-tight">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-400/30">
              <Activity size={20} className="stroke-[3px]" />
            </span>
            PulseGuard
          </Link>
          <div className="hidden items-center gap-6 text-sm text-slate-400 md:flex">
            <a href="#features" className="transition hover:text-white">Features</a>
            <a href="#workflow" className="transition hover:text-white">Workflow</a>
            <a href="#pricing" className="transition hover:text-white">Plan</a>
          </div>
          <Link href="/auth" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-indigo-400/60 hover:bg-indigo-500/10">
            Sign in
          </Link>
        </nav>

        <div className="grid items-center gap-12 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-4 py-2 text-sm font-semibold text-indigo-200">
              <Sparkles size={16} /> API monitoring with incident context
            </div>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.98] tracking-tight text-white md:text-7xl">
              Monitor APIs before they become user problems.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
              PulseGuard tracks uptime, latency, and failures in one clean command center. Add endpoints, watch live health, and react faster when something breaks.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/auth" className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-white shadow-2xl shadow-indigo-950/60 transition hover:-translate-y-0.5 hover:shadow-indigo-500/25">
                Get started <ArrowRight size={18} className="transition group-hover:translate-x-1" />
              </Link>
              <Link href="/dashboard?demo=1" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.07]">
                View demo <Gauge size={18} />
              </Link>
            </div>
            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur">
                  <div className={`text-2xl font-black ${metric.tone}`}>{metric.value}</div>
                  <div className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-indigo-500/25 via-violet-500/10 to-cyan-500/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d1117]/90 p-5 shadow-2xl shadow-black/50 backdrop-blur-xl">
              <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Live health</p>
                  <h2 className="mt-1 text-xl font-black">Production API</h2>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300 ring-1 ring-emerald-400/20">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.8)]" /> Healthy
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {['Auth', 'Billing', 'Gateway'].map((name, index) => (
                  <div key={name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{name}</span>
                      <CheckCircle2 size={15} className="text-emerald-300" />
                    </div>
                    <div className="mt-4 text-2xl font-black">{[42, 68, 31][index]}ms</div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300" style={{ width: `${[72, 58, 86][index]}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-bold text-white">Incident automation</p>
                  <Zap size={17} className="text-amber-300" />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {timeline.map((step) => (
                    <div key={step} className="rounded-xl bg-white/[0.04] px-3 py-3 text-center text-xs font-bold text-slate-300 ring-1 ring-white/10">
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <section id="features" className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="group rounded-3xl border border-white/10 bg-white/[0.035] p-6 transition hover:-translate-y-1 hover:border-indigo-400/40 hover:bg-white/[0.055]">
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-indigo-400/10 text-indigo-300 ring-1 ring-indigo-300/20 transition group-hover:scale-105">
                {feature.icon}
              </div>
              <h3 className="text-lg font-black text-white">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{feature.text}</p>
            </article>
          ))}
        </section>

        <section id="workflow" className="mt-16 grid gap-6 rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 md:grid-cols-[0.85fr_1.15fr] md:p-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-indigo-300">Operations flow</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">From outage signal to action in seconds.</h2>
            <p className="mt-4 text-slate-400">A lightweight workflow keeps the product useful even before backend analytics become deep.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {['Synthetic checks every minute', 'Latency budgets by endpoint', 'Status cards for every route', 'Recovery hints for incidents'].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm font-semibold text-slate-200">
                <Globe2 size={18} className="text-cyan-300" /> {item}
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="mt-16 overflow-hidden rounded-[2rem] border border-indigo-300/20 bg-gradient-to-br from-indigo-500/15 to-violet-500/10 p-8 text-center">
          <LockKeyhole className="mx-auto mb-4 text-indigo-200" />
          <h2 className="text-3xl font-black">Built for focused API teams.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-300">Start with endpoint health, then layer in teams, alert channels, and incident history as the product grows.</p>
        </section>
      </section>
    </main>
  );
}
