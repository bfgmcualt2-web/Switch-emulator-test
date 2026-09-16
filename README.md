# Switch Emulator Test

This repository contains a static browser demo and an open Cloudflare Worker reverse proxy.
The Worker is a fixed-upstream proxy: it forwards requests only to the origin configured in
`UPSTREAM_ORIGIN` and does not accept arbitrary destination URLs from the client.

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

### Local Worker development

```bash
npx wrangler dev
curl http://localhost:8787/health
curl http://localhost:8787/proxy/some/path
```

`UPSTREAM_ORIGIN` must be an `http://` or `https://` URL. The Worker does not accept a destination URL
from the client, which keeps it fixed and safe. CORS is enabled for browser clients.

## Run the browser demo

```bash
npm test
npm start
```

The existing app remains a static, client-only Switch-style web shell. It does not contain Nintendo
firmware, keys, proprietary code, or a full Nintendo Switch emulator core.
