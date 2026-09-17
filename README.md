# CrazyGames domain-restricted proxy

The Worker now routes only to CrazyGames. A target is accepted when its hostname is exactly
`crazygames.com` or is a subdomain of `crazygames.com`; lookalike domains are rejected.

Examples:

```text
/proxy?url=https://www.crazygames.com/
/proxy?url=https://www.crazygames.com/game/example
/proxy?url=https://games.crazygames.com/
```

If no `url` parameter is supplied, the Worker uses `https://www.crazygames.com/`. If a URL outside the
CrazyGames domain, a non-HTTPS URL, or an unsupported method is requested, it returns a 403 HTML page
that displays a browser popup and a link back to CrazyGames.

The proxy does not forward browser cookies or authorization headers. Some CrazyGames features may still
not work through a proxy because of site security controls, third-party services, WebSockets, or CDN
requirements. The direct site remains the most reliable option:

```text
https://www.crazygames.com/
```
