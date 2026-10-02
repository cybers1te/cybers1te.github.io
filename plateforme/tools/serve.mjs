#!/usr/bin/env node
// marketbuss — serveur local pour essayer la plateforme : http://127.0.0.1:5300/
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../site');
const PORT = Number(process.env.PORT) || 5300;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const file = path.join(ROOT, path.normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '') || 'index.html');
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404).end('Introuvable');
  }
}).listen(PORT, '127.0.0.1', () => console.log(`marketbuss : http://127.0.0.1:${PORT}/`));
