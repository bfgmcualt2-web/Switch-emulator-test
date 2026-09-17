# YouTube allowlist proxy

This project uses a restricted allowlist proxy rather than an unrestricted open proxy.
The Worker accepts a target URL from the browser, verifies that it matches a fixed allowlist, and then
forwards the request to that origin.

## Allowed origins

```js
const ALLOWED_ORIGINS = new Set([
  'https://youtube.com',
  'https://www.youtube.com',
  'https://m.youtube.com',
  'https://music.youtube.com',
  'https://youtu.be',
]);
```

Only requests to those origins are accepted.

## Local development

```bash
npm install --save-dev wrangler
npx wrangler login
npx wrangler dev
```

Then open:

```text
http://localhost:8787/
```

Enter a URL like this into the form:

```text
https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

The form sends the request to:

```text
/proxy?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

The worker validates the URL, checks that the origin is allowlisted, and then proxies the request.

## Deploy

```bash
npx wrangler deploy
```

This is not an open proxy. It is intentionally limited to the known-good origins above.
