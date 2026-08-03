import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  BellRing,
  Check,
  ChevronRight,
  Clock3,
  Code2,
  Gauge,
  Globe2,
  LockKeyhole,
  Radio,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Zap,
} from 'lucide-react';

const endpoints = [
  { name: 'Core API', path: '/v1/health', latency: '42ms', status: 'Operational', tone: 'emerald' },
  { name: 'Payments', path: '/billing/status', latency: '68ms', status: 'Operational', tone: 'emerald' },
  { name: 'Webhooks', path: '/events/ping', latency: '—', status: 'Investigating', tone: 'amber' },
] as const;

const capabilities = [
  {
    icon: Radio,
    eyebrow: 'Live signals',
    title: 'Know what changed, not just what failed.',
    text: 'See current health, latency, expected status, and the exact moment an endpoint moved into an incident state.',
    tone: 'indigo',
  },
  {
    icon: ShieldCheck,
    eyebrow: 'Safer checks',
    title: 'Monitor public targets without opening your network.',
    text: 'Strict URL validation, private-address blocking, redirect controls, and ownership checks protect every probe.',
    tone: 'cyan',
  },
  {
    icon: Clock3,
    eyebrow: 'Useful history',
    title: 'Turn individual checks into operational context.',
    text: 'Follow uptime and latency trends, inspect recent responses, and confirm recovery from the same workspace.',
    tone: 'violet',
  },
] as const;

const workflow = [
  { number: '01', label: 'Configure', text: 'Add a public endpoint and its expected response.' },
  { number: '02', label: 'Probe', text: 'Queue-backed workers run isolated checks on schedule.' },
  { number: '03', label: 'Confirm', text: 'Three consecutive failures establish a real incident.' },
  { number: '04', label: 'Recover', text: 'The next successful check closes the incident loop.' },
] as const;

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#070910] text-white selection:bg-indigo-400/30">
      <section className="relative border-b border-white/[0.07]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_92%)]"
        />
        <div aria-hidden="true" className="pointer-events-none absolute -left-40 -top-48 h-[34rem] w-[34rem] rounded-full bg-indigo-600/20 blur-[130px]" />
        <div aria-hidden="true" className="pointer-events-none absolute right-[-10rem] top-20 h-[28rem] w-[28rem] rounded-full bg-cyan-500/10 blur-[120px]" />

        <nav aria-label="Primary navigation" className="relative mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3 font-black tracking-tight">
            <span className="relative grid h-10 w-10 place-items-center rounded-xl border border-indigo-300/20 bg-indigo-500/10 text-indigo-200">
              <Activity aria-hidden="true" size={21} className="stroke-[2.7px]" />
              <span aria-hidden="true" className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#070910] bg-emerald-400" />
            </span>
            <span className="text-lg">PulseGuard</span>
          </Link>

          <div className="hidden items-center gap-8 text-sm font-medium text-slate-400 md:flex">
            <a href="#platform" className="transition hover:text-white">Platform</a>
            <a href="#workflow" className="transition hover:text-white">How it works</a>
            <a href="#security" className="transition hover:text-white">Security</a>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/auth" className="hidden rounded-xl px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-white/5 hover:text-white sm:block">
              Sign in
            </Link>
            <Link href="/auth" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-indigo-100">
              Start monitoring
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
        </nav>

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-16 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:pb-28 lg:pt-24">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-slate-300 shadow-xl shadow-black/20 backdrop-blur">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                <Zap aria-hidden="true" size={12} />
              </span>
              Monitoring infrastructure for API teams
            </div>

            <h1 className="max-w-3xl text-[clamp(3.25rem,7vw,6.75rem)] font-black leading-[0.88] tracking-[-0.065em] text-white">
              Monitor APIs before they become{' '}
              <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
                user problems.
              </span>
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-400 md:text-xl">
              PulseGuard gives your team one calm place to watch uptime, latency, and incident transitions—without drowning the signal in noise.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/auth" className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-6 py-4 text-sm font-black text-white shadow-2xl shadow-indigo-950/60 transition hover:-translate-y-0.5 hover:bg-indigo-400">
                Create your first monitor
                <ArrowRight aria-hidden="true" size={18} className="transition group-hover:translate-x-1" />
              </Link>
              <Link href="/dashboard?demo=1" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07]">
                <Gauge aria-hidden="true" size={18} />
                Explore live demo
              </Link>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-slate-500" aria-label="Platform highlights">
              {['30-second checks', 'Three-failure confirmation', '30-day history'].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check aria-hidden="true" size={14} className="text-emerald-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <CommandCenterPreview />
        </div>
      </section>

      <section id="platform" className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
        <div className="grid gap-8 border-b border-white/[0.08] pb-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.26em] text-indigo-300">Built for response</p>
            <h2 className="mt-4 max-w-xl text-4xl font-black tracking-[-0.045em] text-white md:text-5xl">
              The important signal, already in focus.
            </h2>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-slate-400 lg:justify-self-end">
            Monitoring should shorten the distance between “something feels wrong” and “we know what changed.” PulseGuard keeps that path direct.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {capabilities.map((capability) => (
            <CapabilityCard key={capability.title} {...capability} />
          ))}
        </div>
      </section>

      <section id="workflow" className="border-y border-white/[0.07] bg-white/[0.018]">
        <div className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.26em] text-cyan-300">Incident logic</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.045em] md:text-5xl">From probe to recovery.</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-400">
              A deliberate state machine reduces alert noise while keeping every check available for investigation.
            </p>
          </div>

          <ol className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-2 xl:grid-cols-4">
            {workflow.map((step, index) => (
              <li key={step.number} className="relative bg-[#0b0e17] p-7">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-300">{step.number}</span>
                  {index < workflow.length - 1 && <ChevronRight aria-hidden="true" size={16} className="hidden text-slate-700 xl:block" />}
                </div>
                <h3 className="mt-12 text-lg font-black text-white">{step.label}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="security" className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
        <div className="relative overflow-hidden rounded-[2rem] border border-indigo-300/15 bg-[#0d111b] p-7 md:p-12">
          <div aria-hidden="true" className="absolute right-[-8rem] top-[-10rem] h-80 w-80 rounded-full bg-indigo-500/20 blur-[100px]" />
          <div className="relative grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-300/20 bg-indigo-400/10 text-indigo-200">
                <LockKeyhole aria-hidden="true" size={22} />
              </span>
              <h2 className="mt-6 max-w-2xl text-4xl font-black tracking-[-0.045em] md:text-5xl">
                Designed to watch your APIs—not expose your network.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400">
                Public-target validation, private-address blocking, redirect protection, HttpOnly sessions, and per-user ownership checks are built into the monitoring path.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: Globe2, label: 'Public HTTP targets only' },
                { icon: ShieldCheck, label: 'Private ranges rejected' },
                { icon: LockKeyhole, label: 'HttpOnly sessions' },
                { icon: Code2, label: 'GET and HEAD allowlist' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex min-h-28 flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                  <Icon aria-hidden="true" size={19} className="text-cyan-300" />
                  <span className="mt-5 text-sm font-bold text-slate-200">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center rounded-[2rem] border border-white/10 bg-[linear-gradient(120deg,rgba(79,70,229,0.22),rgba(8,145,178,0.12))] px-6 py-16 text-center">
          <Sparkles aria-hidden="true" className="text-indigo-200" size={24} />
          <h2 className="mt-5 max-w-3xl text-4xl font-black tracking-[-0.045em] md:text-5xl">Your next incident should not be a surprise.</h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">Set up a monitor in minutes and give your team a clearer view of API health.</p>
          <Link href="/auth" className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-indigo-100">
            Start with PulseGuard
            <ArrowRight aria-hidden="true" size={18} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/[0.07] px-5 py-7 text-sm text-slate-400 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 font-bold text-slate-400">
            <Activity aria-hidden="true" size={16} /> PulseGuard
          </div>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold">
            <a href="#platform" className="transition hover:text-white">Platform</a>
            <a href="#workflow" className="transition hover:text-white">How it works</a>
            <a href="#security" className="transition hover:text-white">Security</a>
          </nav>
          <p className="text-xs">Clear signals for healthier APIs.</p>
        </div>
      </footer>
    </main>
  );
}

function CommandCenterPreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl lg:ml-auto">
      <div aria-hidden="true" className="absolute -inset-5 rounded-[2.4rem] bg-gradient-to-br from-indigo-500/20 via-transparent to-cyan-400/15 blur-2xl" />
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0b0e17]/95 shadow-[0_35px_100px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
            </div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Live workspace</span>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] px-2.5 py-1 text-[10px] font-bold text-emerald-300">
            <span aria-hidden="true" className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 motion-reduce:animate-none" />
            Checking now
          </span>
        </div>

        <div className="grid gap-px bg-white/[0.07] sm:grid-cols-[1fr_0.38fr]">
          <div className="bg-[#0b0e17] p-5">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500">API health</p>
                <p className="mt-1 text-3xl font-black tracking-tight">99.97%</p>
              </div>
              <span className="text-xs font-bold text-emerald-300">+0.04%</span>
            </div>
            <div className="flex h-28 items-end gap-1" role="img" aria-label="Illustrative uptime chart: 99.97 percent uptime with one current incident.">
              {[44, 58, 52, 70, 63, 78, 74, 88, 82, 95, 67, 91, 86, 98, 92, 96, 89, 100].map((height, index) => (
                <span
                  key={`${height}-${index}`}
                  aria-hidden="true"
                  className={`flex-1 rounded-sm ${index === 10 ? 'bg-amber-400/70' : 'bg-gradient-to-t from-indigo-500/35 to-indigo-300'}`}
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            <div className="mt-3 flex justify-between font-mono text-[9px] uppercase tracking-wider text-slate-500">
              <span>09:00</span><span>Now</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px bg-white/[0.07] sm:grid-cols-1">
            <PreviewMetric icon={Activity} label="Healthy" value="2" tone="text-emerald-300" />
            <PreviewMetric icon={TriangleAlert} label="Incident" value="1" tone="text-amber-300" />
          </div>
        </div>

        <div className="border-t border-white/[0.08] p-3">
          <ul className="space-y-1" aria-label="Endpoint status preview">
            {endpoints.map((endpoint) => (
              <li key={endpoint.name} className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-xl px-3 py-3 transition hover:bg-white/[0.035] sm:grid-cols-[1fr_auto_auto]">
                <div className="flex min-w-0 items-center gap-3">
                  <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${endpoint.tone === 'emerald' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.55)]' : 'bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.45)]'}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white">{endpoint.name}</p>
                    <p className="truncate font-mono text-[10px] text-slate-400">{endpoint.path}</p>
                  </div>
                </div>
                <span className="hidden font-mono text-[10px] text-slate-500 sm:block">{endpoint.latency}</span>
                <span className={`rounded-md px-2 py-1 text-[9px] font-black uppercase tracking-wider ${endpoint.tone === 'emerald' ? 'bg-emerald-400/[0.08] text-emerald-300' : 'bg-amber-400/[0.08] text-amber-200'}`}>
                  {endpoint.status}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-3 border-t border-white/[0.08] bg-white/[0.018] px-5 py-4">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-400/10 text-amber-300">
            <BellRing aria-hidden="true" size={15} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-white">Webhook Relay entered investigation</p>
            <p className="mt-0.5 text-[10px] text-slate-400">3 failed checks · expected HTTP 200</p>
          </div>
          <span className="font-mono text-[9px] text-slate-500">12s ago</span>
        </div>
      </div>
    </div>
  );
}

function PreviewMetric({ icon: Icon, label, value, tone }: { icon: typeof Activity; label: string; value: string; tone: string }) {
  return (
    <div className="flex flex-col justify-between bg-[#0b0e17] p-4">
      <Icon aria-hidden="true" size={15} className={tone} />
      <div className="mt-8">
        <p className={`text-2xl font-black ${tone}`}>{value}</p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function CapabilityCard({
  icon: Icon,
  eyebrow,
  title,
  text,
  tone,
}: (typeof capabilities)[number]) {
  const tones = {
    indigo: 'bg-indigo-400/10 text-indigo-300 border-indigo-300/15',
    cyan: 'bg-cyan-400/10 text-cyan-300 border-cyan-300/15',
    violet: 'bg-violet-400/10 text-violet-300 border-violet-300/15',
  } as const;

  return (
    <article className="group flex min-h-[25rem] flex-col rounded-[1.75rem] border border-white/[0.08] bg-white/[0.025] p-6 transition duration-300 hover:-translate-y-1 hover:border-white/[0.16] hover:bg-white/[0.04]">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${tones[tone]}`}>
        <Icon aria-hidden="true" size={21} />
      </div>
      <div className="mt-auto pt-16">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">{eyebrow}</p>
        <h3 className="mt-4 text-2xl font-black leading-tight tracking-[-0.025em] text-white">{title}</h3>
        <p className="mt-4 text-sm leading-6 text-slate-400">{text}</p>
      </div>
    </article>
  );
}
