// Versión del caché
const CACHE_VERSION = '1.0';
const CACHE_NAME = 'simulador-espacial-v' + CACHE_VERSION;

// Archivos a cachear
const CACHE_FILES = [
    '/',
    '/index.html',
    '/js/simulacion3D.min.js',
    '/js/fisicaNave.min.js',
    '/js/mapaSolar.min.js',
    '/js/sonidos.min.js',
    '/js/multijugador.min.js',
    '/assets/textures/sun.jpg',
    '/assets/textures/earth.jpg',
    '/assets/textures/mars.jpg',
    '/assets/textures/metal.jpg',
    '/assets/textures/solar_panel.jpg',
    '/assets/sounds/liftoff.mp3',
    '/assets/sounds/engine.mp3',
    '/assets/sounds/space.mp3',
    '/assets/sounds/landing.mp3'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(CACHE_FILES);
            })
    );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Interceptar peticiones
self.addEventListener('fetch', (event) => {
    // Ignorar peticiones WebSocket
    if (event.request.url.startsWith('ws://') || event.request.url.startsWith('wss://')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Retornar respuesta cacheada si existe
                if (response) {
                    return response;
                }

                // Clonar la petición
                const fetchRequest = event.request.clone();

                // Realizar petición de red
                return fetch(fetchRequest).then((response) => {
                    // Verificar si la respuesta es válida
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clonar la respuesta
                    const responseToCache = response.clone();

                    // Guardar en caché
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            })
    );
}); 