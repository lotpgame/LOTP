// Minimal service worker — PWA "yüklenebilirlik" için bir fetch handler şart. Şimdilik ağ-öncelikli
// (çevrimdışı önbellek YOK; oyun sunucu-tabanlı olduğu için zaten ağ gerekir). İleride offline eklenebilir.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {
  // Pass-through: isteği tarayıcıya bırak (respondWith çağırmıyoruz).
});
