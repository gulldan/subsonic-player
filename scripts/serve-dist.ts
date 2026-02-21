import { join } from 'node:path';

const DIST = join(import.meta.dir, '..', 'dist');

Bun.serve({
  port: 8081,
  async fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
    const file = Bun.file(join(DIST, pathname));
    if (await file.exists()) return new Response(file);
    return new Response(Bun.file(join(DIST, 'index.html')));
  },
});

console.log('Serving HTTP on http://localhost:8081');
