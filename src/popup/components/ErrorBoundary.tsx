import { Component, ErrorInfo, ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <h2 className="mb-2 font-semibold text-red-800">Something went wrong</h2>
          <p className="text-sm text-red-600">{this.state.error?.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 mt-3 text-sm text-white bg-red-500 rounded hover:bg-red-600"
          >
            Reload Extension
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}