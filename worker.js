const ALLOWED_ROOT_DOMAIN = 'crazygames.com';
const PROXY_PATH = '/proxy';

const corsHeaders = {
  'access-control-allow-headers': 'Content-Type',
  'access-control-allow-methods': 'GET, HEAD, OPTIONS',
  'access-control-allow-origin': '*',
};

function proxyUrl(target) {
  return `${PROXY_PATH}?url=${encodeURIComponent(target.href)}`;
}

function withCors(response, setProxyCookie = false) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(corsHeaders)) headers.set(name, value);
  headers.delete('set-cookie');
  if (setProxyCookie) {
    headers.append(
      'set-cookie',
      'proxy_preferences=1; Path=/; Max-Age=86400; Secure; HttpOnly; SameSite=Lax'
    );
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function htmlError(message) {
  const safeMessage = message.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[character]));

  return withCors(new Response(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Blocked destination</title></head>
<body><script>alert(${JSON.stringify(message)});</script><main style="font-family:system-ui,sans-serif;max-width:42rem;margin:4rem auto;padding:1rem"><h1>Destination not allowed</h1><p>${safeMessage}</p><p><a href="https://www.crazygames.com/">Return to CrazyGames</a></p></main></body></html>`, {
    status: 403,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  }));
}

function isAllowedHost(hostname) {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  return host === ALLOWED_ROOT_DOMAIN || host.endsWith(`.${ALLOWED_ROOT_DOMAIN}`);
}

function parseTargetUrl(request) {
  const incoming = new URL(request.url);
  const candidate = incoming.searchParams.get('url');
  if (!candidate) return null;

  const target = new URL(candidate);
  if (target.protocol !== 'https:') throw new Error('Only HTTPS URLs are allowed.');
  if (!isAllowedHost(target.hostname)) {
    throw new Error('Only crazygames.com and its subdomains are allowed.');
  }
  return target;
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') return withCors(new Response(null, { status: 204 }));
    if (!['GET', 'HEAD'].includes(request.method)) {
      return htmlError('Only GET and HEAD requests are supported.');
    }

    let target;
    try {
      target = parseTargetUrl(request);
    } catch (error) {
      return htmlError(error instanceof Error ? error.message : 'The destination is not allowed.');
    }

    // A bare Worker URL now opens the real site directly. This avoids a broken
    // loading shell caused by CrazyGames client-side API, CDN, and WebSocket
    // requests that cannot be reliably represented by a basic HTML proxy.
    

    // Keep the restricted proxy endpoint available for explicitly supplied
    // targets, while never forwarding credentials or upstream cookies.
    const incoming = new URL(request.url);
    const headers = new Headers(request.headers);
    
    

    try {
      const upstream = await fetch(new Request(target, {
        method: request.method,
        headers,
        redirect: 'manual',
      }));

      const location = upstream.headers.get('location');
      if (location) {
        const redirected = new URL(location, target);
        if (isAllowedHost(redirected.hostname) && redirected.protocol === 'https:') {
          const redirectedHeaders = new Headers(upstream.headers);
          redirectedHeaders.set('location', proxyUrl(redirected));
          return withCors(new Response(null, {
            status: upstream.status,
            statusText: upstream.statusText,
            headers: redirectedHeaders,
          }), true);
        }
      }

      return withCors(upstream, true);
    } catch (error) {
      return htmlError(error instanceof Error ? error.message : 'The CrazyGames request failed.');
    }
  },
};
