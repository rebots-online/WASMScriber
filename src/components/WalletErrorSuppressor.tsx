'use client';

import { useEffect } from 'react';
import { initWalletErrorHandling, detectWalletExtensions } from '../lib/utils/walletErrorHandler';

export default function WalletErrorSuppressor() {
  useEffect(() => {
    // Initialize wallet error handling
    initWalletErrorHandling();
    
    // Log if wallet extensions are detected
    const hasWalletExtensions = detectWalletExtensions();
    if (hasWalletExtensions) {
      console.log('Crypto wallet extensions detected. Error suppression active.');
    }
  }, []);

  // This component doesn't render anything
  return null;
}