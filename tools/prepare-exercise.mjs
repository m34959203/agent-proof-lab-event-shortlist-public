import {mkdir, copyFile, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const root = fileURLToPath(new URL('../', import.meta.url));
if (!process.argv[2]) throw Error('Supply a NEW destination folder. Nothing existing is overwritten.');
const destination = path.resolve(process.argv[2]);
await mkdir(destination); // Deliberately refuses an existing destination.
await mkdir(path.join(destination, 'data'));
const copied = [];
for (const relative of ['BRIEF.md', 'data/catalog.mjs', 'PROMPT-01.md']) {
  const bytes = await readFile(path.join(root, 'source', relative));
  await copyFile(path.join(root, 'source', relative), path.join(destination, relative));
  copied.push({path: relative, sha256: createHash('sha256').update(bytes).digest('hex')});
}
await copyFile(path.join(root, 'exercise', 'VIEWER-BUILD.md'), path.join(destination, 'VIEWER-BUILD.md'));
await writeFile(path.join(destination, 'SEED-MANIFEST.json'), JSON.stringify({
  scope: 'New exercise with brief, fictional catalog and published prompt only; no application source or completed tests.', copied,
}, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify({prepared: true, files: [...copied.map(f => f.path), 'VIEWER-BUILD.md', 'SEED-MANIFEST.json'],
  next: 'Open your coding tool IN THE NEW folder and submit VIEWER-BUILD.md. Do not point it at the completed source.'}, null, 2));
