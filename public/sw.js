// HaresvaMi Service Worker — v1
// Bump this comment when making meaningful changes so the browser picks up the new SW.
// Handles: install/activate lifecycle + push notifications + notification click.
// Deliberately does NOT add caching or offline logic — that is a separate scope.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let title = "HaresvaMi";
  let body = "";
  let url = "/dashboard/insights";
  let tag = "weekly-insight";

  if (event.data) {
    try {
      const payload = event.data.json();
      title = payload.title ?? title;
      body = payload.body ?? body;
      url = payload.url ?? url;
      tag = payload.tag ?? tag;
    } catch {
      body = event.data.text();
    }
  }

  const options = {
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag,
    data: { url },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl =
    event.notification.data && event.notification.data.url
      ? event.notification.data.url
      : "/dashboard";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          const clientUrl = new URL(client.url);
          const targetUrlObj = new URL(targetUrl, self.location.origin);

          if (
            clientUrl.pathname === targetUrlObj.pathname &&
            "focus" in client
          ) {
            return client.focus();
          }
        }

        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      }),
  );
});
