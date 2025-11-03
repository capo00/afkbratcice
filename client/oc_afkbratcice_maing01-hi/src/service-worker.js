self.addEventListener("fetch", (event) => {
  // block all requests to uuidentity.plus4u.net
  const isBlocked = event.request.url.startsWith("https://uuidentity.plus4u.net");

  if (isBlocked) {
    event.respondWith(
      new Response("Request blocked by Service Worker", {
        status: 403,
        statusText: "Forbidden",
        headers: { "Content-Type": "text/plain" },
      }),
    );
    return;
  }

  // Allow all other requests to proceed
  event.respondWith(fetch(event.request));
});
