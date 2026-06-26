import { Component, ReactNode, ErrorInfo } from 'react';
import { RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-surface-elevated border border-border rounded-2xl p-8 text-center space-y-4">
              <div className="text-5xl">⚠️</div>
              <h2 className="text-xl font-bold">Xəta baş verdi</h2>
              <p className="text-foreground-muted text-sm">
                {this.state.error?.message || 'Tətbiq gözlənilməz bir xətayla qarşılaşdı'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-2xl font-semibold hover:bg-primary-600 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Yenidən cəhd et
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
