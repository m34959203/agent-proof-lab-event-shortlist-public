import assert from 'node:assert/strict';
import {localOrigin} from './verify-model.mjs';

const origin = localOrigin(process.argv[2] || 'http://127.0.0.1:3000');
const brief = {locationId: 'austin-tx', date: '2026-10-17', eventType: 'Conference',
  category: 'Event host/MC', budgetUsdCents: 200000, language: 'English', hours: 4,
  style: 'Calm pacing and clear presentations, without party games.'};
const cases = [
  {id: 'oct17', input: brief, status: 200, count: 3},
  {id: 'oct18', input: {...brief, date: '2026-10-18'}, status: 200, count: 1},
  {id: 'exact-budget', input: {...brief, budgetUsdCents: 82500}, status: 200, count: 1},
  {id: 'one-cent-less', input: {...brief, budgetUsdCents: 82499}, status: 200, count: 0},
  {id: 'invalid-date', input: {...brief, date: '2026-10-32'}, status: 400},
  {id: 'fractional-cent', input: {...brief, budgetUsdCents: 82500.5}, status: 400},
  {id: 'unsupported-language', input: {...brief, language: 'Klingon'}, status: 400},
  {id: 'repeat-oct17', input: brief, status: 200, count: 3},
];
const checks = [];
try {
  const page = await fetch(origin, {signal: AbortSignal.timeout(10000), redirect: 'error'});
  assert.equal(page.status, 200, 'App home page did not load.');
  assert((await page.text()).includes('<html'), 'Expected an HTML page.');
  for (const c of cases) {
    const started = performance.now();
    const response = await fetch(origin + '/api/recommend', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(c.input), signal: AbortSignal.timeout(30000), redirect: 'error',
    });
    const data = await response.json();
    const result = {id: c.id, httpStatus: response.status, count: data.cards?.length,
      elapsedMs: Math.round(performance.now() - started), error: data.error};
    checks.push(result);
    assert.equal(response.status, c.status, `${c.id}: ${data.error || 'unexpected HTTP status'}`);
    if (c.count !== undefined) assert.equal(data.cards?.length, c.count, `${c.id}: unexpected card count`);
    result.passed = true;
  }
  console.log(JSON.stringify({passed: true, scope: 'HTTP home page and eight API examples, not browser interaction or complete acceptance', checks}, null, 2));
} catch (error) {
  console.error(JSON.stringify({passed: false, error: error.message, checks}, null, 2));
  process.exitCode = 1;
}
