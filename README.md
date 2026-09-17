# CrazyGames domain-restricted Worker

Opening the bare Worker URL redirects directly to `https://www.crazygames.com/`, so CrazyGames loads its own CSS, JavaScript, images, API requests, CDN resources, cookies, and WebSockets normally.

The restricted `/proxy?url=...` endpoint remains available for explicitly supplied HTTPS URLs on `crazygames.com` or its subdomains. It strips incoming cookies and authorization headers and does not forward upstream cookies.

Use the direct Worker URL for normal browsing. Use the proxy endpoint only for simple resources that do not depend on CrazyGames browser sessions or client-side APIs.
