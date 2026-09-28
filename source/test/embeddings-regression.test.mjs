import test from 'node:test';
import assert from 'node:assert/strict';
import { createEmbeddings, PROFILE, ModelError, normalize } from '../lib/embeddings.mjs';

// Deterministic transport only; no model or network access.
const vector = text => [3, Number(text) + 1, ...Array(1022).fill(0)];
function fixture() {
  const state = { version: PROFILE.version, models: [{ name: PROFILE.model, digest: PROFILE.digest }],
    batches: [], onEmbed: async () => {} };
  state.adapter = createEmbeddings({ transport: async (url, options) => {
    let body;
    if (url.endsWith('/api/version')) body = { version: state.version };
    else if (url.endsWith('/api/tags')) body = { models: state.models };
    else {
      const input = JSON.parse(options.body).input;
      state.batches.push(input);
      await state.onEmbed(input);
      body = { model: PROFILE.model, embeddings: input.map(vector) };
    }
    return { ok: true, json: async () => body };
  } });
  return state;
}
const deferred = () => {
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  return { promise, resolve };
};

test('oversized mixed batch preserves duplicates, ordering and normalized vectors with a 512-entry cache', async () => {
  const f = fixture();
  await f.adapter.embed(['0', '1']);
  const texts = ['1', ...Array.from({ length: 600 }, (_, i) => String(i)), '0', '599', '1'];
  const result = await f.adapter.embed(texts);
  assert.deepEqual(result, texts.map(text => normalize(vector(text))));
  assert.equal(f.batches[1].length, 598);
  for (const v of result) {
    assert.ok(v.every(Number.isFinite));
    assert.ok(Math.abs(Math.hypot(...v) - 1) < 1e-12);
  }
  await f.adapter.embed(['88', '599']);
  assert.equal(f.batches.length, 2, 'last 512 entries remain cached');
  await f.adapter.embed(['87']);
  assert.deepEqual(f.batches[2], ['87'], 'older entry was evicted');
});

test('post-inference version, name, duplicate identity and digest failures clear previously cached vectors', async () => {
  for (const mutate of [
    f => { f.version = 'wrong'; },
    f => { f.models = [{ name: 'wrong', digest: PROFILE.digest }]; },
    f => { f.models = [...f.models, ...f.models]; },
    f => { f.models = [{ name: PROFILE.model, digest: 'wrong' }]; },
  ]) {
    const f = fixture();
    await f.adapter.embed(['0']);
    f.onEmbed = async () => mutate(f);
    await assert.rejects(f.adapter.embed(['1', '0']), ModelError);
    f.version = PROFILE.version;
    f.models = [{ name: PROFILE.model, digest: PROFILE.digest }];
    f.onEmbed = async () => {};
    await f.adapter.embed(['0', '1']);
    assert.deepEqual(f.batches[2], ['0', '1']);
  }
});

test('overlapping inference cannot return or recache vectors after another call invalidates identity', async () => {
  const f = fixture();
  await f.adapter.embed(['0']);
  const entered = deferred(); const release = deferred();
  f.onEmbed = async () => { entered.resolve(); await release.promise; };
  const pending = f.adapter.embed(['0', '1']);
  const rejected = assert.rejects(pending, /invalidated during this request/);
  await entered.promise;
  f.version = 'wrong';
  await assert.rejects(f.adapter.embed(['0']), ModelError);
  f.version = PROFILE.version;
  release.resolve();
  await rejected;
  f.onEmbed = async () => {};
  await f.adapter.embed(['0', '1']);
  assert.deepEqual(f.batches[2], ['0', '1']);
});

test('concurrent successful batches retain their own cached vectors despite eviction', async () => {
  const f = fixture();
  await f.adapter.embed(['0']);
  const entered = deferred(); const release = deferred();
  f.onEmbed = async input => {
    if (input.includes('1')) { entered.resolve(); await release.promise; }
  };
  const pending = f.adapter.embed(['0', '1', '0']);
  await entered.promise;
  await f.adapter.embed(Array.from({ length: 513 }, (_, i) => String(i + 2)));
  release.resolve();
  assert.deepEqual(await pending, ['0', '1', '0'].map(text => normalize(vector(text))));
});
