import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { join } from 'node:path';

import { dreamProjects } from '../app/dreamworld/dreamData.ts';

const expectedProjects = [
  'pulseguard',
  'colab',
  'foundation',
  'prime-leather',
  'bookshelf',
  'local-ai-lab',
];

const expectedAssets = [
  'meadow-house.webp',
  'cloud-transit.webp',
  'endless-market.webp',
  'repair-waiting.webp',
  'pastel-library.webp',
  'computer-garden.webp',
  'about-room.webp',
  'stairway-exit.webp',
];

test('dream portfolio exposes every verified project exactly once', () => {
  assert.deepEqual(dreamProjects.map((project) => project.slug), expectedProjects);
  assert.equal(dreamProjects.filter((project) => project.featured).length, 4);

  for (const project of dreamProjects) {
    assert.ok(project.title.length > 1);
    assert.ok(project.description.length > 40);
    assert.ok(project.technologies.length >= 4);
    assert.ok(project.facts.length >= 4);
    assert.ok(project.details.length >= 3);
  }
});

test('published project links are usable and do not include known private repositories', () => {
  const links = dreamProjects.flatMap((project) => project.links.map((link) => link.href));

  assert.ok(links.includes('/PAG'));
  assert.ok(links.includes('/colab'));
  assert.ok(links.includes('https://primeleatherrepair.com'));
  assert.ok(links.includes('https://github.com/Tedossss/PulseApiGuard'));
  assert.ok(links.includes('https://github.com/Tedossss/LEATHERWORKS'));
  assert.ok(!links.includes('https://github.com/Tedossss/CoLab'));
  assert.ok(!links.includes('https://github.com/Tedossss/BookShelf'));
});

test('Local LLM copy does not claim an unverified training result', () => {
  const localAi = dreamProjects.find((project) => project.slug === 'local-ai-lab');
  assert.ok(localAi);

  const copy = JSON.stringify(localAi).toLowerCase();
  assert.match(copy, /prepared|prepares|pipeline/);
  assert.doesNotMatch(copy, /training completed|finished training|exported adapters|working local inference/);
});

test('all optimized dreamworld fallback assets exist', async () => {
  await Promise.all(
    expectedAssets.map((asset) => access(join(process.cwd(), 'public', 'assets', 'dreamworld', asset))),
  );
});
