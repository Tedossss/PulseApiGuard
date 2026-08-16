import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { PRODUCT_BASE_PATH, toProductApiPath } from '../lib/api.ts';
import sitemap from '../app/sitemap.ts';

const read = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8');
const exists = (relativePath) => existsSync(new URL(relativePath, import.meta.url));

test('Next mounts the complete product under the build-time /PAG base path', () => {
  const config = read('../next.config.ts');

  assert.equal(PRODUCT_BASE_PATH, '/PAG');
  assert.match(config, /basePath:\s*["']\/PAG["']/);
  assert.match(config, /source:\s*["']\/api\/:path\*["']/);
  assert.match(config, /destination:\s*`\$\{apiProxyTarget\}\/api\/:path\*`/);
  assert.doesNotMatch(config, /source:\s*["']\/PAG\/api/);
});

test('browser API requests stay inside the product mount', () => {
  assert.equal(toProductApiPath('/api/system/ready'), '/PAG/api/system/ready');
  assert.equal(
    toProductApiPath('/api/dashboard/logs?limit=25'),
    '/PAG/api/dashboard/logs?limit=25',
  );
  assert.throws(() => toProductApiPath('/dashboard'), /must start with \/api/);
  assert.throws(() => toProductApiPath('/PAG/api/system/live'), /must start with \/api/);

  const transport = read('../lib/api.ts');
  assert.match(transport, /fetch\(toProductApiPath\(path\)/);
});

test('App Router source routes expose only the PulseGuard product boundary', () => {
  assert.equal(exists('../app/page.tsx'), true);
  assert.equal(exists('../app/auth/page.tsx'), true);
  assert.equal(exists('../app/dashboard/page.tsx'), true);
  assert.equal(exists('../app/health/route.ts'), true);

  for (const removedPath of [
    '../app/PAG/page.tsx',
    '../app/dream/page.tsx',
    '../app/dreamworld/DreamWorld.tsx',
    '../app/portfolio/PortfolioExperience.tsx',
  ]) {
    assert.equal(exists(removedPath), false, `${removedPath} must stay outside PulseGuard`);
  }
});

test('product navigation relies on Next base-path handling and keeps falach.pl external', () => {
  const landing = read('../app/page.tsx');
  const auth = read('../app/auth/page.tsx');
  const dashboard = read('../app/dashboard/page.tsx');

  assert.match(landing, /<a[\s\S]*?href="https:\/\/falach\.pl\/"/);
  assert.doesNotMatch(landing, /<Link[^>]+href="https:\/\/falach\.pl\//);
  assert.match(landing, /<Link href="\/auth"/);
  assert.match(landing, /<Link href="\/dashboard\?demo=1"/);
  assert.match(auth, /router\.replace\('\/dashboard'\)/);
  assert.match(dashboard, /router\.replace\('\/auth'\)/);
  assert.match(dashboard, /router\.replace\('\/'\)/);

  for (const source of [landing, auth, dashboard]) {
    assert.doesNotMatch(source, /(?:href=|router\.replace\()['"]\/PAG\//);
  }
});

test('health, metadata, and sitemap describe the mounted product only', () => {
  const compose = read('../../docker-compose.yml');
  const layout = read('../app/layout.tsx');
  const page = read('../app/page.tsx');
  const openGraphImage = read('../app/opengraph-image.tsx');

  assert.match(compose, /http:\/\/127\.0\.0\.1:3000\/PAG\/health/);
  assert.deepEqual(sitemap().map(({ url }) => url), ['https://falach.pl/PAG']);
  assert.match(page, /canonical:\s*'https:\/\/falach\.pl\/PAG'/);

  for (const source of [layout, page, openGraphImage]) {
    assert.doesNotMatch(source, /Sleep Observatory|Dream Evidence|interactive portfolio/i);
  }
});

test('portfolio-only runtime dependencies remain outside the product manifest', () => {
  const manifest = JSON.parse(read('../package.json'));

  for (const dependency of ['gsap', 'lenis', 'three']) {
    assert.equal(manifest.dependencies?.[dependency], undefined);
  }
  assert.equal(manifest.devDependencies?.['@types/three'], undefined);
  assert.ok(manifest.dependencies?.recharts);
  assert.ok(manifest.devDependencies?.tailwindcss);
});
