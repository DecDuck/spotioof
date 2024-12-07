const addResourcesToCache = async (resources) => {
  const cache = await caches.open("v1");
  await cache.addAll(resources);
};

const updateApplication = async () =>
  await addResourcesToCache([
    "/",
    "/css/_index.css",
    "/js/adm.js",
    "/js/index.js",
  ]);

self.addEventListener("install", (event) => {
  event.waitUntil(updateApplication());
});

const putInCache = async (request, response) => {
  const cache = await caches.open("v1");
  await cache.put(request, response);
};

const cacheFirst = async (request) => {
  const responseFromCache = await caches.match(request);
  if (responseFromCache) {
    return responseFromCache;
  }

  const responseFromNetwork = await fetch(request);
  if (!/^https?:$/i.test(new URL(request.url).protocol)) {
    putInCache(request, responseFromNetwork.clone());
  }

  return responseFromNetwork;
};

self.addEventListener("fetch", (event) => {
  event.respondWith(cacheFirst(event.request));
});
