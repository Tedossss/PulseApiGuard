import test from 'node:test';
import assert from 'node:assert/strict';

import { dreamProjects } from '../app/dreamworld/dreamData.ts';
import { getProjectDirectoryState } from '../app/dreamworld/dreamNavigation.ts';

test('project directory resolves the active project and its neighbours', () => {
  const state = getProjectDirectoryState(dreamProjects, 'colab');

  assert.equal(state.current.slug, 'colab');
  assert.equal(state.index, 1);
  assert.equal(state.total, 6);
  assert.equal(state.previous?.slug, 'pulseguard');
  assert.equal(state.next?.slug, 'foundation');
});

test('project directory does not invent wrap navigation at either edge', () => {
  const first = getProjectDirectoryState(dreamProjects, 'home');
  const last = getProjectDirectoryState(dreamProjects, 'contact');

  assert.equal(first.current.slug, 'pulseguard');
  assert.equal(first.previous, null);
  assert.equal(first.next?.slug, 'colab');

  assert.equal(last.current.slug, 'local-ai-lab');
  assert.equal(last.previous?.slug, 'bookshelf');
  assert.equal(last.next, null);
});
