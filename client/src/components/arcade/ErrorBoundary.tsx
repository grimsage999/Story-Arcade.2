import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  onGoHome?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * GameErrorFallback - A friendly error display for game-related crashes
 * Shows a retry button and option to return to home
 */
interface GameErrorFallbackProps {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  onRetry: () => void;
  onGoHome?: () => void;
}

export function GameErrorFallback({ error, errorInfo, onRetry, onGoHome }: GameErrorFallbackProps) {
  return (
    <div
      className="flex flex-col items-center justify-center p-8 bg-card border border-card-border rounded-lg text-center min-h-[300px]"
      role="alert"
      aria-live="assertive"
    >
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-destructive" aria-hidden="true" />
      </div>

      <h3 className="font-display text-xl text-foreground mb-2">
        Oops! Something went wrong
      </h3>

      <p className="text-muted-foreground font-mono text-sm mb-6 max-w-md">
        The game encountered an unexpected error. Don't worry - your story is safe!
      </p>

      {process.env.NODE_ENV === 'development' && error && (
        <details className="mb-6 text-left w-full max-w-md">
          <summary className="cursor-pointer text-xs text-muted-foreground font-mono mb-2">
            Error Details (dev only)
          </summary>
          <pre className="bg-muted/50 p-3 rounded text-xs overflow-auto max-h-40 text-destructive">
            {error.message}
            {errorInfo?.componentStack && (
              <>
                {'\n\nComponent Stack:'}
                {errorInfo.componentStack}
              </>
            )}
          </pre>
        </details>
      )}

      <div className="flex gap-3">
        <Button
          onClick={onRetry}
          className="font-mono uppercase tracking-widest"
          data-testid="button-retry-game"
        >
          <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
          Try Again
        </Button>

        {onGoHome && (
          <Button
            variant="outline"
            onClick={onGoHome}
            className="font-mono uppercase tracking-widest"
            data-testid="button-go-home"
          >
            <Home className="w-4 h-4 mr-2" aria-hidden="true" />
            Go Home
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * ErrorBoundary - A reusable React error boundary component
 * Catches JavaScript errors in child components and displays a fallback UI
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });

    // Log error for debugging
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);

    // In production, you could send this to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service (e.g., Sentry)
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onReset?.();
  };

  handleGoHome = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onGoHome?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default to GameErrorFallback
      return (
        <GameErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleReset}
          onGoHome={this.props.onGoHome ? this.handleGoHome : undefined}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
