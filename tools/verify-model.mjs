import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

export const expected = {
  version: '0.34.0', model: 'bge-m3:latest',
  digest: '7907646426070047a77226ac3e684fbbe8410524f7b4a74d02837e43f2146bab',
  dimensions: 1024,
};

export function localOrigin(value) {
  const u = new URL(value);
  assert(['http:', 'https:'].includes(u.protocol), 'Use HTTP(S).');
  assert(['localhost', '127.0.0.1', '[::1]'].includes(u.hostname), 'Use a loopback address.');
  assert(!u.username && !u.password && !u.search && !u.hash && u.pathname === '/',
    'Use an origin without credentials, path, query or fragment.');
  return u.origin;
}

export async function verifyModel(address = 'http://127.0.0.1:11434') {
  const origin = localOrigin(address);
  async function request(route, body) {
    const response = await fetch(origin + route, {
      method: body ? 'POST' : 'GET', redirect: 'error',
      signal: AbortSignal.timeout(body ? 120000 : 10000),
      ...(body ? {headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)} : {}),
    });
    assert(response.ok, `${route}: HTTP ${response.status}`);
    return response.json();
  }
  const version = await request('/api/version');
  assert.equal(version.version, expected.version, 'Ollama version does not match the recording.');
  const tags = await request('/api/tags');
  const models = tags.models.filter(m => m.name === expected.model);
  assert.equal(models.length, 1, 'Pull the documented model before continuing.');
  assert.equal(models[0].digest, expected.digest, 'Model tag changed: do not remove the identity check.');
  const start = performance.now();
  const result = await request('/api/embed', {
    model: expected.model,
    input: ['A calm conference host.', 'Clear presentations without party games.'],
    truncate: false, options: {num_gpu: 0, num_thread: 2}, keep_alive: '5m',
  });
  assert.equal(result.model, expected.model);
  assert.equal(result.embeddings?.length, 2);
  for (const vector of result.embeddings) {
    assert.equal(vector.length, expected.dimensions);
    const norm = Math.hypot(...vector);
    assert(vector.every(Number.isFinite) && Number.isFinite(norm) && norm > 0,
      'Embedding must have a finite, positive norm.');
  }
  const after = await request('/api/tags');
  const afterModels = after.models.filter(m => m.name === expected.model);
  assert.equal(afterModels.length, 1, 'Model identity became missing or ambiguous after inference.');
  assert.equal(afterModels[0].digest, expected.digest);
  return {check: 'live-model', passed: true, ...expected,
    embeddingCount: result.embeddings.length, elapsedMs: Math.round(performance.now() - start),
    note: 'Real embeddings; reported metadata checked, not cryptographic inference attestation. Model is now warm.'};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { console.log(JSON.stringify(await verifyModel(process.argv[2]), null, 2)); }
  catch (error) { console.error(JSON.stringify({passed: false, error: error.message})); process.exitCode = 1; }
}
