import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ErrorBoundary caught error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error Stack:', error.stack);
    
    // Zapisz błąd do localStorage dla diagnostyki
    const errorData = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    
    try {
      localStorage.setItem('last_error', JSON.stringify(errorData));
      
      // Wyślij błąd do endpointa diagnostycznego
      fetch('/api/diagnostics/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData)
      }).catch(err => console.error('Failed to send error to diagnostics:', err));
    } catch (e) {
      console.error('Failed to save error data:', e);
    }
    
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            <div className="retro-error-container">
              <div className="retro-error-header">
                <AlertTriangle className="retro-error-icon" />
                <h1 className="retro-error-title">
                  ERROR_404_BRAIN_NOT_FOUND
                </h1>
              </div>

              <div className="retro-error-content">
                <p className="retro-error-message">
                  🚨 SYSTEM MALFUNCTION DETECTED 🚨
                </p>
                <p className="retro-error-description">
                  Something went terribly wrong! Don't worry, even the best retro computers crash sometimes.
                </p>

                {this.state.error && (
                  <div className="retro-error-details">
                    <h3 className="retro-error-details-title">Technical Details:</h3>
                    <pre className="retro-error-stack">
                      <strong>Error:</strong> {this.state.error.message}
                      
                      <strong>Stack:</strong>
                      {this.state.error.stack}
                      
                      <strong>Component Stack:</strong>
                      {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </pre>
                    <div className="mt-4 text-sm opacity-70">
                      <p>Error ID: {new Date().getTime()}</p>
                      <p>Check browser console for more details</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="retro-error-actions">
                <button
                  onClick={this.handleReset}
                  className="retro-error-button retro-error-button-primary"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  REBOOT SYSTEM
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="retro-error-button retro-error-button-secondary"
                >
                  <Home className="w-4 h-4 mr-2" />
                  RETURN TO BASE
                </button>
              </div>

              <div className="retro-error-footer">
                <div className="retro-error-ascii">
╔══════════════════════════════════════╗
║  PRESS ANY KEY TO CONTINUE...        ║
║  C:\RETRO\ERRORS\UNEXPECTED.EXE      ║
╚══════════════════════════════════════╝
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}