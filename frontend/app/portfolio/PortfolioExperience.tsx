import type { CSSProperties } from 'react';
import { ArrowDown, ArrowUpRight, Download, Github, Radio, Send } from 'lucide-react';
import { ObservatoryChrome } from './ObservatoryChrome';
import { ObservatoryMotion } from './ObservatoryMotion';
import { ObservatoryWorld } from './ObservatoryWorld';
import { portfolioProjects } from './projects';
import styles from './PortfolioExperience.module.css';

const contactLinks = [
  { label: 'GitHub', href: 'https://github.com/Tedossss', icon: Github, download: false },
  { label: 'Telegram', href: 'https://t.me/tedosss', icon: Send, download: false },
  { label: 'Field notes / CV', href: '/assets/nazar-falach-cv.pdf', icon: Download, download: true },
] as const;

const instrumentBands = [
  { number: 'A', title: 'FRAME', detail: 'Product logic · systems design' },
  { number: 'B', title: 'TRANSMIT', detail: 'TypeScript · React · Next.js' },
  { number: 'C', title: 'PROCESS', detail: 'Node.js · PostgreSQL · Redis' },
  { number: 'D', title: 'SUSTAIN', detail: 'Docker · Nginx · observability' },
  { number: 'E', title: 'ADAPT', detail: 'Python · local AI · LoRA' },
] as const;

function ArchiveRecord({ index }: { index: number }) {
  const project = portfolioProjects[index];
  return (
    <article
      className={styles.archiveRecord}
      data-project-record={index}
      style={{ '--record-index': index } as CSSProperties}
      aria-labelledby={`record-${project.slug}`}
    >
      <div className={styles.recordRegistration} aria-hidden="true">
        <span>OBS / {project.number}</span><i /><span>RECORDED 2026</span>
      </div>
      <header>
        <p>{project.eyebrow}</p>
        <h3 id={`record-${project.slug}`}>{project.title}</h3>
      </header>
      <div className={styles.recordBody}>
        <p className={styles.recordStatement}>{project.statement}</p>
        <p className={styles.recordDescription}>{project.description}</p>
        <ul>{project.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul>
        <a href={project.href} data-inspect>
          <span>{project.action}</span><ArrowUpRight aria-hidden="true" />
        </a>
      </div>
      <div className={styles.recordStamp} aria-hidden="true"><span>F / {project.number}</span><strong>STABLE<br />ANOMALY</strong></div>
    </article>
  );
}

export function PortfolioExperience() {
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Nazar Falach',
    url: 'https://falach.pl',
    jobTitle: 'Full-Stack Engineer',
    sameAs: ['https://github.com/Tedossss', 'https://t.me/tedosss'],
  };

  return (
    <main className={styles.observatory} data-observatory-root data-active-project="0" id="top">
      <span
        hidden
        data-design-contract="94c6a94c"
        dangerouslySetInnerHTML={{ __html: '<!-- THESIS: A portfolio grows as a lucid vivarium; it refuses the gray nocturnal observatory. OWN-WORLD: turquoise water, coral sky, chartreuse foliage, lemon ceramic architecture, cobalt instruments, wet and translucent materials. STORY: visitors follow one living causeway, identify Nazar and inspect real systems, then transmit a message. FIRST VIEWPORT: a central aqua path cuts through giant leaves toward a small dome; the two-line title anchors the left, identity sits below, and the enter action rides the path edge. FORM: chromatic greenhouse transit, grounded direction 7, seed 94c6a94c. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md -->' }}
      />
      <a className={styles.skipLink} href="#work">Skip directly to the archive</a>
      <ObservatoryMotion />
      <ObservatoryWorld />
      <ObservatoryChrome />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />

      <div className={styles.atmosphere} aria-hidden="true"><i /><i /></div>
      <div className={styles.pageProgress} aria-hidden="true"><i /></div>

      <section className={styles.causeway} data-observatory-act="causeway" aria-labelledby="arrival-title">
        <div className={styles.actSticky}>
          <div className={styles.arrivalReadout} aria-hidden="true">
            <span>52.2297° N</span><span>21.0122° E</span><span>CLIMATE / IMPOSSIBLE</span>
          </div>
          <div className={styles.arrivalSignal}><Radio aria-hidden="true" /><span>THE VIVARIUM IS AWAKE</span></div>
          <h1 id="arrival-title" aria-label="Nazar Falach — full-stack engineer">
            <span>A URL LEFT</span>
            <span>A DOOR OPEN.</span>
          </h1>
          <div className={styles.identityPlate}>
            <p>OBSERVATORY OPERATOR</p>
            <strong>NAZAR FALACH</strong>
            <span>FULL-STACK ENGINEER / WARSAW</span>
          </div>
          <p className={styles.arrivalNote}>The water remembers the route.<br />Scroll forward. Let it grow.</p>
          <a className={styles.enterPrompt} href="#about" aria-label="Enter the vivarium"><span>Enter the vivarium</span><ArrowDown aria-hidden="true" /></a>
          <span className={styles.roomMark}>LUCID CAUSEWAY / 00</span>
        </div>
      </section>

      <section className={styles.ticketHall} id="about" data-observatory-act="hall" aria-labelledby="hall-title">
        <span className={styles.anchorAlias} id="principle" aria-hidden="true" />
        <div className={styles.actSticky}>
          <div className={styles.hallBoard} aria-hidden="true">
            <p><span>OPERATOR</span><strong>NAZAR FALACH</strong><em>ON SITE</em></p>
            <p><span>FUNCTION</span><strong>SYSTEMS → INTERFACES</strong><em>ACTIVE</em></p>
            <p><span>ORIGIN</span><strong>WARSAW / EUROPE</strong><em>52° N</em></p>
            <p><span>NEXT DEPARTURE</span><strong>ARCHIVE CORRIDOR</strong><em>02:17</em></p>
          </div>
          <div className={styles.hallCopy}>
            <p className={styles.kicker}>TICKET HALL / OPERATOR RECORD</p>
            <h2 id="hall-title">He works where invisible logic becomes a visible decision.</h2>
            <div>
              <p>Product framing, backend systems, infrastructure and expressive frontend work—built as one signal path.</p>
              <p>The portfolio was not placed in this garden. The garden grows from the logic inside the work.</p>
            </div>
          </div>
          <div className={styles.hallTicket} aria-hidden="true"><span>ADMIT ONE</span><strong>F / 2026</strong><i /></div>
          <span className={styles.roomMark}>TICKET HALL / 01</span>
        </div>
      </section>

      <section className={styles.archive} id="work" data-observatory-act="archive" aria-labelledby="archive-title">
        <div className={styles.actSticky}>
          <header className={styles.archiveHeader}>
            <p>ARCHIVE CORRIDOR / RESTRICTED RECORDS</p>
            <h2 id="archive-title">Recorded anomalies</h2>
            <div aria-hidden="true"><span data-record-counter>01</span><i /><span>04</span></div>
          </header>
          <div className={styles.archiveRecords}>
            {portfolioProjects.map((project, index) => <ArchiveRecord index={index} key={project.slug} />)}
          </div>
          <ol className={styles.archiveIndex} aria-label="Archive position">
            {portfolioProjects.map((project, index) => <li key={project.slug}><span>0{index + 1}</span><i /><em>{project.title}</em></li>)}
          </ol>
          <p className={styles.archiveInstruction}>SCROLL / CAMERA DOLLY <span>DO NOT TOUCH THE GLASS</span></p>
          <span className={styles.roomMark}>ARCHIVE / 02</span>
        </div>
      </section>

      <section className={styles.calibration} id="practice" data-observatory-act="calibration" aria-labelledby="calibration-title">
        <div className={styles.actSticky}>
          <div className={styles.calibrationCopy}>
            <p className={styles.kicker}>DOME INSTRUMENT / CALIBRATION LOG</p>
            <h2 id="calibration-title">One operator.<br />The whole signal.</h2>
            <p>I frame the constraint, model the system, build the interface and stay with the live signal.</p>
          </div>
          <div className={styles.instrument} aria-label="Technical capabilities">
            <div className={styles.instrumentCore} aria-hidden="true"><i /><i /><span>CAL / 03</span></div>
            <ol>
              {instrumentBands.map((band) => (
                <li key={band.number}>
                  <span>{band.number}</span><strong>{band.title}</strong><i /><em>{band.detail}</em>
                </li>
              ))}
            </ol>
          </div>
          <p className={styles.calibrationNote}>Every instrument points at the same problem from a different angle.</p>
          <span className={styles.roomMark}>CALIBRATION / 03</span>
        </div>
      </section>

      <section className={styles.roofline} id="contact" data-observatory-act="roofline" aria-labelledby="roofline-title">
        <div className={styles.actSticky}>
          <div className={styles.roofMeta}><p>PRE-DAWN / OPEN CHANNEL</p><span>VISIBILITY 42 KM</span></div>
          <div className={styles.roofCopy}>
            <p className={styles.kicker}>THE ONLY OUTGOING LINE</p>
            <h2 id="roofline-title">Send a signal.<br />Wait for the light.</h2>
          </div>
          <a className={styles.signalConsole} href="mailto:nazarfalach51@gmail.com">
            <span className={styles.consoleLamp} aria-hidden="true" />
            <span><small>TRANSMISSION ADDRESS</small><strong>nazarfalach51<wbr />@gmail.com</strong></span>
            <ArrowUpRight aria-hidden="true" />
          </a>
          <div className={styles.roofLinks}>
            {contactLinks.map(({ label, href, icon: Icon, download }) => (
              <a key={label} href={href} {...(download ? { download: true } : { target: '_blank', rel: 'noreferrer' })}>
                <Icon aria-hidden="true" /><span>{label}</span><ArrowUpRight aria-hidden="true" />
              </a>
            ))}
          </div>
          <div className={styles.signalTower} aria-hidden="true"><i /><i /><i /><span>TX</span></div>
          <span className={styles.roomMark}>ROOFLINE / 04</span>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>THE LUCID VIVARIUM / FALACH.PL</span>
        <span>© 2026 NAZAR FALACH</span>
        <a href="#top">RETURN TO CAUSEWAY ↑</a>
      </footer>
    </main>
  );
}
