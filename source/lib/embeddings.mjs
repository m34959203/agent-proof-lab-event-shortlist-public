export const PROFILE = Object.freeze({
  version: '0.34.0', model: 'bge-m3:latest',
  digest: '7907646426070047a77226ac3e684fbbe8410524f7b4a74d02837e43f2146bab',
  dimensions: 1024,
});
export class ModelError extends Error {}

export function loopbackURL(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)
      || !['127.0.0.1', '[::1]', 'localhost'].includes(url.hostname)
      || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('OLLAMA_BASE_URL must be a loopback HTTP(S) origin without credentials.');
  }
  return url.origin;
}

export function normalize(vector) {
  if (!Array.isArray(vector) || vector.length !== PROFILE.dimensions
      || vector.some(x => typeof x !== 'number' || !Number.isFinite(x))) {
    throw new ModelError('Model returned malformed or wrong-dimension embeddings.');
  }
  const norm = Math.hypot(...vector);
  if (!Number.isFinite(norm) || norm === 0) throw new ModelError('Model returned an invalid vector norm.');
  return vector.map(x => x / norm);
}

export function createEmbeddings({ baseURL = 'http://127.0.0.1:11434',
  transport = fetch, timeoutMs = 8000 } = {}) {
  const origin = loopbackURL(baseURL);
  const identity = Object.freeze({ ...PROFILE,
    options: Object.freeze({ num_gpu: 0, num_thread: 2 }), truncate: false });
  const prefix = JSON.stringify(identity);
  const cache = new Map();
  let generation = 0;
  async function request(path, signal, body) {
    const response = await transport(`${origin}${path}`, {
      method: body ? 'POST' : 'GET', redirect: 'error', signal,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) throw new ModelError(`Model service returned HTTP ${response.status}.`);
    return response.json();
  }
  async function validateIdentity(signal) {
    const version = await request('/api/version', signal);
    if (version?.version !== PROFILE.version) throw new ModelError('Model service version mismatch.');
    const tags = await request('/api/tags', signal);
    const matches = Array.isArray(tags?.models)
      ? tags.models.filter(m => m?.name === PROFILE.model) : [];
    if (matches.length !== 1 || matches[0].digest !== PROFILE.digest) {
      throw new ModelError('Model name or digest mismatch.');
    }
  }
  return {
    identity,
    async embed(texts) {
      const signal = AbortSignal.timeout(timeoutMs);
      const startedGeneration = generation;
      try {
        await validateIdentity(signal);
        // Hold response vectors independently of shared cache eviction.
        const vectors = new Map([...new Set(texts)].map(t => [t, cache.get(prefix + '\n' + t)]));
        const missing = [...vectors.keys()].filter(t => vectors.get(t) === undefined);
        if (missing.length) {
          const result = await request('/api/embed', signal, {
            model: PROFILE.model, input: missing, truncate: false,
            options: identity.options,
          });
          if (result?.model !== PROFILE.model || !Array.isArray(result.embeddings)
              || result.embeddings.length !== missing.length) {
            throw new ModelError('Model returned an unexpected identity or embedding count.');
          }
          const normalized = result.embeddings.map(normalize);
          // Metadata checks bracket inference; they do not attest inference weights.
          await validateIdentity(signal);
          missing.forEach((t, i) => vectors.set(t, normalized[i]));
        }
        if (startedGeneration !== generation) {
          throw new ModelError('Model cache invalidated during this request. Retry.');
        }
        // No awaits between the generation guard, cache writes and return.
        for (const t of missing) {
          cache.set(prefix + '\n' + t, vectors.get(t));
          if (cache.size > 512) cache.delete(cache.keys().next().value);
        }
        return texts.map(t => vectors.get(t));
      } catch (error) {
        // Fail closed on identity failures and other uncertain service results.
        cache.clear();
        generation++;
        if (error instanceof ModelError) throw error;
        throw new ModelError('Model service unavailable, timed out, or returned invalid JSON.');
      }
    },
  };
}
