const CACHE_NAME = "knoux-smartorganizer-v2.0.0";
const urlsToCache = [
  "/",
  "/static/js/bundle.js",
  "/static/css/main.css",
  "/manifest.json",
  "/icon-192x192.png",
  "/icon-512x512.png",
  // AI Models - cache essential models only
  "/models/mobilenet/model.json",
  "/models/face-api/ssd_mobilenetv1_model-weights_manifest.json",
  "/models/face-api/face_landmark_68_model-weights_manifest.json",
];

// Install Service Worker
self.addEventListener("install", (event) => {
  console.log("🚀 Service Worker: Installing...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("📦 Service Worker: Caching files");
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log("✅ Service Worker: All files cached");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("❌ Service Worker: Caching failed", error);
      }),
  );
});

// Activate Service Worker
self.addEventListener("activate", (event) => {
  console.log("🔄 Service Worker: Activating...");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("🗑️ Service Worker: Deleting old cache", cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => {
        console.log("✅ Service Worker: Activated");
        return self.clients.claim();
      }),
  );
});

// Fetch Strategy - Network First with Cache Fallback for AI models
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Handle AI models with cache-first strategy
  if (url.pathname.includes("/models/")) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          console.log(
            "📋 Service Worker: Serving AI model from cache:",
            url.pathname,
          );
          return response;
        }

        return fetch(request)
          .then((response) => {
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            console.warn(
              "⚠️ Service Worker: Failed to fetch AI model:",
              url.pathname,
            );
            // Return offline fallback for AI models
            return new Response(
              JSON.stringify({ error: "Model not available offline" }),
              {
                status: 503,
                statusText: "Service Unavailable",
                headers: { "Content-Type": "application/json" },
              },
            );
          });
      }),
    );
    return;
  }

  // Handle image analysis requests
  if (url.pathname.includes("/api/") || url.pathname.includes("/analyze")) {
    event.respondWith(
      fetch(request).catch(() => {
        console.log("📱 Service Worker: API offline, using fallback");
        return new Response(
          JSON.stringify({
            error: "offline",
            message: "التطبيق يعمل في وضع عدم الاتصال",
            fallback: true,
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          },
        );
      }),
    );
    return;
  }

  // Default strategy: Network first, cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone response before caching
        const responseClone = response.clone();

        if (response.status === 200 && request.method === "GET") {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }

        return response;
      })
      .catch(() => {
        return caches.match(request).then((response) => {
          if (response) {
            console.log("📋 Service Worker: Serving from cache:", url.pathname);
            return response;
          }

          // Return offline page for navigation requests
          if (request.mode === "navigate") {
            return caches.match("/").then((response) => {
              return (
                response ||
                new Response(
                  `<!DOCTYPE html>
                  <html dir="rtl" lang="ar">
                  <head>
                    <meta charset="utf-8">
                    <title>Knoux SmartOrganizer - غير متصل</title>
                    <meta name="viewport" content="width=device-width,initial-scale=1">
                    <style>
                      body { 
                        font-family: system-ui, sans-serif; 
                        text-align: center; 
                        padding: 2rem;
                        background: linear-gradient(135deg, #6366f1, #8b5cf6);
                        color: white;
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex-direction: column;
                      }
                      .logo { font-size: 3rem; margin-bottom: 1rem; }
                      .message { font-size: 1.2rem; margin-bottom: 2rem; }
                      .retry-btn { 
                        background: white; 
                        color: #6366f1; 
                        border: none; 
                        padding: 1rem 2rem; 
                        border-radius: 0.5rem; 
                        font-size: 1rem;
                        cursor: pointer;
                      }
                    </style>
                  </head>
                  <body>
                    <div class="logo">🧠📸</div>
                    <h1>Knoux SmartOrganizer</h1>
                    <div class="message">
                      التطبيق يعمل في وضع عدم الاتصال<br>
                      بعض الميزات قد تكون غير متاحة
                    </div>
                    <button class="retry-btn" onclick="window.location.reload()">
                      🔄 إعادة المحاولة
                    </button>
                    <script>
                      // Auto-retry when online
                      window.addEventListener('online', () => {
                        window.location.reload();
                      });
                    </script>
                  </body>
                  </html>`,
                  {
                    headers: { "Content-Type": "text/html" },
                  },
                )
              );
            });
          }

          throw new Error("No cache match found");
        });
      }),
  );
});

// Handle background sync for image analysis
self.addEventListener("sync", (event) => {
  console.log("🔄 Service Worker: Background sync triggered");
  if (event.tag === "background-analysis") {
    event.waitUntil(performBackgroundAnalysis());
  }
});

// Handle push notifications
self.addEventListener("push", (event) => {
  console.log("🔔 Service Worker: Push notification received");

  const options = {
    body: event.data ? event.data.text() : "اكتمل تحليل الصور",
    icon: "/icon-192x192.png",
    badge: "/badge-72x72.png",
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "عرض النتائج",
        icon: "/action-explore.png",
      },
      {
        action: "close",
        title: "إغلاق",
        icon: "/action-close.png",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification("Knoux SmartOrganizer", options),
  );
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("👆 Service Worker: Notification clicked");
  event.notification.close();

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/?action=view-results"));
  } else if (event.action === "close") {
    // Just close, do nothing
  } else {
    // Default action - open app
    event.waitUntil(clients.openWindow("/"));
  }
});

// Handle share target
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.pathname === "/share-images" && event.request.method === "POST") {
    event.respondWith(handleSharedImages(event.request));
  }
});

async function handleSharedImages(request) {
  console.log("📤 Service Worker: Handling shared images");

  try {
    const formData = await request.formData();
    const images = formData.getAll("images");

    // Store shared images in IndexedDB for the app to process
    if (images.length > 0) {
      // Open a client window to handle the shared images
      const clients = await self.clients.matchAll();
      if (clients.length > 0) {
        clients[0].postMessage({
          type: "SHARED_IMAGES",
          images: images,
        });
        return Response.redirect("/?shared=true", 303);
      } else {
        return Response.redirect("/", 303);
      }
    }

    return Response.redirect("/", 303);
  } catch (error) {
    console.error("❌ Service Worker: Error handling shared images:", error);
    return Response.redirect("/", 303);
  }
}

async function performBackgroundAnalysis() {
  console.log("🔍 Service Worker: Performing background analysis");

  try {
    // Get pending analysis tasks from IndexedDB
    // This would integrate with the main app's analysis queue

    // For now, just show a completion notification
    self.registration.showNotification("Knoux SmartOrganizer", {
      body: "اكتمل التحليل في الخلفية",
      icon: "/icon-192x192.png",
      tag: "analysis-complete",
    });
  } catch (error) {
    console.error("❌ Service Worker: Background analysis failed:", error);
  }
}

// Handle message from main app
self.addEventListener("message", (event) => {
  console.log("💬 Service Worker: Message received:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

console.log("🎯 Service Worker: Script loaded successfully");
