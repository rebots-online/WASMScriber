// Service worker to intercept and filter extension-related scripts
// This helps prevent wallet extensions from injecting scripts into the protected frame

const EXTENSION_PATTERNS = [
  /ethereum/i,
  /web3/i,
  /metamask/i,
  /wallet/i,
  /coinbase/i,
  /phantom/i,
  /solana/i
];

// List of known extension script URLs or patterns
const KNOWN_EXTENSION_URLS = [
  /chrome-extension:\/\/[a-z]+\/inpage\.js/i,
  /metamask.*\.js$/i,
  /inject\.js$/i,
  /inpage\.js$/i,
  /content-script\.js$/i
];

// Intercept fetch requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Check if the request is from a browser extension
  const isExtensionRequest = url.protocol === 'chrome-extension:' || 
                            url.protocol === 'moz-extension:' ||
                            KNOWN_EXTENSION_URLS.some(pattern => pattern.test(url.href));
  
  if (isExtensionRequest) {
    console.log('[Extension Filter] Blocking extension request:', url.href);
    
    // Return an empty response instead of the extension script
    event.respondWith(new Response('// Extension script blocked by service worker', {
      status: 200,
      headers: {'Content-Type': 'application/javascript'}
    }));
    return;
  }
  
  // Allow all other requests to pass through normally
  // This is important for the web app to function properly
});

// Service worker installation
self.addEventListener('install', (event) => {
  console.log('[Extension Filter] Service Worker installed');
  self.skipWaiting();
});

// Service worker activation
self.addEventListener('activate', (event) => {
  console.log('[Extension Filter] Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Listen for messages from the main page
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PING') {
    event.ports[0].postMessage({
      type: 'PONG',
      status: 'Extension filter service worker is active'
    });
  }
});