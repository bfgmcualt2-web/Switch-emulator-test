# CrazyGames domain-restricted proxy

The Worker routes only to `crazygames.com` and its subdomains. It stores one harmless, proxy-owned preference cookie:

```text
proxy_preferences=1; Secure; HttpOnly; SameSite=Lax
```

This cookie belongs to the Worker domain only. It is not a CrazyGames cookie, is not used for authentication, and is never forwarded upstream. Upstream `Set-Cookie` headers are stripped, and incoming `Cookie` and `Authorization` headers are removed before requests are sent to CrazyGames.

Examples:

```text
/proxy?url=https://www.crazygames.com/
/proxy?url=https://www.crazygames.com/game/example
/proxy?url=https://games.crazygames.com/
```

If no `url` parameter is supplied, the Worker uses `https://www.crazygames.com/`. URLs outside the CrazyGames domain, non-HTTPS URLs, and unsupported methods receive a blocked-destination page with a browser popup and a link back to CrazyGames.

Some CrazyGames features may not work through a proxy because of site security controls, third-party services, WebSockets, or CDN requirements. The direct site remains the most reliable option:

```text
https://www.crazygames.com/
```
