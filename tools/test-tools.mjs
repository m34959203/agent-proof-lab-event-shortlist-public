import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {once} from 'node:events';
import {localOrigin, verifyModel, expected} from './verify-model.mjs';

// Deterministic transport fixtures, NOT evidence of real model inference.
async function fixture(mode, check) {
  let tagCalls = 0;
  const server = http.createServer((req, res) => {
    req.resume();
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/api/version') {
      res.end(JSON.stringify({version: mode === 'version' ? 'wrong' : expected.version}));
    } else if (req.url === '/api/tags') {
      tagCalls++;
      const changed = mode === 'digest' || (mode === 'after' && tagCalls > 1);
      const models = mode === 'missing' || (mode === 'missing-after' && tagCalls > 1) ? [] : [{
        name: expected.model, digest: changed ? 'changed' : expected.digest,
      }];
      if (mode === 'duplicate-after' && tagCalls > 1) models.push({...models[0]});
      res.end(JSON.stringify({models}));
    } else if (req.url === '/api/embed') {
      const vector = Array(mode === 'dimensions' ? 3 : 1024).fill(0);
      if (mode === 'overflow') vector.fill(Number.MAX_VALUE);
      else if (mode !== 'zero') vector[0] = 1;
      res.end(JSON.stringify({model: expected.model, embeddings: [vector, vector]}));
    } else { res.statusCode = 404; res.end('{}'); }
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try { await check(`http://127.0.0.1:${server.address().port}`); }
  finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}

test('model helper accepts only plain loopback origins', () => {
  assert.equal(localOrigin('http://127.0.0.1:11438'), 'http://127.0.0.1:11438');
  for (const input of ['https://example.com', 'http://user:pass@localhost',
    'http://localhost/path', 'http://localhost?token=x', 'file:///tmp/model']) {
    assert.throws(() => localOrigin(input));
  }
});

test('complete transport fixture passes identity and vector checks', async () => {
  await fixture('valid', async origin => assert.equal((await verifyModel(origin)).passed, true));
});

for (const mode of ['version', 'digest', 'missing', 'dimensions', 'after',
  'overflow', 'zero', 'missing-after', 'duplicate-after']) {
  test(`rejects ${mode} mismatch rather than reporting success`, async () => {
    await fixture(mode, async origin => { await assert.rejects(verifyModel(origin)); });
  });
}
