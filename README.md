# YouTube redirect

This repository now redirects directly to the official YouTube site.

## Cloudflare proxy

The Worker forwards requests to the fixed upstream origin:

```toml
UPSTREAM_ORIGIN = "https://www.youtube.com"
```

This keeps the deployment pointed at the official YouTube site while preserving the Cloudflare worker pattern.

## Local development

```bash
npm install --save-dev wrangler
npx wrangler login
npx wrangler dev
```

Then open:

- http://localhost:8787/
- http://localhost:8787/proxy/

Both routes are pointed to the official YouTube site.
