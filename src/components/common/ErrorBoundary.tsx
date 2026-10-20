import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  fallbackTitle?: string;
  fallbackDescription?: string;
  onRecover?: () => void;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log safely in developer console; never leak sensitive campaign state
    console.error('VadAllFate Workspace Error Boundary Caught Exception:', error, errorInfo);
  }

  handleRecover = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onRecover?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center p-6 bg-neutral-950 text-neutral-200">
          <div className="max-w-lg w-full p-6 rounded-lg bg-neutral-900 border border-amber-800/60 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-neutral-800 pb-3">
              <div className="p-2.5 rounded bg-amber-950/80 border border-amber-600/70 text-amber-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-cinzel text-amber-100">
                  {this.props.fallbackTitle || 'Workspace Exception Encountered'}
                </h3>
                <p className="text-xs text-neutral-400">
                  Application state preserved • Session remains active
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              {this.props.fallbackDescription ||
                'A rendering exception occurred in this workspace view. The error boundary prevented an application crash, and your underlying campaign session remains intact.'}
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={this.handleRecover}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-amber-700 hover:bg-amber-600 text-neutral-950 font-bold text-xs transition-colors shadow-md"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Recover to Play Workspace</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
