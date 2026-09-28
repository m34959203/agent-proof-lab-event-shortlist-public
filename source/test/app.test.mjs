import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog } from '../data/catalog.mjs';
import { validate, filterPool, recommend, config } from '../lib/recommend.mjs';
import { createEmbeddings, PROFILE, normalize, loopbackURL } from '../lib/embeddings.mjs';
import { dollarsToCents, validDate, displayDate, createRequestGate } from '../public/shared.mjs';
import { createServer } from '../server.mjs';
import { Readable } from 'node:stream';

const demo = {
  locationId: 'austin-tx', date: '2026-10-17', eventType: 'Conference',
  category: 'Event host/MC', budgetUsdCents: 200000, language: 'English', hours: 4,
  style: 'Calm pacing and clear presentations, without party games.',
};
const vector = (value = 1) => [value, ...Array(1023).fill(0)];
// Labelled deterministic transport fixture. These are NOT real model embeddings.
function fixture({ version = PROFILE.version, digest = PROFILE.digest, result, fail } = {}) {
  const calls = [];
  const transport = async (url, options) => {
    calls.push({ path: new URL(url).pathname, options });
    if (fail) throw new Error('Injected fixture outage');
    let body;
    if (url.endsWith('/api/version')) body = { version };
    else if (url.endsWith('/api/tags')) body = { models: [{ name: PROFILE.model, digest }] };
    else {
      const input = JSON.parse(options.body).input;
      body = result ? result(input) : { model: PROFILE.model, embeddings: input.map(() => vector()) };
    }
    return { ok: true, json: async () => body };
  };
  return { calls, adapter: createEmbeddings({ transport }) };
}

test('USD integer boundaries and explicit dollar conversion', () => {
  for (const value of [1, 100000000]) assert.equal(validate({ ...demo, budgetUsdCents: value }).budgetUsdCents, value);
  for (const value of [undefined, null, '200000', NaN, Infinity, -1, 0, 1.1, 100000001]) {
    assert.throws(() => validate({ ...demo, budgetUsdCents: value }));
  }
  assert.equal(dollarsToCents('1125.50'), 112550);
  assert.equal(dollarsToCents('0.01'), 1);
  assert.equal(dollarsToCents('1000000'), 100000000);
  for (const value of ['1.001', '1e3', '-1', '', 'Infinity', '1000000.01', '0', '$20']) {
    assert.throws(() => dollarsToCents(value));
  }
  assert.throws(() => validate({ ...demo, budget: 2000 }));
});

test('strict real dates, fixed window, and timezone-independent formatting', () => {
  for (const date of ['2026-02-29', '2026-11-31', '2026-10-1', '2026-10-17T00:00:00Z', null]) {
    assert.equal(validDate(date), false);
  }
  assert.equal(validDate('2028-02-29'), true);
  for (const date of ['2026-09-23', '2026-12-31']) assert.equal(validate({ ...demo, date }).date, date);
  for (const date of ['2026-09-22', '2027-01-01']) assert.throws(() => validate({ ...demo, date }));
  const old = process.env.TZ;
  try {
    for (const tz of ['Pacific/Honolulu', 'Asia/Tokyo', 'America/Chicago']) {
      process.env.TZ = tz;
      assert.equal(displayDate('2026-11-01'), 'Nov 1, 2026');
      assert.equal(displayDate('2026-10-17'), 'Oct 17, 2026');
    }
  } finally {
    if (old === undefined) delete process.env.TZ;
    else process.env.TZ = old;
  }
});

test('required and optional input validation including long text', () => {
  for (const key of ['locationId', 'date', 'eventType', 'category', 'budgetUsdCents']) {
    const input = { ...demo }; delete input[key]; assert.throws(() => validate(input));
  }
  for (const hours of [0, -1, 24.01, NaN, Infinity, '4', null]) {
    assert.throws(() => validate({ ...demo, hours }));
  }
  for (const hours of [0.01, 4.5, 24]) assert.equal(validate({ ...demo, hours }).hours, hours);
  for (const language of ['', 'French', null, 1]) assert.throws(() => validate({ ...demo, language }));
  for (const style of [null, {}, 'x'.repeat(4001)]) assert.throws(() => validate({ ...demo, style }));
  assert.equal(validate({ ...demo, style: 'x'.repeat(4000) }).style.length, 4000);
  const input = { ...demo }; delete input.hours; delete input.language; delete input.style;
  assert.equal(validate(input).style, '');
});

test('every hard rule applied before ranking; exact and one-cent price boundaries', async () => {
  const p = { ...catalog[0], busy_dates: [], priceFromUsdCents: 200000 };
  assert.equal(filterPool(demo, [p]).eligible.length, 1);
  assert.equal(filterPool({ ...demo, budgetUsdCents: 199999 }, [p]).exclusions[0].reasons[0].overBudgetUsdCents, 1);
  assert.equal(filterPool({ ...demo, budgetUsdCents: 200001 }, [p]).eligible.length, 1);
  for (const [patch, code] of [
    [{ busy_dates: [demo.date] }, 'busy'], [{ event_formats: ['Wedding'] }, 'eventType'],
    [{ languages: ['Spanish'] }, 'language'], [{ max_hours: 3.99 }, 'duration'],
  ]) {
    const f = fixture();
    const result = await recommend(demo, f.adapter, [{ ...p, ...patch }]);
    assert.equal(result.outcome, 'no-eligible');
    assert.equal(result.exclusions[0].reasons[0].code, code);
    assert.equal(f.calls.length, 0);
  }
  assert.equal(filterPool(demo, [{ ...p, locationId: 'chicago-il' }]).poolCount, 0);
  assert.equal(filterPool(demo, [{ ...p, categories: ['Florist'] }]).poolCount, 0);
  assert.equal(filterPool(demo, [{ ...p, max_hours: 4 }]).eligible.length, 1);
});

test('actual catalog people and venues obey their busy dates', () => {
  for (const category of ['Event host/MC', 'Event venue']) {
    const p = catalog.find(p => p.categories.includes(category));
    const brief = { ...demo, category, date: p.busy_dates[0], budgetUsdCents: 100000000 };
    const result = filterPool(brief);
    assert.ok(!result.eligible.some(x => x.id === p.id));
    assert.ok(result.exclusions.find(x => x.id === p.id).reasons.some(r => r.code === 'busy'));
  }
});

test('null attendance maximum is distinct from unlimited attendance', async () => {
  const p = { ...catalog.find(p => p.max_hours === null), busy_dates: [] };
  const result = await recommend({ ...demo, category: p.categories[0], hours: 24 }, fixture().adapter, [p]);
  assert.equal(result.cards.length, 1);
  assert.ok(result.cards[0].facts.some(x => x.includes('not based on on-site attendance')));
  assert.ok(!result.cards[0].facts.some(x => x.includes('fits that limit')));
  assert.ok(result.cards[0].questions.some(x => x.includes('delivery or setup')));
});

test('new dataset scenarios: dense, rare, fewer than three, no category and no eligible', async () => {
  assert.equal(catalog.length, 66);
  const run = brief => recommend(brief, fixture().adapter);
  const dense = await run(demo);
  assert.equal(dense.cards.length, 3);
  assert.deepEqual(dense.cards.map(p => p.id), ['us-v1-01-01', 'us-v1-01-04', 'us-v1-01-07']);
  const rare = await run({ ...demo, category: 'Event favors' });
  assert.ok(rare.cards.length > 0 && rare.cards.length < 3);
  const absent = await run({ ...demo, locationId: 'chicago-il', category: 'Florist' });
  assert.equal(absent.outcome, 'no-category');
  const none = await run({ ...demo, budgetUsdCents: 1 });
  assert.equal(none.outcome, 'no-eligible');
  assert.ok(none.exclusions.length > 0);
});

test('Oct 17 and Oct 18 change real eligible IDs and calendar exclusions', async () => {
  const a = filterPool(demo);
  const b = filterPool({ ...demo, date: '2026-10-18' });
  assert.notDeepEqual(a.eligible.map(p => p.id), b.eligible.map(p => p.id));
  for (const p of a.eligible.filter(p => !b.eligible.some(q => q.id === p.id))) {
    assert.ok(p.busy_dates.includes('2026-10-18'));
    assert.ok(b.exclusions.find(q => q.id === p.id).reasons.some(r => r.code === 'busy'));
  }
});

test('transport identity checks, CPU options, normalization, cold and warm exact-text cache', async () => {
  const f = fixture();
  const cold = await f.adapter.embed(['query', 'description', 'description']);
  assert.equal(cold.length, 3);
  assert.deepEqual(f.calls.map(c => c.path), ['/api/version', '/api/tags', '/api/embed', '/api/version', '/api/tags']);
  const body = JSON.parse(f.calls[2].options.body);
  assert.deepEqual(body.options, { num_gpu: 0, num_thread: 2 });
  assert.equal(body.truncate, false);
  assert.deepEqual(body.input, ['query', 'description']);
  assert.deepEqual(await f.adapter.embed(['query', 'description']), cold.slice(0, 2));
  assert.equal(f.calls.filter(c => c.path === '/api/embed').length, 1);
  await f.adapter.embed(['query ']);
  assert.equal(f.calls.filter(c => c.path === '/api/embed').length, 2);
  assert.equal(normalize(vector(5))[0], 1);
  assert.equal(normalize(vector(-5))[0], -1);
});

test('ranking passes only eligible descriptions, stable ID ties and truthful explanations', async () => {
  const f = fixture();
  const result = await recommend(demo, f.adapter);
  const repeated = await recommend(demo, f.adapter);
  assert.deepEqual(result, repeated);
  const sent = JSON.parse(f.calls.find(c => c.path === '/api/embed').options.body).input;
  const eligible = filterPool(demo).eligible;
  assert.deepEqual(new Set(sent.slice(1)), new Set(eligible.map(p => p.description)));
  const reversed = await recommend(demo, fixture().adapter, [...catalog].reverse());
  assert.deepEqual(result.cards.map(c => c.id), reversed.cards.map(c => c.id));
  for (const card of result.cards) {
    const source = catalog.find(p => p.id === card.id);
    assert.equal(card.description, source.description);
    assert.equal(card.headroomUsdCents, demo.budgetUsdCents - source.priceFromUsdCents);
    assert.ok(card.facts.some(x => x.includes('Not marked busy') && x.includes('confirm availability')));
    assert.ok(card.unknowns.some(x => x.includes(demo.style)));
    assert.ok(card.unknowns.some(x => x.includes('does not prove')));
    assert.ok(card.questions.some(x => x.includes(demo.style)));
    assert.ok(card.questions.some(x => x.includes('final USD quote')));
    assert.ok(!card.facts.some(x => x.includes('without party games')));
  }
});

test('identity mismatch, injected outage, malformed vectors and wrong counts fail explicitly', async () => {
  for (const options of [{ version: '0.33.0' }, { digest: 'wrong' }, { fail: true }]) {
    const f = fixture(options);
    await assert.rejects(f.adapter.embed(['x']));
    assert.ok(!f.calls.some(c => c.path === '/api/embed'));
  }
  for (const v of [[], vector(0), vector(NaN), vector(Infinity), ['1', ...Array(1023).fill(0)]]) {
    const f = fixture({ result: () => ({ model: PROFILE.model, embeddings: [v] }) });
    await assert.rejects(f.adapter.embed(['x']));
    await assert.rejects(f.adapter.embed(['x']));
    assert.equal(f.calls.filter(c => c.path === '/api/embed').length, 2);
  }
  for (const result of [null, {}, { model: 'wrong', embeddings: [vector()] },
    { model: PROFILE.model, embeddings: [] }, { model: PROFILE.model, embeddings: [vector(), vector()] }]) {
    await assert.rejects(fixture({ result: () => result }).adapter.embed(['x']));
  }
  for (const transport of [async () => ({ ok: false, status: 500 }),
    async () => ({ ok: true, json() { throw new Error('Injected malformed JSON'); } })]) {
    await assert.rejects(createEmbeddings({ transport }).embed(['x']));
  }
  for (const url of ['http://example.com', 'http://127.0.0.1/path', 'http://user@localhost', 'file:///tmp']) {
    assert.throws(() => loopbackURL(url));
  }
});

test('non-abortable stale successes and errors discarded after edits, examples and resubmission', async () => {
  for (const action of ['field edit', 'example selection', 'new submission']) {
    const gate = createRequestGate();
    let resolve;
    let shown = 'old cards';
    const token = gate.begin();
    const pending = new Promise(r => { resolve = r; }).then(value => {
      if (gate.isCurrent(token)) shown = value;
    });
    gate.invalidate(); shown = '';
    if (action === 'new submission') gate.begin();
    resolve('stale response'); await pending;
    assert.equal(shown, '', action);
    assert.equal(gate.isCurrent(token), false);
    const current = gate.begin();
    assert.equal(gate.isCurrent(current), true);
  }
});

test('HTTP catalog, local static UI, validation, outcomes and model errors', async t => {
  const server = createServer({ embeddings: fixture({ fail: true }).adapter });
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
  } catch (error) {
    if (error.code !== 'EPERM') throw error;
    t.skip('Sandbox denies loopback listen (EPERM); socket integration remains pending.');
    return;
  }
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await (await fetch(`${base}/api/catalog`)).json()).catalog.length, 66);
  const page = await fetch(base);
  assert.ok((await page.text()).includes('Find options for your event'));
  const post = brief => fetch(`${base}/api/recommend`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(brief),
  });
  assert.equal((await post({ ...demo, hours: '4' })).status, 400);
  assert.equal((await post({ ...demo, budgetUsdCents: 1 })).status, 200);
  const failure = await post(demo);
  assert.equal(failure.status, 503);
  assert.match((await failure.json()).error, /unavailable/);
  assert.equal((await fetch(`${base}/../.env`)).status, 404);
  assert.equal((await fetch(base, { headers: { Origin: 'https://example.com' } })).status, 403);
});

test('HTTP handler contract without sockets: JSON, Unicode, security, status and static content', async () => {
  const server = createServer({ embeddings: fixture().adapter });
  const handler = server.listeners('request')[0];
  async function request(url, body, extra = {}) {
    const bytes = Buffer.from(body ?? '');
    // One-byte chunks exercise multibyte UTF-8 boundaries.
    const req = Readable.from(Array.from(bytes, byte => Buffer.from([byte])));
    Object.assign(req, { url, method: body === undefined ? 'GET' : 'POST',
      headers: { host: '127.0.0.1:3000', 'content-type': 'application/json', ...extra } });
    const response = { socket: { localPort: 3000 }, headers: {},
      setHeader(key, value) { this.headers[key] = value; },
      writeHead(status, headers) { this.status = status; Object.assign(this.headers, headers); },
      end(content) { this.content = String(content); },
    };
    await handler(req, response);
    return response;
  }
  const response = await request('/api/recommend', JSON.stringify({ ...demo, style: 'Calm café 🎤' }));
  assert.equal(response.status, 200);
  assert.equal(JSON.parse(response.content).brief.style, 'Calm café 🎤');
  assert.equal(JSON.parse((await request('/api/catalog')).content).catalog.length, 66);
  assert.match((await request('/')).content, /Find options for your event/);
  assert.equal((await request('/api/recommend', '{')).status, 400);
  assert.equal((await request('/api/recommend', JSON.stringify({ ...demo, hours: 0 }))).status, 400);
  assert.equal((await request('/api/recommend', 'x'.repeat(32769))).status, 413);
  assert.equal((await request('/api/recommend', '{}', { 'content-type': 'text/plain' })).status, 415);
  assert.equal((await request('/', undefined, { host: 'evil.example:3000' })).status, 403);
  assert.equal((await request('/', undefined, { origin: 'https://evil.example' })).status, 403);
  assert.equal((await request('/.env')).status, 404);
  assert.match(response.headers['Content-Security-Policy'], /default-src 'self'/);
});

test('normalized cosine orders direction, not magnitude', async () => {
  const records = [0, 1, 2].map((n) => ({ ...catalog[0], id: `rank-${n}`,
    busy_dates: [], description: `Unique fixture description ${n}` }));
  const f = fixture({ result: input => ({ model: PROFILE.model,
    embeddings: input.map((_, i) => i === 0 ? vector() : i === 1 ? vector(-100)
      : i === 2 ? [0, 20, ...Array(1022).fill(0)] : vector(2)),
  }) });
  const result = await recommend(demo, f.adapter, records);
  assert.deepEqual(result.cards.map(c => c.id), ['rank-2', 'rank-1', 'rank-0']);
  assert.deepEqual(result.cards.map(c => c.score), [1, 0, -1]);
});

test('actual browser module handlers discard stale data and errors without fetch cancellation', async () => {
  // Minimal deterministic DOM fixture; not a layout, accessibility or real-browser check.
  class Node {
    constructor() { this.children = []; this.events = {}; this.attributes = {}; this.textContent = ''; }
    append(...nodes) { this.children.push(...nodes); }
    replaceChildren(...nodes) { this.children = nodes; }
    get lastChild() { return this.children.at(-1); }
    addEventListener(type, callback) { this.events[type] = callback; }
    setAttribute(key, value) { this.attributes[key] = value; }
  }
  const ids = ['brief', 'fields', 'results', 'status', 'oct17', 'oct18',
    'location', 'eventType', 'category', 'language'];
  const nodes = Object.fromEntries(ids.map(id => [id, new Node()]));
  const panel = new Node();
  const values = Object.fromEntries(Object.entries({
    ...demo, budget: '2000', hours: '4',
  }).map(([key, value]) => [key, { value }]));
  nodes.brief.elements = { namedItem: key => values[key] };
  const old = { document: globalThis.document, FormData: globalThis.FormData, fetch: globalThis.fetch };
  const pending = [];
  try {
    globalThis.document = {
      querySelector: query => query === '.results-panel' ? panel : nodes[query.slice(1)],
      getElementById: id => nodes[id], createElement: () => new Node(),
    };
    globalThis.FormData = class { get(key) { return values[key]?.value ?? ''; } };
    globalThis.fetch = async url => {
      if (url === '/api/catalog') return { ok: true, json: async () => config };
      // Ignore AbortSignal deliberately: revision checks must still protect the view.
      return new Promise((resolve, reject) => pending.push({ resolve, reject }));
    };
    await import('../public/app.mjs');
    const result = await recommend(demo, fixture().adapter);
    for (const action of ['input', 'change', 'oct18']) {
      const task = nodes.brief.events.submit({ preventDefault() {} });
      assert.equal(panel.attributes['aria-busy'], 'true');
      if (action === 'oct18') nodes.oct18.events.click();
      else nodes.brief.events[action]();
      const currentStatus = nodes.status.textContent;
      pending.shift().resolve({ ok: true, json: async () => result });
      await task;
      assert.equal(nodes.results.children.length, 0);
      assert.equal(nodes.status.textContent, currentStatus);
      assert.equal(panel.attributes['aria-busy'], 'false');
    }
    const staleFailure = nodes.brief.events.submit({ preventDefault() {} });
    nodes.oct17.events.click();
    pending.shift().reject(new Error('Injected outdated error'));
    await staleFailure;
    assert.ok(!nodes.status.textContent.includes('outdated error'));
    const first = nodes.brief.events.submit({ preventDefault() {} });
    const second = nodes.brief.events.submit({ preventDefault() {} });
    const a = pending.shift(); const b = pending.shift();
    b.resolve({ ok: true, json: async () => result }); await second;
    const rendered = nodes.results.children.length;
    assert.ok(rendered > 0);
    a.resolve({ ok: true, json: async () => ({ ...result, cards: [] }) }); await first;
    assert.equal(nodes.results.children.length, rendered);
    nodes.brief.events.input();
    assert.equal(nodes.results.children.length, 0);
    for (const count of [1, 2, 3]) {
      const task = nodes.brief.events.submit({ preventDefault() {} });
      pending.shift().resolve({ ok: true, json: async () => ({
        ...result, cards: result.cards.slice(0, count), eligibleCount: count,
      }) });
      await task;
      assert.equal(nodes.status.textContent,
        `${count} option${count === 1 ? '' : 's'} shown from ${count} eligible profile${count === 1 ? '' : 's'}. `
        + 'Ordered by description similarity; style wishes remain unverified.');
    }
  } finally {
    for (const [key, value] of Object.entries(old)) {
      if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
    }
  }
});
