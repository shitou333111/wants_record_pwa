// 动态生成缓存名称，根据当前路径隔离缓存
const getCacheName = () => {
  const pathParts = window.location.pathname.split('/');
  const cachePrefix = 'emotion-record-cache-v1';
  
  // 如果路径中包含 'previews'，则使用预览版缓存名称
  if (pathParts.includes('previews')) {
    const prNumber = pathParts[pathParts.indexOf('previews') + 1];
    return `${cachePrefix}-preview-${prNumber}`;
  }
  
  // 否则使用稳定版缓存名称
  return `${cachePrefix}-stable`;
};

const CACHE_NAME = getCacheName();
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './pwa-192x192.png',
  './pwa-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});