# Gaming allowlist proxy

This project uses a restricted allowlist proxy rather than an unrestricted open proxy.
The Worker accepts a target URL from the browser, verifies that it matches an allowlist, and then
forwards the request to that origin.

## Allowed origins

The current allowlist includes gaming and streaming destinations such as:

- xbox.com / www.xbox.com
- now.gg / www.now.gg
- lordz.io / www.lordz.io
- agar.io / www.agar.io
- slither.io / www.slither.io
- mope.io / www.mope.io
- diep.io / www.diep.io
- shellshock.io / www.shellshock.io
- tinyfishing.io / www.tinyfishing.io
- iogames.space / www.iogames.space
- crazygames.com / www.crazygames.com
- youtube.com / www.youtube.com / m.youtube.com / music.youtube.com / youtu.be

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

Enter a supported URL such as:

```text
https://www.xbox.com/play
```

or:

```text
https://www.now.gg/
```

The form sends the request to a `/proxy?url=...` endpoint, which validates the origin and forwards the request if it is allowlisted.

## Deploy

```bash
npx wrangler deploy
```

This is not an open proxy. It is intentionally limited to the approved gaming origins above.
