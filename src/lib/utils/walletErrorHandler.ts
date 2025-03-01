'use client';

/**
 * Utility to help handle and suppress crypto wallet extension errors
 */

// Check if we're in the browser environment
const isBrowser = typeof window !== 'undefined';

// Common wallet extension detected properties
const WALLET_PROPERTIES = [
  'ethereum',
  'web3',
  'solana',
  'phantom',
  'metamask',
  'coinbase',
  'walletConnect',
  'trustWallet'
];

/**
 * Detect if crypto wallet extensions are present
 */
export const detectWalletExtensions = (): boolean => {
  if (!isBrowser) return false;
  
  // Check for common wallet extension injected objects
  return WALLET_PROPERTIES.some(prop => 
    window[prop as keyof Window] !== undefined
  );
};

/**
 * Patch window object to avoid errors from crypto extensions
 * This creates empty placeholder objects for wallet APIs
 * that may conflict with your application
 */
export const patchWindowForWallets = (): void => {
  if (!isBrowser) return;
  
  // Create a safe proxy for wallet objects to prevent errors
  const createSafeProxy = () => {
    return new Proxy({}, {
      get: (_, prop) => {
        // Return a no-op function for any method call
        if (typeof prop === 'string') {
          return typeof prop === 'string' && prop.startsWith('on') 
            ? null 
            : () => Promise.resolve(null);
        }
        return undefined;
      }
    });
  };
  
  // Only patch if not already defined
  if (typeof window.ethereum === 'undefined') {
    // Use Object.defineProperty to prevent extensions from overwriting
    try {
      Object.defineProperty(window, 'ethereum', {
        value: createSafeProxy(),
        writable: false,
        configurable: true
      });
    } catch (e) {
      console.log('Failed to patch ethereum object:', e);
    }
  }
  
  // Similar patches can be added for other wallet APIs if needed
};

/**
 * Initialize error handling for wallet extensions
 */
export const initWalletErrorHandling = (): void => {
  if (!isBrowser) return;
  
  // Add global error handler for uncaught crypto wallet errors
  const originalOnError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    // Filter out crypto wallet related errors
    if (typeof message === 'string' && 
        (message.includes('wallet') || 
         message.includes('ethereum') || 
         message.includes('web3') ||
         message.includes('crypto'))) {
      console.log('Suppressed wallet extension error:', message);
      return true; // Prevents the error from bubbling up
    }
    
    // Call original handler for other errors
    if (originalOnError) {
      return originalOnError(message, source, lineno, colno, error);
    }
    return false;
  };
  
  // Attempt to patch window objects
  patchWindowForWallets();
};