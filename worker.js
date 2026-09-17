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

const formPageHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Allowlisted Gaming Proxy</title>
    <style>
      :root { --bg: #0f172a; --panel: #111827; --text: #f8fafc; --muted: #cbd5e1; --accent: #f87171; --border: rgba(148, 163, 184, 0.25); }
      * { box-sizing: border-box; }
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: linear-gradient(135deg, #0f172a, #111827 45%, #0b1120); color: var(--text); font-family: Arial, Helvetica, sans-serif; }
      .card { width: min(760px, calc(100vw - 32px)); background: rgba(17, 24, 39, 0.9); border: 1px solid var(--border); border-radius: 20px; padding: 28px; box-shadow: 0 20px 50px rgba(15, 23, 42, 0.55); }
      h1 { margin: 0 0 12px; font-size: clamp(2rem, 5vw, 3rem); }
      p { color: var(--muted); line-height: 1.6; }
      form { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 20px; }
      input { flex: 1 1 420px; min-height: 52px; padding: 0 16px; border-radius: 12px; border: 1px solid var(--border); background: rgba(15, 23, 42, 0.9); color: var(--text); font-size: 1rem; }
      button { min-height: 52px; padding: 0 22px; border: none; border-radius: 12px; background: linear-gradient(135deg, #f87171, #ef4444); color: white; font-weight: 700; cursor: pointer; }
      .note { margin-top: 18px; font-size: 0.95rem; }
    </style>
  </head>
  <body>
    <main class="card">
      <h1>Gaming proxy</h1>
      <p>This proxy supports a fixed allowlist of approved gaming sites. Paste a URL from one of the supported origins below.</p>
      <form method="GET" action="/proxy">
        <input type="url" name="url" placeholder="https://www.xbox.com/play" required />
        <button type="submit">Open</button>
      </form>
      <p class="note">Allowed origins include: xbox.com, www.xbox.com, now.gg, www.now.gg, lordz.io, www.lordz.io, and common IO gaming sites like agar.io, diep.io, mope.io, slither.io, shellshock.io, and tinyfishing.io.</p>
    </main>
  </body>
</html>`;

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

    const incoming = new URL(request.url);

    if (incoming.pathname === '/' || incoming.pathname === '/index.html') {
      return withCors(new Response(formPageHtml, {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      }));
    }

    if (incoming.pathname === '/proxy' || incoming.pathname === '/proxy/') {
      if (!incoming.searchParams.has('url')) {
        return withCors(new Response(formPageHtml, {
          status: 200,
          headers: { 'content-type': 'text/html; charset=utf-8' },
        }));
      }
    }

    try {
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
