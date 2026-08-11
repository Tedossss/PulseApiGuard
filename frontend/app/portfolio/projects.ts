export type PortfolioProject = {
  slug: string;
  number: string;
  eyebrow: string;
  title: string;
  statement: string;
  description: string;
  facts: readonly string[];
  href: string;
  action: string;
};

export const portfolioProjects: readonly PortfolioProject[] = [
  {
    slug: 'pulseguard',
    number: '01',
    eyebrow: 'OBSERVABILITY / LIVE',
    title: 'PulseGuard',
    statement: 'Know before silence becomes an incident.',
    description:
      'An API monitoring system built around guarded probes, isolated workers and incident states that people can trust.',
    facts: ['30-second checks', '3 failures before DOWN', 'BullMQ · Redis · Docker'],
    href: '/PAG',
    action: 'Open live product',
  },
  {
    slug: 'colab',
    number: '02',
    eyebrow: 'PEOPLE SYSTEM / LIVE',
    title: 'CoLab',
    statement: 'Turn a useful match into a real conversation.',
    description:
      'A founder network with explainable matching, mutual connections, verified accounts and private conversation threads.',
    facts: ['Explainable matching', 'Mutual connections', 'Private threads'],
    href: '/colab',
    action: 'Enter CoLab',
  },
  {
    slug: 'foundation',
    number: '03',
    eyebrow: 'CONTENT OPERATIONS / CASE',
    title: 'Foundation',
    statement: 'Structure editorial complexity without flattening it.',
    description:
      'A role-aware publishing system shaped around permissions, bilingual content and operational clarity at scale.',
    facts: ['RBAC', 'Bilingual publishing', 'Operational workflows'],
    href: '#contact',
    action: 'Ask about the case',
  },
  {
    slug: 'local-ai-lab',
    number: '04',
    eyebrow: 'MODEL WORK / LAB',
    title: 'Local AI Lab',
    statement: 'Make the experiment repeatable before making it impressive.',
    description:
      'Local model adaptation focused on data preparation, LoRA fine-tuning and inference that can be reproduced.',
    facts: ['11,590 examples', 'LoRA fine-tuning', 'Local inference'],
    href: '#contact',
    action: 'Talk through the lab',
  },
] as const;
