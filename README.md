# CrazyGames domain-restricted Worker

This Worker accepts only HTTPS requests whose destination is on `crazygames.com` or its subdomains.

Behavior:
- No `url` query param -> redirect to `https://www.crazygames.com/`
- `?url=https://www.crazygames.com/...` -> fetch that URL, but strip incoming `cookie` and `authorization` headers before the upstream request
- Non-HTTPS or non-CrazyGames URLs -> 403
- Unsupported methods -> 405
