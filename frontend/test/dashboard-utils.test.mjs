import test from 'node:test';
import assert from 'node:assert/strict';

import {
  filterLogs,
  filterMonitors,
  formatInterval,
  monitorIsUp,
  monitorStateLabel,
} from '../app/dashboard/dashboardUtils.ts';

test('monitor helpers format intervals and states consistently', () => {
  assert.equal(formatInterval(30), '30s');
  assert.equal(formatInterval(300), '5m');
  assert.equal(formatInterval(3600), '1h');
  assert.equal(formatInterval(), '1m');

  assert.equal(monitorIsUp({ _id: '1', name: 'API', url: 'https://example.com', status: 'UP' }), true);
  assert.equal(monitorIsUp({ _id: '2', name: 'API', url: 'https://example.com', status: 'DOWN' }), false);
  assert.equal(monitorIsUp({ _id: '3', name: 'API', url: 'https://example.com', lastStatus: 204 }), true);
  assert.equal(monitorStateLabel({ _id: '4', name: 'API', url: 'https://example.com' }), 'PENDING');
});

test('monitor and log search includes target metadata and response details', () => {
  const monitors = [
    { _id: '1', name: 'Billing API', url: 'https://billing.example.com', lastStatus: 200 },
    { _id: '2', name: 'Search API', url: 'https://search.example.com', lastStatus: 503 },
  ];
  assert.deepEqual(filterMonitors(monitors, 'billing'), [monitors[0]]);
  assert.deepEqual(filterMonitors(monitors, '503'), [monitors[1]]);

  const logs = [
    {
      _id: 'log-1',
      monitor: { _id: '1', name: 'Billing API', url: 'https://billing.example.com' },
      statusCode: 200,
      success: true,
      responseTime: 42,
      message: 'Expected status received',
      createdAt: '2026-07-29T09:25:00.000Z',
    },
    {
      _id: 'log-2',
      monitor: { _id: '2', name: 'Search API', url: 'https://search.example.com' },
      statusCode: 503,
      success: false,
      responseTime: 80,
      message: 'Service unavailable',
      createdAt: '2026-07-29T09:20:00.000Z',
    },
  ];
  assert.deepEqual(filterLogs(logs, 'unavailable'), [logs[1]]);
  assert.deepEqual(filterLogs(logs, '200'), [logs[0]]);
});
