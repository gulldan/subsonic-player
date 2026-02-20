import { createServer, type Server } from 'node:http';
import type { Express, Request } from 'express';

function normalizeServerUrl(url: string): string {
  return url
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/rest$/i, '');
}

function appendForwardedQueryParams(searchParams: URLSearchParams, query: Request['query']) {
  for (const [key, value] of Object.entries(query)) {
    if (key === 'serverUrl' || value == null) continue;

    if (typeof value === 'string') {
      searchParams.append(key, value);
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string') {
          searchParams.append(key, item);
        }
      }
    }
  }
}

function serializeFormBody(body: unknown): string {
  if (!body || typeof body !== 'object') return '';

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null) {
          searchParams.append(key, String(item));
        }
      }
      continue;
    }

    searchParams.append(key, String(value));
  }
  return searchParams.toString();
}

function getForwardBody(req: Request): string | Buffer | undefined {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return undefined;
  }

  const contentType = req.header('content-type')?.toLowerCase() ?? '';
  if (contentType.includes('application/json')) {
    if (Buffer.isBuffer(req.rawBody)) {
      return req.rawBody as Buffer;
    }
    if (req.body !== undefined) {
      return JSON.stringify(req.body);
    }
    return undefined;
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    if (typeof req.body === 'string') {
      return req.body;
    }
    return serializeFormBody(req.body);
  }

  if (Buffer.isBuffer(req.rawBody)) {
    return req.rawBody as Buffer;
  }

  if (typeof req.body === 'string') {
    return req.body;
  }

  return undefined;
}

function getForwardHeaders(req: Request, hasBody: boolean): Record<string, string> {
  const headers: Record<string, string> = {};
  const accept = req.header('accept');
  if (accept) headers.Accept = accept;

  const range = req.header('range');
  if (range) headers.Range = range;

  if (hasBody) {
    const contentType = req.header('content-type');
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
  }

  return headers;
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.all('/api/subsonic/:endpoint', async (req, res) => {
    try {
      const endpoint = req.params.endpoint;
      const serverUrlQuery = req.query.serverUrl;
      const serverUrl = Array.isArray(serverUrlQuery) ? serverUrlQuery[0] : serverUrlQuery;

      if (typeof serverUrl !== 'string' || !serverUrl.trim()) {
        return res.status(400).json({ error: 'Missing serverUrl parameter' });
      }

      const searchParams = new URLSearchParams();
      appendForwardedQueryParams(searchParams, req.query);

      const targetUrl = `${normalizeServerUrl(serverUrl)}/rest/${endpoint}?${searchParams.toString()}`;
      const body = getForwardBody(req);
      const forwardBody = body as BodyInit | undefined;
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: getForwardHeaders(req, body !== undefined),
        body: forwardBody,
      });

      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });

      const contentType = response.headers.get('content-type') ?? '';
      if (
        contentType.includes('image') ||
        contentType.includes('audio') ||
        contentType.includes('video') ||
        contentType.includes('octet-stream')
      ) {
        const buffer = Buffer.from(await response.arrayBuffer());
        return res.status(response.status).send(buffer);
      }

      const text = await response.text();
      return res.status(response.status).send(text);
    } catch (error: any) {
      console.error('Subsonic proxy error:', error?.message);
      return res.status(502).json({ error: 'Failed to connect to Subsonic server' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
