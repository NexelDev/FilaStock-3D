const CACHE_NAME = 'filastock-v3';
const ASSETS = ['./', './index.html', './style.css', './app.js', './manifest.json', './logo.png'];

// Installation : force le Service Worker à s'activer tout de suite
self.addEventListener('install', e => {
    self.skipWaiting();
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

// Activation : Nettoie impitoyablement les vieux caches (adieu la V1 et V2 !)
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys.map(key => {
                if (key !== CACHE_NAME) return caches.delete(key);
            }));
        })
    );
});

// Interception des requêtes (Stratégie "Network First")
self.addEventListener('fetch', e => {
    e.respondWith(
        fetch(e.request)
            .then(response => {
                // Si on a du réseau, on met à jour le cache discrètement avec les nouveaux fichiers
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(e.request, responseClone));
                return response;
            })
            .catch(() => {
                // Si on est hors-ligne (ou que le serveur est coupé), on ressort le cache
                return caches.match(e.request);
            })
    );
});