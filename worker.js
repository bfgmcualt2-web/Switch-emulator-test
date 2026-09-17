const ALLOWED_ORIGINS = new Set([
  'https://youtube.com',
  'https://www.youtube.com',
  'https://m.youtube.com',
  'https://music.youtube.com',
  'https://youtu.be',
  'https://xbox.com',
  'https://www.xbox.com',
  'https://now.gg',
  'https://www.now.gg',
  'https://lordz.io',
  'https://www.lordz.io',
  'https://agar.io',
  'https://www.agar.io',
  'https://slither.io',
  'https://www.slither.io',
  'https://mope.io',
  'https://www.mope.io',
  'https://diep.io',
  'https://www.diep.io',
  'https://shellshock.io',
  'https://www.shellshock.io',
  'https://tinyfishing.io',
  'https://www.tinyfishing.io',
  'https://iogames.space',
  'https://www.iogames.space',
  'https://crazygames.com',
  'https://www.crazygames.com',
]);

const corsHeaders = {
  'access-control-allow-headers': 'Authorization, Content-Type',
  'access-control-allow-methods': 'GET, HEAD, OPTIONS',
  'access-control-allow-origin': '*',
};

function withCors(response) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(corsHeaders)) {
    headers.set(name, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function json(data, status = 200) {
  return withCors(new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  }));
}

function parseTargetUrl(request) {
  const incoming = new URL(request.url);
  const candidate = incoming.searchParams.get('url');

  if (!candidate) {
    throw new Error('Missing ?url= parameter');
  }

  const target = new URL(candidate);

  if (!['http:', 'https:'].includes(target.protocol)) {
    throw new Error('Only HTTP(S) URLs are allowed');
  }

  if (!ALLOWED_ORIGINS.has(target.origin)) {
    throw new Error(`Origin not allowed: ${target.origin}`);
  }

  return target;
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return withCors(new Response(null, { status: 204 }));
    }

    if (!['GET', 'HEAD'].includes(request.method)) {
      return json({ error: 'Only GET and HEAD are supported.' }, 405);
    }

    try {
      const incoming = new URL(request.url);
      const target = parseTargetUrl(request);
      const headers = new Headers(request.headers);

      headers.set('host', target.host);
      headers.set('x-forwarded-host', incoming.host);
      headers.set('x-forwarded-proto', incoming.protocol.replace(':', ''));

      const proxiedRequest = new Request(target, {
        method: request.method,
        headers,
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
        redirect: 'manual',
      });

      const response = await fetch(proxiedRequest);
      if (request.method === 'GET' && response.ok) {
        ctx.waitUntil(caches.default.put(request, response.clone()));
      }
      return withCors(response);
    } catch (error) {
      return json({
        error: 'Invalid or disallowed target URL',
        detail: error instanceof Error ? error.message : String(error),
      }, 400);
    }
  },
};
