const CACHE_NAME = 'curriculo-express-v2';

const STATIC_ASSETS = [
    './',
    './index.html',
    './css/styles.css',
    './js/ai-service.js',
    './js/data-storage.js',
    './js/form-handlers.js',
    './js/resume-generator.js',
    './js/export-utils.js',
    './js/realtime-preview.js',
    './js/main.js',
    './manifest.json',
    './assets/icon/icon.png',
    './assets/icon/icon_192.png',
    './assets/icon/icon_512.png',
    'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap',
    'https://unpkg.com/docx@7.1.0/build/index.js',
    'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js'
];

// Instalação do Service Worker & Pré-cache de arquivos essenciais
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Pré-carregando arquivos para uso offline...');
                return cache.addAll(STATIC_ASSETS).catch(err => {
                    console.warn('[SW] Aviso no pré-cache individual:', err);
                });
            })
            .then(() => self.skipWaiting())
    );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        console.log('[SW] Removendo cache antigo:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Interceptação de requisições com estratégia Cache First / Network Fallback
self.addEventListener('fetch', event => {
    const request = event.request;
    
    // Ignora chamadas de API do Gemini para não cachear erros de rede
    if (request.url.includes('generativelanguage.googleapis.com')) {
        return;
    }

    event.respondWith(
        caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
                // Atualiza o cache em background (Stale-while-revalidate)
                fetch(request).then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, networkResponse.clone());
                        });
                    }
                }).catch(() => {/* Offline */});
                
                return cachedResponse;
            }

            return fetch(request).then(networkResponse => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }

                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(request, responseToCache);
                });

                return networkResponse;
            }).catch(() => {
                // Se estiver completamente offline e for navegação HTML, entrega a página principal
                if (request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});