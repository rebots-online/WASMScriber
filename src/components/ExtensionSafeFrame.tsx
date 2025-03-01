'use client';

import React, { useState, useRef, useEffect } from 'react';

interface ExtensionSafeFrameProps {
  url: string;
  title?: string;
  width?: string | number;
  height?: string | number;
  className?: string;
  sandboxPermissions?: string[];
}

/**
 * A component that wraps external web applications in a protected iframe environment
 * to prevent crypto wallet and other extension-related errors from affecting them.
 */
export default function ExtensionSafeFrame({
  url,
  title = 'External Application',
  width = '100%',
  height = '600px',
  className = '',
  sandboxPermissions = ['allow-scripts', 'allow-same-origin', 'allow-forms', 'allow-popups']
}: ExtensionSafeFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Create a sandbox attribute based on permissions
  const sandboxAttribute = sandboxPermissions.join(' ');

  useEffect(() => {
    const handleIframeLoad = () => {
      setIsLoaded(true);
      
      // Get access to the iframe's window if possible
      try {
        const iframeWindow = iframeRef.current?.contentWindow;
        
        if (iframeWindow) {
          // Create clean environment for the iframe content to prevent extension interference
          // This is limited by browser security constraints and same-origin policy
          const cleanProps = ['ethereum', 'web3', 'solana', 'phantom', 'metamask'];
          
          cleanProps.forEach(prop => {
            try {
              // Attempt to set these properties to undefined or empty objects
              // Note: This might not work due to cross-origin restrictions
              if (iframeWindow.hasOwnProperty(prop)) {
                console.log(`Attempting to clean ${prop} in iframe`);
                // @ts-ignore - dynamic property access
                iframeWindow[prop] = undefined;
              }
            } catch (e) {
              console.log(`Unable to modify ${prop} in iframe:`, e);
            }
          });
        }
      } catch (e) {
        console.log('Unable to access iframe window due to cross-origin restrictions');
      }
    };

    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('load', handleIframeLoad);
      
      return () => {
        iframe.removeEventListener('load', handleIframeLoad);
      };
    }
  }, []);

  // Generate a unique name for the iframe to isolate it further
  const iframeName = `safe-frame-${Math.random().toString(36).substring(2)}`;

  return (
    <div className={`extension-safe-frame-container ${className}`}>
      <div className="safe-frame-header mb-2 flex justify-between items-center">
        <h3 className="text-lg font-medium">{title}</h3>
        {!isLoaded && (
          <div className="loading-indicator text-sm text-gray-500">
            Loading protected environment...
          </div>
        )}
      </div>
      
      <div className="safe-frame-wrapper relative" style={{ width, height }}>
        <iframe
          ref={iframeRef}
          src={url}
          name={iframeName}
          title={title}
          sandbox={sandboxAttribute}
          className="w-full h-full border border-gray-200 rounded-md"
          style={{ opacity: isLoaded ? 1 : 0.6 }}
        />
        
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75">
            <div className="loading-spinner border-t-2 border-blue-500 rounded-full w-6 h-6 animate-spin"></div>
          </div>
        )}
      </div>
      
      <div className="safe-frame-footer mt-2 text-xs text-gray-500">
        This application is running in a protected sandbox to prevent extension conflicts.
      </div>
    </div>
  );
}