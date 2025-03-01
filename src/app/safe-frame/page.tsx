'use client';

import { useEffect, useState } from 'react';
import ExtensionSafeFrame from '../../components/ExtensionSafeFrame';

export default function SafeFrameWrapper() {
  const [url, setUrl] = useState('https://bolt.new');
  const [customUrl, setCustomUrl] = useState('');
  const [serviceWorkerActive, setServiceWorkerActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Register the service worker when the component mounts
  useEffect(() => {
    const registerServiceWorker = async () => {
      try {
        setLoading(true);
        
        // Check if service workers are supported
        if ('serviceWorker' in navigator) {
          // Register the extension filter service worker
          const registration = await navigator.serviceWorker.register('/extension-filter-sw.js', {
            scope: '/safe-frame/'
          });
          
          console.log('Service Worker registered with scope:', registration.scope);
          
          // Wait for the service worker to be activated
          if (registration.active) {
            setServiceWorkerActive(true);
          } else {
            // If not immediately active, wait for the state change
            const serviceWorker = registration.installing || registration.waiting;
            
            if (serviceWorker) {
              serviceWorker.addEventListener('statechange', (event) => {
                if (serviceWorker.state === 'activated') {
                  setServiceWorkerActive(true);
                }
              });
            }
          }
          
          // Ping the service worker to check if it's active
          if (navigator.serviceWorker.controller) {
            const messageChannel = new MessageChannel();
            
            messageChannel.port1.onmessage = (event) => {
              if (event.data && event.data.type === 'PONG') {
                console.log('Service worker response:', event.data.status);
                setServiceWorkerActive(true);
              }
            };
            
            navigator.serviceWorker.controller.postMessage(
              { type: 'PING' },
              [messageChannel.port2]
            );
          }
        } else {
          setError('Service Workers are not supported in this browser.');
        }
      } catch (err) {
        console.error('Service worker registration failed:', err);
        setError(`Failed to register service worker: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };
    
    registerServiceWorker();
    
    // Cleanup function
    return () => {
      // Unregister service worker when component unmounts
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          for (let registration of registrations) {
            if (registration.scope.includes('/safe-frame/')) {
              registration.unregister();
              console.log('Service Worker unregistered');
            }
          }
        });
      }
    };
  }, []);
  
  // Handle URL form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrl) {
      try {
        // Basic URL validation
        new URL(customUrl); // Will throw if invalid
        setUrl(customUrl);
      } catch (err) {
        setError('Please enter a valid URL including http:// or https://');
      }
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Extension-Safe Application Wrapper</h1>
      
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <p className="text-sm">
          This wrapper creates a protected environment that helps prevent crypto wallet extensions from 
          interfering with web applications like code editors and development environments.
        </p>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-2">Setting up protected environment...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <div className={`p-2 rounded ${serviceWorkerActive ? 'bg-green-100' : 'bg-yellow-100'}`}>
              <span className="font-semibold">Status:</span> {serviceWorkerActive 
                ? '✅ Extension protection active' 
                : '⚠️ Basic protection only (service worker not active)'}
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="Enter application URL (e.g., https://bolt.new)"
                className="flex-grow px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Load Application
              </button>
            </div>
          </form>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Protected Application</h2>
            <ExtensionSafeFrame 
              url={url}
              title={`Protected: ${url}`}
              height="800px"
              className="border rounded shadow-lg"
              sandboxPermissions={[
                'allow-scripts',
                'allow-same-origin',
                'allow-forms',
                'allow-popups',
                'allow-popups-to-escape-sandbox',
                'allow-downloads',
                'allow-modals'
              ]}
            />
          </div>
          
          <div className="text-sm text-gray-500 mt-4">
            <p><strong>Note:</strong> Some applications may require additional permissions to work properly in the sandboxed environment.</p>
            <p>If you experience issues, try opening the application directly and using our WalletErrorSuppressor component instead.</p>
          </div>
        </>
      )}
    </div>
  );
}