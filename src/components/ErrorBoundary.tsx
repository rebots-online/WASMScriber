'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can log the error to an error reporting service
    console.log('Error caught by ErrorBoundary:', error);
    console.log('Error info:', errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Check if the error is related to crypto extensions
      const errorMessage = this.state.error?.message || '';
      const isCryptoWalletError = errorMessage.includes('wallet') || 
                                errorMessage.includes('ethereum') || 
                                errorMessage.includes('web3') ||
                                errorMessage.includes('crypto');
      
      // If it's likely a crypto wallet error, show a friendlier message
      if (isCryptoWalletError) {
        return this.props.fallback || (
          <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
            <h3 className="font-medium text-yellow-800">Notice</h3>
            <p className="text-yellow-700">
              This application may have compatibility issues with some browser extensions (like crypto wallets).
              The application will continue to function normally.
            </p>
          </div>
        );
      }
      
      // Otherwise show generic error fallback
      return this.props.fallback || (
        <div className="p-4 border border-red-300 bg-red-50 rounded-md">
          <h3 className="font-medium text-red-800">Something went wrong</h3>
          <p className="text-red-700">The application encountered an unexpected error.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;