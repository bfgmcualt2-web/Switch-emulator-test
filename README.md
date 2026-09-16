# Switch Emulator Test

This repository now redirects directly to the official Xbox Cloud Gaming site.

## Cloudflare proxy

The Worker proxies requests to the fixed upstream origin:

```toml
UPSTREAM_ORIGIN = "https://www.xbox.com"
```

This keeps the deployment pointed at the official Xbox Cloud Gaming site and preserves the cloudflare proxy pattern.

## Local development

```bash
npm install --save-dev wrangler
npx wrangler login
npx wrangler dev
```

Then open:

- http://localhost:8787/
- http://localhost:8787/proxy/

Both are routed to the official Xbox Cloud Gaming site through the fixed upstream origin.
