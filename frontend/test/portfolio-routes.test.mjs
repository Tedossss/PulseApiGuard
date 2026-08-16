import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const rootPage = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
const dreamPage = readFileSync(new URL('../app/dream/page.tsx', import.meta.url), 'utf8');
const dreamExperience = readFileSync(new URL('../app/dream/DreamEvidenceExperience.tsx', import.meta.url), 'utf8');
const sitemap = readFileSync(new URL('../app/sitemap.ts', import.meta.url), 'utf8');

test('the previous Sleep Observatory remains the root portfolio', () => {
  assert.match(rootPage, /PortfolioExperience/);
  assert.match(rootPage, /The Sleep Observatory/);
  assert.doesNotMatch(rootPage, /DreamWorld/);
});

test('the Impeccable Dream Evidence Atlas is served at /dream without redirecting', () => {
  assert.match(dreamPage, /DreamEvidenceExperience/);
  assert.match(dreamPage, /dream-evidence-atlas-overdrive-20260815/);
  assert.match(dreamPage, /https:\/\/falach\.pl\/dream/);
  assert.doesNotMatch(dreamPage, /redirect\s*\(/);
});

test('the Dream Evidence Atlas keeps 3D progressive and project evidence semantic', () => {
  assert.match(dreamExperience, /dynamic\(/);
  assert.match(dreamExperience, /DreamDepthField/);
  assert.match(dreamExperience, /aria-label={`\$\{project\.title\} engineering evidence`}/);
  assert.match(dreamExperience, /prefers-reduced-motion/);
  assert.match(dreamExperience, /data-project-scene/);
});

test('the sitemap exposes both portfolio versions', () => {
  assert.match(sitemap, /https:\/\/falach\.pl'/);
  assert.match(sitemap, /https:\/\/falach\.pl\/dream/);
  assert.match(sitemap, /https:\/\/falach\.pl\/PAG/);
  assert.match(sitemap, /https:\/\/falach\.pl\/colab/);
});

test('route-specific social images and the restored CV are versioned', () => {
  assert.ok(existsSync(new URL('../app/opengraph-image.tsx', import.meta.url)));
  assert.ok(existsSync(new URL('../app/dream/opengraph-image.tsx', import.meta.url)));
  assert.ok(existsSync(new URL('../public/assets/nazar-falach-cv.pdf', import.meta.url)));
});
