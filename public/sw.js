// Stolen from AI because I don't want to write this
// Prompt used: "write me a simple async wrapper for indexeddb"
class IndexedDBWrapper {
  constructor(dbName, version) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  // Open the database
  open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        reject(`Error opening database: ${event.target.error}`);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        // Example: Create an object store (table) if it doesn't exist
        if (!db.objectStoreNames.contains("tracks")) {
          db.createObjectStore("tracks", {
            keyPath: "id",
          });
        }
        if (!db.objectStoreNames.contains("data")) {
          db.createObjectStore("data");
        }
      };
    });
  }

  // Add a record
  add(storeName, data, key = undefined) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      let request;
      if (key) {
        request = store.put(data, key);
      } else {
        request = store.put(data);
      }

      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) =>
        reject(`Error adding record: ${event.target.error}`);
    });
  }

  // Get a record by ID
  get(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) =>
        reject(`Error getting record: ${event.target.error}`);
    });
  }

  // Update a record
  update(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) =>
        reject(`Error updating record: ${event.target.error}`);
    });
  }

  // Delete a record by ID
  delete(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = (event) =>
        reject(`Error deleting record: ${event.target.error}`);
    });
  }

  // Get all records from a store
  getAll(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) =>
        reject(`Error getting all records: ${event.target.error}`);
    });
  }

  // Clear all records from a store
  clear(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = (event) =>
        reject(`Error clearing store: ${event.target.error}`);
    });
  }
}

const db = new IndexedDBWrapper("spotioof", 3);

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

async function pullTrackIndex() {
  await db.open();

  try {
    const res = await fetch("/tracks");
    const tracks = await res.json();
    for (const track of tracks) {
      await db.add("tracks", track);
    }
  } catch {}

  const tracks = await db.getAll("tracks");

  const offlineMappedTracks = await Promise.all(
    tracks.map(async (track) => {
      const data = await db.get("data", track.id);
      return {
        ...track,
        offline: data != undefined,
      };
    })
  );

  return offlineMappedTracks;
}

async function pullTrackData(id) {
  await db.open();

  try {
    const res = await fetch(`/tracks/${id}`);
    const trackData = await res.arrayBuffer();
    await db.add("data", trackData, id);
  } catch {}

  const track = await db.get("data", id);
  if (!track) {
    return new Response("", { status: 404, statusText: "Music not found" });
  }

  const headers = new Headers();
  headers.append("Content-Type", "audio/mpeg");

  return new Response(track, { headers });
}

const specialFunctions = {
  "/update": async (_) => {
    await updateApplication();
    return new Response();
  },
  "/tracks": async (request) => {
    const url = new URL(request.url);

    // Root path is the list of tracks
    if (url.pathname == "/tracks") {
      const tracks = await pullTrackIndex();
      return new Response(JSON.stringify(tracks));
    }

    // Pull ID from /tracks/{id}
    const [_, __, id] = url.pathname.split("/");

    const trackData = await pullTrackData(id);
    return trackData;
  },
};

const specialFunctionTriggers = Object.keys(specialFunctions);

const putInCache = async (request, response) => {
  const cache = await caches.open("v1");
  await cache.put(request, response);
};

const cacheFirst = async (request) => {
  const urlObj = new URL(request.url);
  const specialFunctionTriggerWord = specialFunctionTriggers.find((e) =>
    urlObj.pathname.startsWith(e)
  );
  if (specialFunctionTriggerWord) {
    try {
      return await specialFunctions[specialFunctionTriggerWord](request);
    } catch (e) {
      return new Response(e, { status: 400 });
    }
  }

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
