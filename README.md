# CrazyGames domain-restricted proxy

The Worker routes only to `crazygames.com` and its subdomains. It also rewrites same-domain HTML links and asset URLs back through `/proxy`, which prevents the browser from leaving the Worker for normal page navigation, stylesheets, scripts, images, forms, and frames. Same-domain redirects are rewritten as well.

The proxy-owned `proxy_preferences` cookie is retained, while upstream cookies and authorization headers are removed. External CDN or service URLs remain unchanged and may require direct access; CrazyGames pages can also use WebSockets or other browser features that a basic HTTP proxy cannot reproduce.

Examples:

```text
/proxy?url=https://www.crazygames.com/
/proxy?url=https://www.crazygames.com/game/example
```

A missing `url` defaults to `https://www.crazygames.com/`. Non-CrazyGames destinations, non-HTTPS URLs, and unsupported methods receive a blocked-destination page.
