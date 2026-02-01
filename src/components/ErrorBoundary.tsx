// Error Boundary Component
// Catches JavaScript errors anywhere in the child component tree

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({ errorInfo })
    
    // Call optional onError callback
    this.props.onError?.(error, errorInfo)
    
    // Log to external service in production
    if (import.meta.env.PROD) {
      // TODO: Send to error tracking service (Sentry, etc.)
      console.error('[Jawir OS] Error reported:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      })
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-coffee-dark flex items-center justify-center p-4">
          <div className="bg-cream rounded-2xl p-8 max-w-lg w-full shadow-xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-error text-3xl">error</span>
              </div>
              <h1 className="text-2xl font-bold text-coffee-dark mb-2">
                Waduh, ada kesalahan!
              </h1>
              <p className="text-coffee-medium">
                Maaf Mas, aplikasi mengalami error. Silakan coba lagi.
              </p>
            </div>

            {/* Error Details (dev mode only) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="bg-coffee-dark rounded-xl p-4 mb-6 overflow-auto max-h-48">
                <p className="text-error font-mono text-sm mb-2">
                  {this.state.error.message}
                </p>
                <pre className="text-cream-muted font-mono text-xs whitespace-pre-wrap">
                  {this.state.error.stack}
                </pre>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 bg-primary text-coffee-dark font-bold py-3 rounded-xl hover:bg-primary-light transition-colors"
              >
                Coba Lagi
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-coffee-light text-coffee-dark font-medium py-3 rounded-xl hover:bg-coffee-medium/50 transition-colors"
              >
                Muat Ulang
              </button>
            </div>

            {/* Help text */}
            <p className="text-xs text-coffee-light mt-4 text-center">
              Jika masalah berlanjut, silakan restart aplikasi atau hubungi developer.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// HOC for functional components
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    )
  }
}

// Smaller error boundary for sections
export function SectionErrorBoundary({ 
  children, 
  sectionName = 'komponen' 
}: { 
  children: ReactNode
  sectionName?: string 
}) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 bg-error/5 border border-error/20 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-error">warning</span>
            <div>
              <p className="text-coffee-dark font-medium">
                Error memuat {sectionName}
              </p>
              <p className="text-sm text-coffee-medium">
                Silakan refresh halaman
              </p>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}
