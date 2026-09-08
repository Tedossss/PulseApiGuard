import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const rootPage = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
const dreamPage = readFileSync(new URL('../app/dream/page.tsx', import.meta.url), 'utf8');
const sitemap = readFileSync(new URL('../app/sitemap.ts', import.meta.url), 'utf8');

test('the Remembered Street is served as the root portfolio', () => {
  assert.match(rootPage, /DreamWorld/);
  assert.match(rootPage, /The Remembered Street/);
  assert.doesNotMatch(rootPage, /PortfolioExperience/);
  assert.doesNotMatch(rootPage, /Observatory|Vivarium/i);
});

test('the new bright dream world is served at /dream without redirecting', () => {
  assert.match(dreamPage, /DreamWorld/);
  assert.match(dreamPage, /https:\/\/falach\.pl\/dream/);
  assert.doesNotMatch(dreamPage, /redirect\s*\(/);
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
