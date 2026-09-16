# Switch Emulator Test

This repository contains a static browser demo and an optional Cloudflare Worker reverse proxy.
The Worker is intentionally a **fixed-upstream proxy**, not an open proxy: it forwards requests only
 to the origin configured in `UPSTREAM_ORIGIN`.

## Run the proxy on Cloudflare Workers

Install and authenticate Wrangler:

```bash
npm install --save-dev wrangler
npx wrangler login
```

Set the upstream origin in `wrangler.toml`, then deploy:

```bash
npx wrangler deploy
```

The Worker forwards both `/proxy/path?query=1` and `/path?query=1` to the configured upstream. It
also exposes `/health` for a simple deployment check.

For a private deployment, configure a key as a Wrangler secret:

```bash
npx wrangler secret put PROXY_KEY
```

Clients must then send `X-Proxy-Key: <the-secret>`; the key is never forwarded upstream. Keep the
Worker URL private or put it behind Cloudflare Access if the upstream should not be publicly reachable.

### Local Worker development

```bash
npx wrangler dev
curl http://localhost:8787/health
curl http://localhost:8787/proxy/some/path
```

`UPSTREAM_ORIGIN` must be an `http://` or `https://` URL. The Worker does not accept a destination URL
from the client, which prevents it from becoming an SSRF/open-proxy service. CORS is enabled for browser
clients; narrow `access-control-allow-origin` in `worker.js` if the proxy is only for one site.

## Run the browser demo

```bash
npm test
npm start
```

The existing app remains a static, client-only Switch-style web shell. It does not contain Nintendo
firmware, keys, proprietary code, or a full Nintendo Switch emulator core.
