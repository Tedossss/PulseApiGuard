import Link from 'next/link';
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  Check,
  Clock3,
  Gauge,
  Globe2,
  Radio,
  ShieldCheck,
  Siren,
  Terminal,
  Zap,
} from 'lucide-react';
import { LandingMotionEffects } from './components/LandingMotionEffects';

const tickerItems = [
  '30 second checks',
  '3 failures before down',
  '30 day history',
  'private networks blocked',
];

const endpointRows = [
  { name: 'api-core', path: '/v1/health', code: '200', latency: '42ms', state: 'up' },
  { name: 'billing', path: '/payments/status', code: '200', latency: '68ms', state: 'up' },
  { name: 'webhooks', path: '/events/ping', code: '503', latency: '184ms', state: 'down' },
] as const;

const principles = [
  {
    number: '01',
    icon: Radio,
    title: 'Signal, not noise.',
    text: 'PulseGuard waits for three consecutive failures before declaring an incident. Fewer false alarms. More trust in every alert.',
    accent: 'lime',
  },
  {
    number: '02',
    icon: Clock3,
    title: 'Context, not guesswork.',
    text: 'Current state, response time, uptime trend, and check history live in one operational timeline.',
    accent: 'blue',
  },
  {
    number: '03',
    icon: ShieldCheck,
    title: 'Checks, without exposure.',
    text: 'Private ranges, redirects, embedded credentials, and unsafe methods are rejected before a probe leaves the worker.',
    accent: 'orange',
  },
] as const;

export default function LandingPage() {
  return (
    <main className="landing-v2 min-h-screen bg-[#f2f0e8] text-[#11110f] selection:bg-[#b7ff3c]">
      <LandingMotionEffects />
      <div className="overflow-hidden border-b-2 border-black bg-black py-2.5 text-[#b7ff3c]" aria-label="Platform highlights">
        <div className="landing-marquee flex w-max items-center whitespace-nowrap font-mono text-[10px] font-bold uppercase tracking-[0.22em] motion-reduce:translate-x-0">
          {[...tickerItems, ...tickerItems].map((item, index) => (
            <span key={`${item}-${index}`} className="flex items-center gap-6 px-6">
              {item}
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#b7ff3c]" />
            </span>
          ))}
        </div>
      </div>

      <nav aria-label="Primary navigation" className="mx-auto flex max-w-[1440px] items-center justify-between border-x-2 border-black px-4 py-4 sm:px-7">
        <Link href="/" className="flex items-center gap-3 font-black tracking-[-0.04em]">
          <span className="landing-brand-mark relative grid h-10 w-10 place-items-center border-2 border-black bg-[#b7ff3c] shadow-[3px_3px_0_#11110f]">
            <Activity aria-hidden="true" size={22} strokeWidth={2.8} />
          </span>
          <span className="text-lg">PULSEGUARD<span className="text-[#3155ff]">/</span></span>
        </Link>

        <div className="hidden items-center gap-8 text-xs font-bold uppercase tracking-[0.14em] md:flex">
          <a href="#why" className="landing-underline">Why PulseGuard</a>
          <a href="#system" className="landing-underline">The system</a>
          <Link href="/dashboard?demo=1" className="landing-underline">Live demo</Link>
        </div>

        <Link href="/auth" className="landing-button landing-button-small">
          Sign in <ArrowRight aria-hidden="true" size={15} />
        </Link>
      </nav>

      <section className="mx-auto grid max-w-[1440px] border-2 border-black lg:grid-cols-[1.08fr_0.92fr]">
        <div className="relative flex min-h-[680px] flex-col justify-between overflow-hidden border-b-2 border-black p-5 sm:p-9 lg:border-b-0 lg:border-r-2 lg:p-12">
          <div aria-hidden="true" className="landing-cross landing-cross-one" />
          <div aria-hidden="true" className="landing-cross landing-cross-two" />

          <div className="landing-reveal relative z-10 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em]">
            <span className="landing-live-dot" />
            Monitoring infrastructure for API teams
          </div>

          <div className="relative z-10 py-16">
            <p className="landing-kicker landing-reveal landing-delay-1 mb-5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#3155ff]">
              [ Know first. Fix faster. ]
            </p>
            <h1 className="landing-display landing-reveal landing-delay-2 max-w-5xl text-[clamp(4.5rem,10vw,9rem)] leading-[0.75] tracking-[-0.055em]">
              <span className="landing-headline-line">Monitor APIs</span>
              <span className="landing-headline-line landing-headline-line-2">before they become</span>
              <span className="relative inline-block italic">
                user problems.
                <span aria-hidden="true" className="landing-highlight absolute -bottom-2 left-0 h-3 w-full -rotate-1 bg-[#b7ff3c] mix-blend-multiply" />
              </span>
            </h1>
            <p className="landing-reveal landing-delay-3 mt-10 max-w-xl text-base font-medium leading-7 sm:text-lg">
              A focused command center for uptime, latency, and real incident transitions. Built to tell your team what changed—before your users do.
            </p>
          </div>

          <div className="landing-reveal landing-delay-4 relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link href="/auth" className="landing-button landing-button-primary">
              Start monitoring <ArrowDownRight aria-hidden="true" size={20} />
            </Link>
            <Link href="/dashboard?demo=1" className="landing-button landing-button-ghost">
              Open the demo <Gauge aria-hidden="true" size={18} />
            </Link>
          </div>
        </div>

        <MonitoringConsole />
      </section>

      <section id="why" className="mx-auto max-w-[1440px] border-x-2 border-b-2 border-black">
        <div className="landing-scroll-section grid border-b-2 border-black lg:grid-cols-[0.75fr_1.25fr]">
          <div className="border-b-2 border-black bg-[#3155ff] p-7 text-white sm:p-10 lg:border-b-0 lg:border-r-2 lg:p-12">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em]">Why PulseGuard</p>
            <ArrowDownRight aria-hidden="true" className="mt-12" size={42} strokeWidth={1.5} />
          </div>
          <div className="p-7 sm:p-10 lg:p-12">
            <h2 className="landing-display max-w-4xl text-5xl leading-[0.92] tracking-[-0.04em] sm:text-7xl">
              Monitoring should create clarity, not another wall of charts.
            </h2>
          </div>
        </div>

        <div className="grid md:grid-cols-3">
          {principles.map((principle, index) => (
            <PrincipleCard key={principle.number} {...principle} last={index === principles.length - 1} />
          ))}
        </div>
      </section>

      <section id="system" className="landing-scroll-section mx-auto grid max-w-[1440px] border-x-2 border-b-2 border-black bg-[#11110f] text-[#f2f0e8] lg:grid-cols-[0.9fr_1.1fr]">
        <div className="landing-system-intro border-b-2 border-[#f2f0e8]/30 p-7 sm:p-10 lg:border-b-0 lg:border-r-2 lg:p-12">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#b7ff3c]">The system</p>
            <Terminal aria-hidden="true" className="text-[#b7ff3c]" size={24} />
          </div>
          <h2 className="landing-display mt-16 text-6xl leading-[0.86] tracking-[-0.045em] sm:text-8xl">
            Four steps.
            <br />
            One clear
            <br />
            signal.
          </h2>
          <p className="mt-8 max-w-lg text-sm leading-6 text-[#f2f0e8]/65">
            Each check follows the same guarded path—from validated public target to stored operational history.
          </p>
        </div>

        <ol className="grid sm:grid-cols-2">
          {[
            { id: '01', icon: Globe2, title: 'Validate', text: 'Allowlisted methods and public targets only.' },
            { id: '02', icon: Zap, title: 'Probe', text: 'BullMQ workers check on your schedule.' },
            { id: '03', icon: Siren, title: 'Confirm', text: 'Three failures establish an incident.' },
            { id: '04', icon: Check, title: 'Recover', text: 'A healthy response closes the loop.' },
          ].map(({ id, icon: Icon, title, text }, index) => (
            <li key={id} className={`landing-system-step group min-h-72 p-7 transition hover:bg-[#b7ff3c] hover:text-black sm:p-9 ${index % 2 === 0 ? 'sm:border-r border-[#f2f0e8]/30' : ''} ${index < 2 ? 'border-b border-[#f2f0e8]/30' : ''}`}>
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="landing-step-number">{id}/04</span>
                <Icon aria-hidden="true" size={20} />
              </div>
              <div className="mt-28">
                <h3 className="text-xl font-black uppercase tracking-[-0.03em]">{title}</h3>
                <p className="mt-3 max-w-xs text-sm leading-6 opacity-65">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-cta landing-scroll-section mx-auto max-w-[1440px] overflow-hidden border-x-2 border-b-2 border-black bg-[#ff6b35] p-7 sm:p-12 lg:p-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em]">Your next incident is already loading.</p>
            <h2 className="landing-display mt-8 max-w-5xl text-[clamp(4rem,9vw,8rem)] leading-[0.78] tracking-[-0.05em]">
              Don&apos;t let users be your alert system.
            </h2>
          </div>
          <Link href="/auth" className="landing-button landing-button-primary shrink-0">
            Create a monitor <ArrowRight aria-hidden="true" size={20} />
          </Link>
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1440px] flex-col justify-between gap-5 border-x-2 border-b-2 border-black px-5 py-6 text-xs font-bold uppercase tracking-[0.14em] sm:flex-row sm:items-center sm:px-8">
        <span>PulseGuard © 2026</span>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-5">
          <a href="#why" className="landing-underline">Why</a>
          <a href="#system" className="landing-underline">System</a>
          <Link href="/dashboard?demo=1" className="landing-underline">Demo</Link>
        </nav>
        <span className="flex items-center gap-2"><span className="landing-live-dot" /> Systems observable</span>
      </footer>
    </main>
  );
}

function MonitoringConsole() {
  return (
    <div className="relative flex min-h-[680px] flex-col justify-between overflow-hidden bg-[#d9d5ca] p-5 sm:p-9 lg:p-12">
      <div aria-hidden="true" className="landing-orbit" />
      <div aria-hidden="true" className="landing-orbit-dot" />

      <div className="landing-reveal landing-delay-2 relative z-10 flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-[0.16em]">
        <span>Live environment / Production</span>
        <span className="flex items-center gap-2"><span className="landing-live-dot" /> Connected</span>
      </div>

      <div className="landing-console landing-reveal landing-delay-3 relative z-10 my-12 border-2 border-black bg-[#11110f] text-[#f2f0e8] shadow-[10px_10px_0_#3155ff]">
        <div className="flex items-center justify-between border-b border-white/20 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.15em]">
          <span className="flex items-center gap-2"><Terminal aria-hidden="true" size={14} /> pg://workspace/core</span>
          <span className="text-[#b7ff3c]">● live</span>
        </div>

        <div className="relative overflow-hidden border-b border-white/20 p-5 sm:p-7">
          <div aria-hidden="true" className="landing-scan-line" />
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">24h uptime</p>
              <p className="mt-2 text-5xl font-black tracking-[-0.06em] sm:text-6xl">99.97<span className="text-[#b7ff3c]">%</span></p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Median</p>
              <p className="mt-2 text-2xl font-bold">54ms</p>
            </div>
          </div>

          <div className="mt-8 flex h-20 items-end gap-1" role="img" aria-label="Illustrative uptime chart showing 99.97 percent uptime and one incident.">
            {[62, 72, 68, 83, 76, 91, 86, 100, 94, 97, 52, 73, 88, 92, 97, 90, 100, 96, 98, 100].map((height, index) => (
              <span key={`${height}-${index}`} aria-hidden="true" className={`landing-chart-bar flex-1 ${index === 10 ? 'bg-[#ff6b35]' : 'bg-[#b7ff3c]'}`} style={{ height: `${height}%`, animationDelay: `${index * 55}ms` }} />
            ))}
          </div>
        </div>

        <ul className="divide-y divide-white/15" aria-label="Illustrative endpoint states">
          {endpointRows.map((endpoint) => (
            <li key={endpoint.name} className="landing-console-row grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-4 sm:grid-cols-[1fr_auto_auto_auto] sm:px-6">
              <div className="min-w-0">
                <p className="font-mono text-xs font-bold">{endpoint.name}</p>
                <p className="mt-1 truncate font-mono text-[10px] text-white/40">{endpoint.path}</p>
              </div>
              <span className="hidden font-mono text-[10px] text-white/50 sm:block">{endpoint.latency}</span>
              <span className="hidden font-mono text-[10px] text-white/50 sm:block">HTTP {endpoint.code}</span>
              <span className={`border px-2 py-1 font-mono text-[9px] font-bold uppercase ${endpoint.state === 'up' ? 'border-[#b7ff3c] text-[#b7ff3c]' : 'border-[#ff6b35] text-[#ff6b35]'}`}>
                {endpoint.state}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="landing-reveal landing-delay-4 relative z-10 grid grid-cols-3 border-2 border-black bg-[#f2f0e8] text-center shadow-[6px_6px_0_#11110f]">
        <ConsoleMetric value="03" label="Endpoints" />
        <ConsoleMetric value="02" label="Healthy" border />
        <ConsoleMetric value="01" label="Incident" />
      </div>
    </div>
  );
}

function ConsoleMetric({ value, label, border = false }: { value: string; label: string; border?: boolean }) {
  return (
    <div className={`landing-console-metric p-3 sm:p-4 ${border ? 'border-x-2 border-black' : ''}`}>
      <p className="text-xl font-black tracking-[-0.04em] sm:text-2xl">{value}</p>
      <p className="mt-1 font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-black/50 sm:text-[9px]">{label}</p>
    </div>
  );
}

function PrincipleCard({
  number,
  icon: Icon,
  title,
  text,
  accent,
  last,
}: (typeof principles)[number] & { last: boolean }) {
  const accentClass = {
    lime: 'hover:bg-[#b7ff3c]',
    blue: 'hover:bg-[#3155ff] hover:text-white',
    orange: 'hover:bg-[#ff6b35]',
  }[accent];

  return (
    <article className={`landing-principle-card group flex min-h-[320px] flex-col p-7 transition sm:p-9 ${accentClass} ${last ? '' : 'border-b-2 md:border-b-0 md:border-r-2'} border-black`}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-bold">{number}/03</span>
        <span className="landing-principle-icon grid h-12 w-12 place-items-center border-2 border-current">
          <Icon aria-hidden="true" size={22} strokeWidth={1.8} />
        </span>
      </div>
      <div className="mt-14 h-px w-full bg-current opacity-25" />
      <div className="pt-8">
        <h3 className="landing-principle-title landing-display text-4xl leading-[0.9] tracking-[-0.04em] lg:text-5xl">{title}</h3>
        <p className="mt-5 max-w-sm text-sm font-medium leading-6 opacity-70">{text}</p>
      </div>
    </article>
  );
}
