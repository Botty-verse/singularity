/* Botty-verse service worker — Web Push for adopted Bottys.
   Receives push payloads {title, body, url, tag} and shows a notification;
   clicking it focuses an open tab or opens the given url. */

self.addEventListener("push", function (event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = {}; }
  var title = data.title || "Botty-verse";
  var options = {
    body: data.body || "",
    tag: data.tag || undefined,
    icon: "https://hive.ramonmoorlag.nl/assets/banner.webp",
    badge: "https://hive.ramonmoorlag.nl/assets/banner.webp",
    data: { url: data.url || "https://construct.ramonmoorlag.nl" }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || "https://construct.ramonmoorlag.nl";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].url.indexOf(url) === 0 && "focus" in list[i]) return list[i].focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
