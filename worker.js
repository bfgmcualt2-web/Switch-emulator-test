const ALLOWED_ROOT_DOMAIN = "crazygames.com";

function isAllowedHost(hostname) {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  return host === ALLOWED_ROOT_DOMAIN || host.endsWith(`.${ALLOWED_ROOT_DOMAIN}`);
}

function parseTargetUrl(request) {
  const url = new URL(request.url);
  const value = url.searchParams.get("url");
  if (!value) return null;

  const target = new URL(value);

  if (target.protocol !== "https:") {
    throw new Error("Only HTTPS URLs are allowed.");
  }

  if (!isAllowedHost(target.hostname)) {
    throw new Error("Only crazygames.com and its subdomains are allowed.");
  }

  return target;
}

function withCors(response) {
  const headers = new Headers(response.headers);
  headers.set("access-control-allow-origin", "*");
  headers.set("access-control-allow-methods", "GET, HEAD, OPTIONS");
  headers.set("access-control-allow-headers", "Content-Type");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return withCors(new Response(null, { status: 204 }));
    }

    if (!["GET", "HEAD"].includes(request.method)) {
      return withCors(new Response("Only GET and HEAD are supported.", { status: 405 }));
    }

    let target;
    try {
      target = parseTargetUrl(request);
    } catch (error) {
      return withCors(new Response(error.message, { status: 403 }));
    }

    if (!target) {
      return Response.redirect("https://www.crazygames.com/", 302);
    }

    const headers = new Headers(request.headers);
    headers.delete("cookie");
    headers.delete("authorization");
    headers.delete("host");
    headers.delete("accept-encoding");

    try {
      const upstream = await fetch(new Request(target, {
        method: request.method,
        headers,
        redirect: "manual",
      }));

      return withCors(upstream);
    } catch (error) {
      return withCors(new Response("Upstream request failed.", { status: 502 }));
    }
  },
};
