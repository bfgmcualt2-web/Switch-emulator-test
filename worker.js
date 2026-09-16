const corsHeaders = {
  'access-control-allow-headers': 'Authorization, Content-Type, X-Proxy-Key',
  'access-control-allow-methods': 'GET, HEAD, OPTIONS, POST, PUT, PATCH, DELETE',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': '*',
};

function withCors(response) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(corsHeaders)) headers.set(name, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function json(data, status = 200) {
  return withCors(new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  }));
}

function isAllowedMethod(method) {
  return ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
}

function upstreamUrl(request, origin) {
  const incoming = new URL(request.url);
  const base = new URL(origin);
  // /proxy/foo is sent to <UPSTREAM_ORIGIN>/foo. The root path is also proxied.
  const path = incoming.pathname === '/proxy'
    ? '/'
    : incoming.pathname.startsWith('/proxy/')
      ? incoming.pathname.slice('/proxy'.length)
      : incoming.pathname;
  base.pathname = path || '/';
  base.search = incoming.search;
  return base;
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return withCors(new Response(null, { status: 204 }));
    if (!isAllowedMethod(request.method)) return json({ error: 'Method not allowed' }, 405);

    const incoming = new URL(request.url);
    if (incoming.pathname === '/health') {
      return json({ ok: true, service: 'cloudflare-reverse-proxy' });
    }

    if (!env.UPSTREAM_ORIGIN) {
      return json({ error: 'UPSTREAM_ORIGIN is not configured' }, 500);
    }

    if (env.PROXY_KEY && request.headers.get('x-proxy-key') !== env.PROXY_KEY) {
      return json({ error: 'Unauthorized' }, 401);
    }

    let target;
    try {
      target = upstreamUrl(request, env.UPSTREAM_ORIGIN);
      if (!['http:', 'https:'].includes(target.protocol)) throw new Error('Only HTTP(S) upstreams are supported');
    } catch {
      return json({ error: 'UPSTREAM_ORIGIN must be a valid http(s) URL' }, 500);
    }

    const headers = new Headers(request.headers);
    headers.set('host', target.host);
    headers.set('x-forwarded-host', incoming.host);
    headers.set('x-forwarded-proto', incoming.protocol.replace(':', ''));
    headers.delete('x-proxy-key');

    const proxiedRequest = new Request(target, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
      redirect: 'manual',
    });

    try {
      const response = await fetch(proxiedRequest);
      // Cache only responses that explicitly opt in through normal HTTP caching headers.
      if (request.method === 'GET' && response.ok) ctx.waitUntil(caches.default.put(request, response.clone()));
      return withCors(response);
    } catch (error) {
      return json({ error: 'Upstream request failed', detail: error instanceof Error ? error.message : String(error) }, 502);
    }
  },
};
