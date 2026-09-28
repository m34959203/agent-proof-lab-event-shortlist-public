import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { catalog } from './data/catalog.mjs';
import { config, recommend, InputError } from './lib/recommend.mjs';
import { createEmbeddings, ModelError } from './lib/embeddings.mjs';

const staticFiles = new Map([
  ['/', ['index.html', 'text/html']], ['/app.mjs', ['app.mjs', 'text/javascript']],
  ['/shared.mjs', ['shared.mjs', 'text/javascript']], ['/style.css', ['style.css', 'text/css']],
]);
export function createServer({ embeddings = createEmbeddings({
  baseURL: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
}) } = {}) {
  return http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self'; frame-ancestors 'none'; base-uri 'none'");
    res.setHeader('Cache-Control', 'no-store');
    function json(status, body) {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
    }
    try {
      const origin = `http://${req.headers.host}`;
      if (req.headers.host !== `127.0.0.1:${res.socket.localPort}`
          && req.headers.host !== `localhost:${res.socket.localPort}`) {
        return json(403, { error: 'Invalid local host.' });
      }
      if (req.headers.origin && req.headers.origin !== origin) {
        return json(403, { error: 'Cross-origin requests are not accepted.' });
      }
      if (req.method === 'GET' && req.url === '/api/catalog') {
        return json(200, { ...config, catalog });
      }
      if (req.method === 'POST' && req.url === '/api/recommend') {
        if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) {
          return json(415, { error: 'Send application/json.' });
        }
        const chunks = [];
        let bytes = 0;
        for await (const chunk of req) {
          bytes += chunk.length;
          if (bytes > 32768) return json(413, { error: 'Brief is too large.' });
          chunks.push(chunk);
        }
        let input;
        try { input = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
        catch { return json(400, { error: 'Invalid JSON.' }); }
        return json(200, await recommend(input, embeddings));
      }
      if (req.method === 'GET' && staticFiles.has(req.url)) {
        const [file, type] = staticFiles.get(req.url);
        const content = await readFile(new URL(`./public/${file}`, import.meta.url));
        res.writeHead(200, { 'Content-Type': `${type}; charset=utf-8` });
        return res.end(content);
      }
      json(404, { error: 'Not found.' });
    } catch (error) {
      json(error instanceof InputError ? 400 : error instanceof ModelError ? 503 : 500,
        { error: error instanceof InputError || error instanceof ModelError
          ? error.message : 'The local server could not complete this request.' });
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT.');
  createServer().listen(port, '127.0.0.1', () => {
    console.log(`Event Shortlist: http://127.0.0.1:${port}`);
  });
}
