export type DreamProject = {
  slug: string;
  title: string;
  label: string;
  year: string;
  role: string;
  scene: string;
  transition: 'door' | 'bus' | 'directory' | 'tag' | 'shutter' | 'page';
  summary: string;
  description: string;
  technologies: readonly string[];
  facts: readonly string[];
  details: readonly { label: string; value: string }[];
  links: readonly { label: string; href: string; external?: boolean }[];
  objectLabel: string;
  teaser: string;
  microcopy: string;
  featured: boolean;
};

export const dreamProjects: readonly DreamProject[] = [
  {
    slug: 'pulseguard',
    title: 'PulseGuard',
    label: 'Flagship project',
    year: '2026',
    role: 'Full-stack engineer',
    scene: 'house',
    transition: 'door',
    summary: 'API monitoring built around trusted incident states instead of noisy checks.',
    description:
      'PulseGuard is a per-user monitoring platform with configurable HTTP checks, latency and uptime history, isolated workers, and confirmed UP/DOWN incident transitions.',
    technologies: ['Next.js', 'React', 'TypeScript', 'Express', 'MongoDB', 'Redis', 'BullMQ', 'Docker'],
    facts: ['30-second to 24-hour checks', 'DOWN after 3 failures', 'Telegram incident alerts', 'Cursor-paginated history'],
    details: [
      { label: 'What it does', value: 'Tracks owned endpoints, expected status codes, latency, and incident history.' },
      { label: 'Architecture', value: 'Next.js frontend and same-origin API proxy over an Express API, MongoDB, Redis, and BullMQ workers.' },
      { label: 'Engineering focus', value: 'Ownership-safe APIs, SSRF-conscious validation, bounded logs, and operational Docker deployment.' },
    ],
    links: [
      { label: 'Open live product', href: '/PAG' },
      { label: 'GitHub repository', href: 'https://github.com/Tedossss/PulseApiGuard', external: true },
    ],
    objectLabel: 'Side door',
    teaser: 'One house on the road never turns its porch light off.',
    microcopy: 'the alarm stayed useful',
    featured: true,
  },
  {
    slug: 'colab',
    title: 'CoLab',
    label: 'Flagship project',
    year: '2026',
    role: 'Full-stack engineer · team project',
    scene: 'bus',
    transition: 'bus',
    summary: 'A founder network where matching, trust, and conversation are all part of one product loop.',
    description:
      'CoLab helps founders and collaborators discover each other through explainable recommendations, mutual connections, accepted private threads, notifications, and moderation-aware account controls.',
    technologies: ['Next.js', 'React', 'TypeScript', 'Express', 'MongoDB', 'Server-Sent Events', 'Docker'],
    facts: ['Explainable matching', 'Accepted-connection chat', 'Realtime SSE updates', 'Recovery and moderation flows'],
    details: [
      { label: 'What it does', value: 'Turns discovery into collaboration with onboarding, filtering, saved actions, direct requests, and private conversations.' },
      { label: 'Architecture', value: 'Next.js frontend at /colab over a same-origin Express API with MongoDB and authenticated SSE.' },
      { label: 'Engineering focus', value: 'Session revocation, durable notifications, bounded realtime fan-out, and pair-scoped safety controls.' },
    ],
    links: [{ label: 'Open live product', href: '/colab' }],
    objectLabel: 'Stop cord',
    teaser: 'The bus keeps moving even when nobody is inside.',
    microcopy: 'someone left the route running',
    featured: true,
  },
  {
    slug: 'foundation',
    title: 'Foundation Platform',
    label: 'Flagship project',
    year: '2026',
    role: 'Backend / full-stack engineer',
    scene: 'market',
    transition: 'directory',
    summary: 'A content platform for structured public pages, publishing, and daily admin work.',
    description:
      'Foundation Platform combines a bilingual public website with operational admin flows for structured pages, news, partners, documents, uploads, and day-to-day publishing.',
    technologies: ['Next.js', 'React', 'Vite', 'Node.js', 'Prisma', 'PostgreSQL', 'Docker', 'Nginx'],
    facts: ['Ukrainian / English content', 'Draft and archive states', 'Five-role hierarchy', 'Media workflows'],
    details: [
      { label: 'What it does', value: 'Supports public pages, news, partner data, documents, uploads, and admin-side editing workflows in Ukrainian and English.' },
      { label: 'Architecture', value: 'Next.js public frontend, separate React/Vite admin, and a Node.js service using Prisma and PostgreSQL.' },
      { label: 'Engineering focus', value: 'Structured content, draft/archive states, role-aware operations, media handling, and throttled administrative access.' },
    ],
    links: [{ label: 'Ask about the case', href: '#contact' }],
    objectLabel: 'Checkout receipt',
    teaser: 'Every aisle contains the same announcement in a different language.',
    microcopy: 'the receipt is longer than the shop',
    featured: true,
  },
  {
    slug: 'prime-leather',
    title: 'Prime Leather Repair',
    label: 'Flagship project',
    year: '2026',
    role: 'Full-stack engineer · client / team project',
    scene: 'workshop',
    transition: 'tag',
    summary: 'A deployed client website and admin workflow for media-heavy service operations.',
    description:
      'Prime Leather Repair combines a public service site, customer-facing media presentation, and admin tooling for categories, contacts, uploads, and reviews backed by Supabase and an Express API.',
    technologies: ['React', 'Vite', 'Express', 'Supabase', 'Resend', 'Google Places'],
    facts: ['Before/after media', 'Admin upload flow', 'Reviews integration', 'Deployed client system'],
    details: [
      { label: 'What it does', value: 'Presents service work, handles media-rich portfolio updates, and supports daily admin operations.' },
      { label: 'Architecture', value: 'React/Vite frontend over an Express API with Supabase data and storage services.' },
      { label: 'Engineering focus', value: 'Client-side image optimization, video handling, guarded admin auth, and practical deployment documentation.' },
    ],
    links: [
      { label: 'Visit live site', href: 'https://primeleatherrepair.com', external: true },
      { label: 'GitHub repository', href: 'https://github.com/Tedossss/LEATHERWORKS', external: true },
    ],
    objectLabel: 'Repair tag',
    teaser: 'One storefront looks cleaner than the rest of the dream.',
    microcopy: 'the receipt was still warm',
    featured: true,
  },
  {
    slug: 'bookshelf',
    title: 'BookShelf',
    label: 'Secondary project',
    year: '2026',
    role: 'Frontend engineer',
    scene: 'library',
    transition: 'page',
    summary: 'A cinematic product presentation translating a physical-book idea into an authored digital story.',
    description:
      'BookShelf is a product-vision website for a digital home for physical book collections, built as a continuous narrative instead of a standard marketing page.',
    technologies: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
    facts: ['Continuous product narrative', 'Responsive motion system', 'Accessible reduced-motion path', 'Procedural visual components'],
    details: [
      { label: 'What it is', value: 'A product presentation site, not the application backend itself.' },
      { label: 'Approach', value: 'Uses one physical-to-digital story arc instead of isolated landing-page sections.' },
      { label: 'Engineering focus', value: 'Responsive choreography, tactile UI, and keeping the concept readable on every device size.' },
    ],
    links: [{ label: 'Discuss the presentation', href: '#contact' }],
    objectLabel: 'Open book',
    teaser: 'A single book keeps landing on the wrong desk.',
    microcopy: 'you already opened this one',
    featured: false,
  },
  {
    slug: 'local-ai-lab',
    title: 'Local LLM Fine-Tuning',
    label: 'Secondary project',
    year: '2026',
    role: 'Applied AI / engineering R&D',
    scene: 'classroom',
    transition: 'shutter',
    summary: 'A constrained-hardware fine-tuning pipeline prepared for repeatable local model experiments.',
    description:
      'This work prepares 11,590 chat-formatted examples and a hardware-aware SFT/LoRA configuration around a 1.1B-parameter model. It is presented as an engineering experiment, not as a completed training result.',
    technologies: ['Python', 'PyTorch', 'Transformers', 'TRL', 'PEFT / LoRA'],
    facts: ['11,590 prepared examples', 'TinyLlama 1.1B base', 'LoRA r=8 · alpha=16', 'CPU-oriented configuration'],
    details: [
      { label: 'What it prepares', value: 'Converts source text into supervised chat JSONL and configures a constrained-hardware LoRA workflow.' },
      { label: 'Method', value: 'Deterministic preprocessing, explicit training parameters, and hardware-aware experiment setup.' },
      { label: 'Current status', value: 'The data and pipeline are prepared; no final artifacts, benchmark result, or deployment is claimed.' },
    ],
    links: [{ label: 'Discuss the pipeline', href: '#contact' }],
    objectLabel: 'Computer screen',
    teaser: 'The classroom is ready, but nobody pressed Run.',
    microcopy: 'the cursor is still blinking',
    featured: false,
  },
] as const;

export const dreamSkills = [
  'Node.js',
  'Express',
  'React',
  'Next.js',
  'TypeScript',
  'MongoDB',
  'PostgreSQL / SQL',
  'Prisma',
  'Mongoose',
  'Redis',
  'BullMQ',
  'Docker',
  'Nginx',
  'Supabase',
  'Server-Sent Events',
  'Python',
  'PyTorch',
  'Transformers',
  'TRL',
  'PEFT / LoRA',
] as const;

export const dreamSections = [
  { id: 'home', label: 'Home' },
  { id: 'places', label: 'Places' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
] as const;

export const dreamSceneCopy = {
  loader: {
    top: 'PLEASE WAIT',
    bottom: 'THE WEATHER IS ALMOST READY',
    done: 'FOUND.',
  },
  hero: {
    firstTitle: 'You took the long way.',
    returnTitle: 'You came back.',
    subtitle: 'Nazar Falach · Full-stack engineer · Poland',
    body: 'A few production systems, one or two stranger ideas, and a road that keeps leading back here.',
  },
  about: {
    kicker: 'A quiet room',
    title: 'Nazar Falach',
    subtitle: 'Full-stack engineer based in Poland',
    body:
      'I build products, APIs, admin systems, media workflows, and applied AI tooling. The work usually starts with architecture and ends with something people can actually operate.',
    note: 'Apparently this is one of them.',
  },
  contact: {
    title: 'You can leave now.',
    body: 'If one of these places feels useful, write to me.',
    exit: 'Exit',
  },
} as const;
