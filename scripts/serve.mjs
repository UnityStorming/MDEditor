import http from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = await realpath(fileURLToPath(new URL('../', import.meta.url)));
const port = Number(process.env.PORT || 5173);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.md': 'text/plain; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function insideRoot(candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

const server = http.createServer(async (request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end('Method not allowed');
    return;
  }
  try {
    // Decode the raw path before resolving it so encoded traversal cannot escape the root.
    let pathname = decodeURIComponent((request.url || '/').split('?')[0]);
    if (pathname.includes('\0')) {
      response.writeHead(400).end('Invalid path');
      return;
    }
    if (pathname === '/wechat') {
      response.writeHead(302, { Location: '/wechat/' }).end();
      return;
    }
    if (pathname.startsWith('/wechat/')) pathname = pathname.slice('/wechat'.length);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const candidate = path.resolve(root, `.${pathname}`);
    if (!insideRoot(candidate)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    const resolved = await realpath(candidate);
    if (!insideRoot(resolved)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    const metadata = await stat(resolved);
    if (!metadata.isFile()) {
      response.writeHead(404).end('Not found');
      return;
    }
    response.writeHead(200, {
      'Content-Type': mime[path.extname(resolved).toLowerCase()] || 'application/octet-stream',
      'Content-Length': metadata.size,
      'Cache-Control': 'no-cache',
    });
    response.end(request.method === 'HEAD' ? undefined : await readFile(resolved));
  } catch (error) {
    if (error instanceof URIError) response.writeHead(400).end('Invalid path');
    else if (error.code === 'ENOENT' || error.code === 'ENOTDIR') response.writeHead(404).end('Not found');
    else if (!response.headersSent) response.writeHead(500).end('Server error');
    else response.destroy();
  }
});

server.on('error', (error) => {
  console.error(`Cannot start local server: ${error.message}`);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => {
  console.log(`Markdown editor: http://127.0.0.1:${port}/wechat/`);
  console.log('Press Ctrl+C to stop.');
});
